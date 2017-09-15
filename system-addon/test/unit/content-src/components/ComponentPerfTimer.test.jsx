const React = require("react");
const {shallow} = require("enzyme");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");
const createMockRaf = require("mock-raf");
const ComponentPerfTimer = require("content-src/components/ComponentPerfTimer/ComponentPerfTimer");

const perfSvc = {
  mark() {},
  getMostRecentAbsMarkStartByName() {}
};

let DEFAULT_PROPS = {
  initialized: true,
  rows: [],
  id: "highlights",
  dispatch() {},
  intl: {formatMessage: x => x},
  perfSvc
};

describe("<ComponentPerfTimer>", () => {
  let mockRaf;
  let sandbox;
  let wrapper;

  const InnerEl = () => (<div>Inner Element</div>);

  beforeEach(() => {
    mockRaf = createMockRaf();
    sandbox = sinon.sandbox.create();
    sandbox.stub(window, "requestAnimationFrame").callsFake(mockRaf.raf);
    wrapper = shallow(<ComponentPerfTimer {...DEFAULT_PROPS}><InnerEl /></ComponentPerfTimer>);
  });
  afterEach(() => {
    sandbox.restore();
  });

  it("should render props.children", () => {
    assert.ok(wrapper.contains(<InnerEl />));
  });

  it("should have the correct defaults", () => {
    const instance = wrapper.instance();

    assert.isFalse(instance._reportMissingData);
    assert.isFalse(instance._timestampHandled);
  });

  describe("#_componentDidMount", () => {
    it("should call _maybeSendPaintedEvent", () => {
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_maybeSendPaintedEvent");

      instance.componentDidMount();

      assert.calledOnce(stub);
    });
  });

  describe("#_componentDidUpdate", () => {
    it("should call _maybeSendPaintedEvent", () => {
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_maybeSendPaintedEvent");

      instance.componentDidUpdate();

      assert.calledOnce(stub);
    });
  });

  describe("#_maybeSendPaintedEvent", () => {
    it("should call _afterFramePaint if props.initialized is true", () => {
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_afterFramePaint");

      instance._maybeSendPaintedEvent();

      assert.calledOnce(stub);
      assert.calledWithExactly(stub, instance._sendPaintedEvent);
      assert.isTrue(instance._timestampHandled);
    });
    it("should not call _afterFramePaint if props.id is not in RECORDED_SECTIONS", () => {
      sandbox.stub(DEFAULT_PROPS, "id").value("topstories");
      wrapper = shallow(<ComponentPerfTimer {...DEFAULT_PROPS}><InnerEl /></ComponentPerfTimer>);
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_afterFramePaint");

      instance._maybeSendPaintedEvent();

      assert.notCalled(stub);
    });
    it("should not call _afterFramePaint if this._timestampHandled is true", () => {
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_afterFramePaint");
      instance._timestampHandled = true;

      instance._maybeSendPaintedEvent();

      assert.notCalled(stub);
    });

    it("should set this._timestampHandled=true if false", () => {
      const instance = wrapper.instance();
      sandbox.stub(instance, "_afterFramePaint");

      assert.isFalse(instance._timestampHandled);

      instance._maybeSendPaintedEvent();

      assert.isTrue(instance._timestampHandled);
    });
    it("should set this._reportMissingData=true when called with initialized === false", () => {
      sandbox.stub(DEFAULT_PROPS, "initialized").value(false);
      wrapper = shallow(<ComponentPerfTimer {...DEFAULT_PROPS}><InnerEl /></ComponentPerfTimer>);
      const instance = wrapper.instance();

      assert.isFalse(instance._reportMissingData);

      instance._maybeSendPaintedEvent();

      assert.isTrue(instance._reportMissingData);
    });

    it("should call _afterFramePaint if initialized and _reportMissingData is true", () => {
      sandbox.stub(DEFAULT_PROPS, "initialized").value(true);
      const instance = wrapper.instance();
      const stub = sandbox.stub(instance, "_afterFramePaint");
      instance._reportMissingData = true;
      instance._timestampHandled = true;

      instance._maybeSendPaintedEvent();

      assert.calledOnce(stub);
      assert.calledWithExactly(stub, instance._sendBadStateEvent);
      assert.isFalse(instance._reportMissingData);
    });
  });

  describe("#_afterFramePaint", () => {
    it("should call callback after the requestAnimationFrame callback returns", done => {
      // Setting the callback to done is the test that it does finally get
      // called at the correct time, after the event loop ticks again.
      // If it doesn't get called, this test will time out.
      this.callback = () => done();
      sandbox.spy(this, "callback");

      const instance = wrapper.instance();

      instance._afterFramePaint(this.callback);

      assert.notCalled(this.callback);
      mockRaf.step({count: 1});
    });
  });

  describe("#_sendBadStateEvent", () => {
    it("should call perfSvc.mark", () => {
      sandbox.spy(perfSvc, "mark");
      const key = `${DEFAULT_PROPS.id}_data_ready_ts`; 

      wrapper.instance()._sendBadStateEvent();

      assert.calledOnce(perfSvc.mark);
      assert.calledWithExactly(perfSvc.mark, key);
    });

    it("should call compute the delta from first render to data ready", () => {
      sandbox.stub(perfSvc, "getMostRecentAbsMarkStartByName");

      wrapper.instance()._sendBadStateEvent(`${DEFAULT_PROPS.id}_data_ready_ts`);

      assert.calledTwice(perfSvc.getMostRecentAbsMarkStartByName);
      assert.calledWithExactly(perfSvc.getMostRecentAbsMarkStartByName, `${DEFAULT_PROPS.id}_data_ready_ts`);
      assert.calledWithExactly(perfSvc.getMostRecentAbsMarkStartByName, `${DEFAULT_PROPS.id}_first_painted_ts`);
    });

    it("should call dispatch TELEMETRY_UNDESIRED_EVENT", () => {
      sandbox.stub(perfSvc, "getMostRecentAbsMarkStartByName")
        .withArgs("highlights_first_painted_ts").returns(0.5)
        .withArgs("highlights_data_ready_ts")
        .returns(3.2);

      const dispatch = sandbox.spy(DEFAULT_PROPS, "dispatch");
      wrapper = shallow(<ComponentPerfTimer {...DEFAULT_PROPS}><InnerEl /></ComponentPerfTimer>);

      wrapper.instance()._sendBadStateEvent(`${DEFAULT_PROPS.id}_data_ready_ts`);

      assert.calledOnce(dispatch);
      assert.calledWithExactly(dispatch, ac.SendToMain({
        type: at.TELEMETRY_UNDESIRED_EVENT,
        data: {
          event: `${DEFAULT_PROPS.id}_missing_data`,
          value: 2 // Test that parseInt is called by checking the value.
        }
      }));
    });
  });
  describe("#_sendPaintedEvent", () => {
    it("should call mark with the correct id", () => {
      sandbox.stub(perfSvc, "mark");
      sandbox.stub(DEFAULT_PROPS, "id").value("fake_id");
      wrapper = shallow(<ComponentPerfTimer {...DEFAULT_PROPS}><InnerEl /></ComponentPerfTimer>);

      wrapper.instance()._sendPaintedEvent();

      assert.calledOnce(perfSvc.mark);
      assert.calledWithExactly(perfSvc.mark, "fake_id_first_painted_ts");
    });
    it("should not call getMostRecentAbsMarkStartByName if id!=topsites", () => {
      sandbox.stub(perfSvc, "getMostRecentAbsMarkStartByName");
      sandbox.stub(DEFAULT_PROPS, "id").value("fake_id");
      wrapper = shallow(<ComponentPerfTimer {...DEFAULT_PROPS}><InnerEl /></ComponentPerfTimer>);

      wrapper.instance()._sendPaintedEvent();

      assert.notCalled(perfSvc.getMostRecentAbsMarkStartByName);
    });
    it("should call getMostRecentAbsMarkStartByName for topsites", () => {
      sandbox.stub(perfSvc, "getMostRecentAbsMarkStartByName");
      sandbox.stub(DEFAULT_PROPS, "id").value("topsites");
      wrapper = shallow(<ComponentPerfTimer {...DEFAULT_PROPS}><InnerEl /></ComponentPerfTimer>);

      wrapper.instance()._sendPaintedEvent();

      assert.calledOnce(perfSvc.getMostRecentAbsMarkStartByName);
      assert.calledWithExactly(perfSvc.getMostRecentAbsMarkStartByName,
                               "topsites_first_painted_ts");
    });
    it("should dispatch SAVE_SESSION_PERF_DATA", () => {
      sandbox.stub(perfSvc, "getMostRecentAbsMarkStartByName").returns(42);
      sandbox.stub(DEFAULT_PROPS, "id").value("topsites");
      const dispatch = sandbox.spy(DEFAULT_PROPS, "dispatch");
      wrapper = shallow(<ComponentPerfTimer {...DEFAULT_PROPS}><InnerEl /></ComponentPerfTimer>);

      wrapper.instance()._sendPaintedEvent();

      assert.calledOnce(dispatch);
      assert.calledWithExactly(dispatch, ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {"topsites_first_painted_ts": 42}
      }));
    });
  });
});

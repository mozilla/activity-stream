const React = require("react");
const {shallow} = require("enzyme");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");
const createMockRaf = require("mock-raf");
const SectionsPerfTimer = require("content-src/components/Sections/SectionsPerfTimer");

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

describe("<SectionsPerfTimer>", () => {
  let mockRaf;
  let sandbox;
  let wrapper;

  const InnerEl = () => (<div>Inner Element</div>);

  beforeEach(() => {
    mockRaf = createMockRaf();
    sandbox = sinon.sandbox.create();
    sandbox.stub(window, "requestAnimationFrame").callsFake(mockRaf.raf);
    wrapper = shallow(<SectionsPerfTimer {...DEFAULT_PROPS}><InnerEl /></SectionsPerfTimer>);
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
      assert.isTrue(instance._timestampHandled);
    });
    it("should not call _afterFramePaint if props.id is not in RECORDED_SECTIONS", () => {
      sandbox.stub(DEFAULT_PROPS, "id").value("topstories");
      wrapper = shallow(<SectionsPerfTimer {...DEFAULT_PROPS}><InnerEl /></SectionsPerfTimer>);
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
      wrapper = shallow(<SectionsPerfTimer {...DEFAULT_PROPS}><InnerEl /></SectionsPerfTimer>);
      const instance = wrapper.instance();

      assert.isFalse(instance._reportMissingData);

      instance._maybeSendPaintedEvent();

      assert.isTrue(instance._reportMissingData);
    });

    it("should call _afterFramePaint if initialized and _reportMissingData is true", () => {
      sandbox.stub(DEFAULT_PROPS, "initialized").value(true);
      const instance = wrapper.instance();
      instance._reportMissingData = true;
      instance._timestampHandled = true;
      const stub = sandbox.stub(instance, "_afterFramePaint");

      instance._maybeSendPaintedEvent();

      assert.calledOnce(stub);
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

      wrapper.instance()._sendBadStateEvent("foo");

      assert.calledOnce(perfSvc.mark);
      assert.calledWithExactly(perfSvc.mark, "foo");
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
      wrapper = shallow(<SectionsPerfTimer {...DEFAULT_PROPS}><InnerEl /></SectionsPerfTimer>);

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
});

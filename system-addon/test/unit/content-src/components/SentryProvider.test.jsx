import {mount, shallow} from "enzyme";
import React from "react";
import {SentryProvider} from "content-src/components/SentryProvider/SentryProvider";

describe("<SentryProvider>", () => {
  let DEFAULT_PROPS;
  let fakeRaven;
  let ravenConfigRetval;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    ravenConfigRetval = {install: sinon.spy()};
    fakeRaven = {
      config: sinon.stub().returns(ravenConfigRetval),
      isSetup: sinon.stub().returns(false),
      uninstall: sinon.spy()
    };

    DEFAULT_PROPS = {
      fakeRaven,
      dataReportingUploadEnabled: false,
      initialized: false,
      telemetry: false
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render all children", () => {
    const wrapper = mount(
      <SentryProvider {...DEFAULT_PROPS}>
         <div className="world" />
         <div className="cat" />
      </SentryProvider>
    );

    assert.isTrue(wrapper.contains(
      // eslint-disable-next-line react/jsx-key
      [<div className="world" />, <div className="cat" />]));
  });

  it("should render no children if there are no children", () => {
    const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />);

    assert.lengthOf(wrapper.children(), 0);
  });

  describe("#componentDidMount", () => {
    it("should call this.maybeStartOrStopRaven", () => {
      const mStartStopSpy = sandbox.spy(SentryProvider.prototype, "maybeStartOrStopRaven");

      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />,
        {disableLifecycleMethods: true});
      wrapper.instance().componentDidMount();

      assert.calledOnce(mStartStopSpy);
      assert.calledWithExactly(mStartStopSpy);
    });
  });

  describe("#componentWillReceiveProps", () => {
    let mStartStopSpy;

    beforeEach(() => {
      mStartStopSpy = sandbox.spy(SentryProvider.prototype,
        "maybeStartOrStopRaven");
    });

    it("should call #maybeStartOrStopRaven when props.telemetry !== nextProps.telemetry", () => {
      const props = Object.assign({}, DEFAULT_PROPS, {telemetry: true});
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />,
        {disableLifecycleMethods: true});

      wrapper.instance().componentWillReceiveProps(props);

      assert.calledOnce(mStartStopSpy);
      assert.calledWithExactly(mStartStopSpy);
    });

    it("shouldn't call #maybeStartOrStopRaven when props.telemetry === nextProps.telemetry", () => {
      const props = Object.assign({}, DEFAULT_PROPS, {telemetry: true});
      const wrapper = shallow(<SentryProvider {...props} />,
        {disableLifecycleMethods: true});

      wrapper.instance().componentWillReceiveProps(props);

      assert.notCalled(mStartStopSpy);
    });

    it("should call #maybeStartOrStopRaven when props.initialized !== nextProps.initialized", () => {
      const props = Object.assign({}, DEFAULT_PROPS, {initialized: true});
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />,
        {disableLifecycleMethods: true});

      wrapper.instance().componentWillReceiveProps(props);

      assert.calledOnce(mStartStopSpy);
      assert.calledWithExactly(mStartStopSpy);
    });

    it("shouldn't call #maybeStartOrStopRaven when props.initialized === nextProps.initialized", () => {
      const props = Object.assign({}, DEFAULT_PROPS, {initialized: true});
      const wrapper = shallow(<SentryProvider {...props} />,
        {disableLifecycleMethods: true});

      wrapper.instance().componentWillReceiveProps(props);

      assert.notCalled(mStartStopSpy);
    });

    it("should call #maybeStartOrStopRaven when props.dataReportingUploadEnabled !== nextProps.dataReportingUploadEnabled", () => {
      const props = Object.assign({}, DEFAULT_PROPS, {dataReportingUploadEnabled: true});
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />,
        {disableLifecycleMethods: true});

      wrapper.instance().componentWillReceiveProps(props);

      assert.calledOnce(mStartStopSpy);
      assert.calledWithExactly(mStartStopSpy);
    });

    it("shouldn't call #maybeStartOrStopRaven when props.initialized === nextProps.initialized", () => {
      const props = Object.assign({}, DEFAULT_PROPS, {dataReportingUploadEnabled: true});
      const wrapper = shallow(<SentryProvider {...props} />,
        {disableLifecycleMethods: true});

      wrapper.instance().componentWillReceiveProps(props);

      assert.notCalled(mStartStopSpy);
    });
  });

  describe("#initializeRaven", () => {
    beforeEach(() => {
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />,
        {disableLifecycleMethods: true});

      wrapper.instance().initializeRaven();
    });

    it("should configure Raven with the given DSN and appropriate options", () => {
      assert.calledOnce(fakeRaven.config);
      assert.calledWithExactly(fakeRaven.config, sinon.match.string,
        {allowSecretKey: true});
    });

    it("should call install on the return value from Raven.config", () => {
      assert.calledOnce(ravenConfigRetval.install);
      assert.calledWithExactly(ravenConfigRetval.install);
    });
  });

  describe("#isRavenPrefEnabled", () => {
    const PrefsTable = [
      {initialized: true, telemetry: true, dataReportingUploadEnabled: true, expected: true},
      {initialized: false, telemetry: false, dataReportingUploadEnabled: false, expected: false},
      {initialized: false, telemetry: true, dataReportingUploadEnabled: true, expected: false},
      {initialized: true, telemetry: false, dataReportingUploadEnabled: true, expected: false},
      {initialized: true, telemetry: true, dataReportingUploadEnabled: false, expected: false}
    ];

    PrefsTable.forEach(Prefs => {
      it(`should return ${Prefs.expected} if props.initialized===${Prefs.initialized} && props.telemetry===${Prefs.telemetry} && props.dataReportingUploadEnabled===${Prefs.dataReportingUploadEnabled}`, () => {
        let PROPS = Object.assign({}, DEFAULT_PROPS, Prefs);
        const wrapper =
          shallow(<SentryProvider {...Prefs} {...PROPS} />);

        const isEnabled = wrapper.instance().isRavenPrefEnabled();

        assert.strictEqual(Prefs.expected, isEnabled);
      });
    });
  });

  describe("#maybeStartOrStopRaven", () => {
    it("should call #initializeRaven if #isRavenPrefEnabled is true and this.raven.isSetup() is false", () => {
      sandbox.stub(SentryProvider.prototype, "isRavenPrefEnabled").returns(true);
      const iRSpy = sandbox.spy(SentryProvider.prototype, "initializeRaven");
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />,
        {disableLifecycleMethods: true});

      wrapper.instance().maybeStartOrStopRaven();

      assert.calledOnce(iRSpy);
      assert.calledWithExactly(iRSpy);
    });

    it("should not call #initializeRaven if #isRavenPrefEnabled is true and this.raven.isSetup() is true", () => {
      fakeRaven.isSetup.returns(true);
      sandbox.stub(SentryProvider.prototype, "isRavenPrefEnabled").returns(true);
      const iRSpy = sandbox.spy(SentryProvider.prototype, "initializeRaven");
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />);

      wrapper.instance().maybeStartOrStopRaven();

      assert.notCalled(iRSpy);
    });

    it("should not call #initializeRaven if #isRavenPrefEnabled() is false", () => {
      sandbox.stub(SentryProvider.prototype, "isRavenPrefEnabled").returns(false);
      const iRSpy = sandbox.spy(SentryProvider.prototype, "initializeRaven");
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />);

      wrapper.instance().maybeStartOrStopRaven();

      assert.notCalled(iRSpy);
    });

    it("should call this.raven.uninstall if #isRavenPrefEnabled returns false and this.raven.isSetup() is true", () => {
      fakeRaven.isSetup.returns(true);
      sandbox.stub(SentryProvider.prototype, "isRavenPrefEnabled").returns(false);
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />,
        {disableLifecycleMethods: true});

      wrapper.instance().maybeStartOrStopRaven();

      assert.calledOnce(fakeRaven.uninstall);
      assert.calledWithExactly(fakeRaven.uninstall);
    });

    it("should not call this.raven.uninstall if #isRavenPrefEnabled returns false and this.raven.isSetup() is false", () => {
      sandbox.stub(SentryProvider.prototype, "isRavenPrefEnabled").returns(false);
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />);

      wrapper.instance().maybeStartOrStopRaven();

      assert.notCalled(fakeRaven.uninstall);
    });

    it("should not call this.raven.uninstall if #isRavenPrefEnabled() is true", () => {
      sandbox.stub(SentryProvider.prototype, "isRavenPrefEnabled").returns(true);
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />);

      wrapper.instance().maybeStartOrStopRaven();

      assert.notCalled(fakeRaven.uninstall);
    });
  });
});

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
    fakeRaven = {config: sinon.stub().returns(ravenConfigRetval)};

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
    it("should call this.maybeInitializeRaven", () => {
      const mIRSpy = sandbox.spy(SentryProvider.prototype, "maybeInitializeRaven");

      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS} />,
        {disableLifecycleMethods: true});
      wrapper.instance().componentDidMount();

      assert.calledOnce(mIRSpy);
      assert.calledWithExactly(mIRSpy);
    });
  });

  describe("#componentWillReceiveProps", () => {
    let mIRSpy;

    beforeEach(() => {
      mIRSpy = sandbox.spy(SentryProvider.prototype,
        "maybeInitializeRaven");
    });

    it("should call #maybeInitializeRaven when initialized changes to true", () => {
      const wrapper = shallow(
        <SentryProvider initialized={false} fakeRaven={fakeRaven} />,
        {disableLifecycleMethods: true});

      wrapper.instance().componentWillReceiveProps({initialized: true});

      assert.calledOnce(mIRSpy);
      assert.calledWithExactly(mIRSpy);
    });

    it("should not call #maybeInitializeRaven when prefs.initialized stays true", () => {
      const wrapper = shallow(
        <SentryProvider initialized={true} fakeRaven={fakeRaven} />,
        {disableLifecycleMethods: true});

      wrapper.instance().componentWillReceiveProps({initialized: true});

      assert.notCalled(mIRSpy);
    });

    it("should not call #maybeInitializeRaven when prefs.initialized is false", () => {
      const wrapper = shallow(
        <SentryProvider initialized={true} fakeRaven={fakeRaven} />,
        {disableLifecycleMethods: true});

      wrapper.instance().componentWillReceiveProps({initialized: false});

      assert.notCalled(mIRSpy);
    });
  });

  describe("#initializeRaven", () => {
    beforeEach(() => {
      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS}>
          <div />
        </SentryProvider>, {disableLifecycleMethods: true});

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

  describe("#maybeInitializeRaven", () => {
    it("should call #initializeRaven if #isRavenPrefEnabled returns true", () => {
      sandbox.stub(SentryProvider.prototype, "isRavenPrefEnabled").returns(true);
      const iRSpy = sandbox.spy(SentryProvider.prototype, "initializeRaven");

      const wrapper = shallow(
        <SentryProvider {...DEFAULT_PROPS}>
          <div />
        </SentryProvider>, {disableLifecycleMethods: true});

      wrapper.instance().maybeInitializeRaven();

      assert.calledOnce(iRSpy);
      assert.calledWithExactly(iRSpy);
    });

    it("should not call #initializeRaven if #isRavenPrefEnabled() is false", () => {
      sandbox.stub(SentryProvider.prototype, "isRavenPrefEnabled").returns(false);
      const iRSpy = sandbox.spy(SentryProvider.prototype, "initializeRaven");

      const wrapper = shallow(<SentryProvider {...DEFAULT_PROPS}>
          <div />
        </SentryProvider>);

      wrapper.instance().maybeInitializeRaven();

      assert.notCalled(iRSpy);
    });
  });
});

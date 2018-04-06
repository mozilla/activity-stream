import {_Base as Base, BaseContent} from "content-src/components/Base/Base";
import {ErrorBoundary} from "content-src/components/ErrorBoundary/ErrorBoundary";
import React from "react";
import {Search} from "content-src/components/Search/Search";
import {SentryProvider} from "content-src/components/SentryProvider/SentryProvider";
import {shallow} from "enzyme";

describe("<Base>", () => {
  const prefVals = {
    telemetry: true,
    dataReportingUploadEnabled: true
  };

  let DEFAULT_PROPS = {
    store: {getState: () => {}},
    App: {initialized: true, version: "5.6.7.8"},
    Prefs: {initialized: false, values: prefVals},
    Theme: {className: ""},
    dispatch: () => {}
  };

  it("should render Base component", () => {
    const wrapper = shallow(<Base {...DEFAULT_PROPS} />);

    assert.ok(wrapper.exists());
  });

  it("should render a SentryProvider with the correct props", () => {
    const expectedProps = Object.assign({}, prefVals,
      {
        initialized: DEFAULT_PROPS.Prefs.initialized,
        release: DEFAULT_PROPS.App.version
      });
    const wrapper = shallow(<Base {...DEFAULT_PROPS} />);

    const sentryProps = wrapper.dive(SentryProvider).props();

    assert.deepInclude(sentryProps, expectedProps);
  });

  it("should render a SentryProvider wrapping top-level ErrorBoundary", () => {
    const wrapper = shallow(<Base {...DEFAULT_PROPS} />);

    const ebChildren = wrapper.children(SentryProvider).children(ErrorBoundary);
    assert.lengthOf(ebChildren, 1);
  });

  it("should render the BaseContent component, passing through all props", () => {
    const wrapper = shallow(<Base {...DEFAULT_PROPS} />);

    assert.deepEqual(wrapper.find(BaseContent).props(), DEFAULT_PROPS);
  });

  it("should fire NEW_TAB_REHYDRATED event", () => {
    const dispatch = sinon.spy();
    shallow(<Base {...Object.assign({}, DEFAULT_PROPS, {dispatch})} />);
    assert.calledOnce(dispatch);
    const [action] = dispatch.firstCall.args;
    assert.equal("NEW_TAB_REHYDRATED", action.type);
  });

  it("should render an ErrorBoundary with class base-content-fallback", () => {
    const wrapper = shallow(<Base {...DEFAULT_PROPS} />);

    assert.equal(
      wrapper.find(ErrorBoundary).first().prop("className"), "base-content-fallback");
  });
});

describe("<BaseContent>", () => {
  let DEFAULT_PROPS = {store: {getState: () => {}}, App: {initialized: true}, Prefs: {values: {}}, Theme: {className: ""}, dispatch: () => {}};

  it("should render an ErrorBoundary with a Search child", () => {
    const searchEnabledProps =
      Object.assign({}, DEFAULT_PROPS, {Prefs: {values: {showSearch: true}}});

    const wrapper = shallow(<BaseContent {...searchEnabledProps} />);

    assert.isTrue(wrapper.find(Search).parent().is(ErrorBoundary));
  });
});

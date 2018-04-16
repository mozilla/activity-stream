import {ErrorBoundary, ErrorBoundaryFallback} from "content-src/components/ErrorBoundary/ErrorBoundary";
import {FormattedMessage} from "react-intl";
import React from "react";
import {shallow} from "enzyme";

describe("<ErrorBoundary>", () => {
  let fakeError;
  let fakeInfo;
  let fakeRaven;

  beforeEach(() => {
    fakeRaven = {captureException: sinon.spy()};
    fakeError = "fakeError";
    fakeInfo = {componentStack: "fakeStack"};
  });

  it("should render its children if componentDidCatch wasn't called", () => {
    const wrapper = shallow(<ErrorBoundary ><div className="kids" /></ErrorBoundary>);

    assert.lengthOf(wrapper.find(".kids"), 1);
  });

  it("should render ErrorBoundaryFallback if componentDidCatch called", () => {
    const wrapper = shallow(<ErrorBoundary fakeRaven={fakeRaven} />);

    wrapper.instance().componentDidCatch(fakeError, fakeInfo);
    // since shallow wrappers don't automatically manage lifecycle semantics:
    wrapper.update();

    assert.lengthOf(wrapper.find(ErrorBoundaryFallback), 1);
  });

  it("should call Raven.captureException if componentDidCatch fires", () => {
    const wrapper = shallow(<ErrorBoundary fakeRaven={fakeRaven} />);
    // note that we explicitly check that ONLY this WASN'T passed
    // through, since if future versions of React add other pieces of extra
    // info, we only want to send them after explicitly auditing them against
    // our privacy policies.
    fakeInfo.otherStuff = "fakeOtherStuff";
    wrapper.instance().componentDidCatch("fakeError", fakeInfo);

    assert.calledOnce(fakeRaven.captureException);
    assert.calledWithExactly(fakeRaven.captureException,
      "fakeError", {extra: {componentStack: "fakeStack"}});
  });

  it("should render the given FallbackComponent if componentDidCatch called", () => {
    class TestFallback extends React.PureComponent {
      render() {
        return <div className="my-fallback">doh!</div>;
      }
    }

    const wrapper = shallow(<ErrorBoundary
      FallbackComponent={TestFallback} fakeRaven={fakeRaven} />);
    wrapper.instance().componentDidCatch(fakeError, fakeInfo);
    // since shallow wrappers don't automatically manage lifecycle semantics:
    wrapper.update();

    assert.lengthOf(wrapper.find(TestFallback), 1);
  });

  it("should pass the given className prop to the FallbackComponent", () => {
    class TestFallback extends React.PureComponent {
      render() {
        return <div className={this.props.className}>doh!</div>;
      }
    }

    const wrapper = shallow(
      <ErrorBoundary FallbackComponent={TestFallback} className="sheep" />);
    wrapper.instance().componentDidCatch(fakeError, fakeInfo);
    // since shallow wrappers don't automatically manage lifecycle semantics:
    wrapper.update();

    assert.lengthOf(wrapper.find(".sheep"), 1);
  });
});

describe("ErrorBoundaryFallback", () => {
  it("should render a <div> with a class of as-error-fallback", () => {
    const wrapper = shallow(<ErrorBoundaryFallback />);

    assert.lengthOf(wrapper.find("div.as-error-fallback"), 1);
  });

  it("should render a <div> with the props.className and .as-error-fallback", () => {
    const wrapper = shallow(<ErrorBoundaryFallback className="monkeys" />);

    assert.lengthOf(wrapper.find("div.monkeys.as-error-fallback"), 1);
  });

  it("should call window.location.reload(true) if .reload-button clicked", () => {
    const fakeWindow = {location: {reload: sinon.spy()}};
    const wrapper = shallow(<ErrorBoundaryFallback windowObj={fakeWindow} />);

    wrapper.find(".reload-button").simulate("click");

    assert.calledOnce(fakeWindow.location.reload);
    assert.calledWithExactly(fakeWindow.location.reload, true);
  });

  it("should render .reload-button as an <a> element with an href attr", () => {
    const wrapper = shallow(<ErrorBoundaryFallback />);

    assert.lengthOf(wrapper.find(".reload-button[href]"), 1);
  });

  it("should render error_fallback_default_refresh_suggestion FormattedMessage",
    () => {
      const wrapper = shallow(<ErrorBoundaryFallback />);

      const msgWrapper =
        wrapper.find('[id="error_fallback_default_refresh_suggestion"]');
      assert.lengthOf(msgWrapper, 1);
      assert.isTrue(msgWrapper.is(FormattedMessage));
    });

  it("should render error_fallback_default_info FormattedMessage",
    () => {
      const wrapper = shallow(<ErrorBoundaryFallback />);

      const msgWrapper =
        wrapper.find('[id="error_fallback_default_info"]');
      assert.lengthOf(msgWrapper, 1);
      assert.isTrue(msgWrapper.is(FormattedMessage));
    });
});

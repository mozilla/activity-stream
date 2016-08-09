const {assert} = require("chai");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const Loader = require("components/Loader/Loader");
const LoadMore = require("components/LoadMore/LoadMore");
const {Link} = require("react-router");

describe("LoadMore", () => {
  let instance;
  let el;
  function setup(props = {}) {
    instance = TestUtils.renderIntoDocument(<LoadMore {...props} />);
    el = ReactDOM.findDOMNode(instance);
  }

  beforeEach(setup);

  it("should render the component", () => {
    TestUtils.isCompositeComponentWithType(instance, LoadMore);
  });

  it("should hide the component if props.hidden is true", () => {
    setup({hidden: true});
    assert.isTrue(el.hidden);
  });

  it("should render a Loader that is hidden by default", () => {
    TestUtils.isCompositeComponentWithType(instance.refs, Loader);
    assert.isTrue(ReactDOM.findDOMNode(instance.refs.loader).hidden);
  });

  it("should render a Link if props.to is provided", () => {
    setup({to: "/timeline"});
    const link = TestUtils.findRenderedComponentWithType(instance, Link);
    assert.ok(link);
    assert.equal(link.props.to, "/timeline");
  });

  it("should render an anchor with onClick if props.onClick is provided ", done => {
    setup({onClick: () => done()});
    const link = TestUtils.findRenderedDOMComponentWithTag(instance, "a");
    assert.ok(link);
    TestUtils.Simulate.click(link);
  });

  it("should show the Loader and hide the action element if loading is true", () => {
    setup({loading: true});
    assert.isTrue(ReactDOM.findDOMNode(instance.refs.action).hidden, "action should be hidden");
    assert.isFalse(ReactDOM.findDOMNode(instance.refs.loader).hidden, "loader should not be hidden");
  });
});

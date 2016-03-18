const {assert} = require("chai");
const Loader = require("components/Loader/Loader");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");

describe("Loader", () => {
  let instance;
  let el;
  function setup(props = {}) {
    instance = TestUtils.renderIntoDocument(<Loader {...props} />);
    el = ReactDOM.findDOMNode(instance);
  }

  beforeEach(() => setup());

  it("should render the component", () => {
    TestUtils.isCompositeComponentWithType(instance, Loader);
  });
  it("should be hidden by default", () => {
    assert.isTrue(el.hidden);
  });
  it("should be visible if props.show is true", () => {
    setup({show: true});
    assert.isFalse(el.hidden);
  });
});

const {assert} = require("chai");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");

const Tooltip = require("components/Tooltip/Tooltip");

describe("Tooltip", () => {
  let instance;
  let el;

  function setup(props = {label: "foo"}) {
    instance = TestUtils.renderIntoDocument(<Tooltip {...props} />);
    el = ReactDOM.findDOMNode(instance);
  }

  it("should render the component", () => {
    setup();
    TestUtils.isCompositeComponentWithType(instance, Tooltip);
  });

  it("should render the label", () => {
    setup({label: "hello"});
    assert.equal(el.textContent, "hello");
  });

  it("should not have any style:display by default", () => {
    setup();
    assert.equal(el.style.display, "");
  });

  it("should set display:block if props.visible is true", () => {
    setup({label: "foo", visible: true});
    assert.equal(el.style.display, "block");
  });

  it("should set display:none if props.visible is false", () => {
    setup({label: "foo", visible: false});
    assert.equal(el.style.display, "none");
  });

});

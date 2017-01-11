const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {shallow} = require("enzyme");

const {types, PlaceholderHighlightContext, HighlightContext} = require("components/HighlightContext/HighlightContext");

describe("HighlightContext", () => {
  let instance;
  let el;

  function setup(props = {type: "history"}) {
    instance = TestUtils.renderIntoDocument(<HighlightContext {...props} />);
    el = ReactDOM.findDOMNode(instance);
  }

  it("should render the component", () => {
    setup();
    TestUtils.isCompositeComponentWithType(instance, HighlightContext);
  });

  it("should render the right icon given a type", () => {
    setup({type: "bookmark"});
    assert.include(instance.refs.icon.className, `icon-${types.bookmark.icon}`);
  });

  it("should render props.icon if specified", () => {
    setup({type: "bookmark", icon: "foo"});
    assert.include(instance.refs.icon.className, "icon-foo");
  });

  it("should render the label defined by type if props.label is not specified", () => {
    setup({type: "bookmark"});
    assert.equal(instance.refs.label.textContent, types.bookmark.label);
  });

  it("should render props.label if specified", () => {
    setup({type: "bookmark", label: "My bookmark"});
    assert.equal(instance.refs.label.textContent, "My bookmark");
  });

  it("should render props.date if specified", () => {
    setup({type: "bookmark", date: Date.now()});
    assert.equal(instance.refs.timestamp.textContent, "<1m");
  });

  it("should not show a date if props.date is not specified", () => {
    setup({type: "bookmark"});
    assert.equal(instance.refs.timestamp.textContent, "");
  });

  it("should not show a tooltip if it is not defined by the type", () => {
    setup({type: "bookmark"});
    assert.isUndefined(instance.refs.tooltip);
  });

  it("should show a tooltip for recommended links", () => {
    setup({type: "recommended", date: Date.now()});
    assert.ok(instance.refs.tooltip);
    assert.equal(instance.refs.tooltip.props.label, types.recommended.tooltip);
  });

  it("should show not show a timestamps for recommended links", () => {
    setup({type: "recommended", date: Date.now()});
    assert.equal(instance.refs.timestamp.hidden, true);
  });

  it("should have a .tooltip-container class", () => {
    setup();
    assert.include(el.className, "tooltip-container");
  });
});

describe("PlaceholderHighlightContext", () => {
  it("should have a .placeholder class", () => {
    const wrapper = shallow(<PlaceholderHighlightContext />);

    assert.lengthOf(wrapper.find(".placeholder"), 1);
  });
});

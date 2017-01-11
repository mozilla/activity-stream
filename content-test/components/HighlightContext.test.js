const React = require("react");
const {shallow} = require("enzyme");

const Tooltip = require("components/Tooltip/Tooltip");
const {types, PlaceholderHighlightContext, HighlightContext} = require("components/HighlightContext/HighlightContext");

describe("HighlightContext", () => {
  let wrapper;

  function setup(props = {type: "history"}) {
    wrapper = shallow(<HighlightContext {...props} />);
  }

  it("should render the component", () => {
    setup();
    assert.instanceOf(wrapper.instance(), HighlightContext);
  });

  it("should render the right icon given a type", () => {
    setup({type: "bookmark"});
    assert.ok(wrapper.find(".icon").hasClass(`icon-${types.bookmark.icon}`));
  });

  it("should render props.icon if specified", () => {
    setup({type: "bookmark", icon: "foo"});
    assert.ok(wrapper.find(".icon").hasClass("icon-foo"));
  });

  it("should render the label defined by type if props.label is not specified", () => {
    setup({type: "bookmark"});
    assert.equal(wrapper.find(".hc-label").text(), types.bookmark.label);
  });

  it("should render props.label if specified", () => {
    setup({type: "bookmark", label: "My bookmark"});
    assert.equal(wrapper.find(".hc-label").text(), "My bookmark");
  });

  it("should render props.date if specified", () => {
    setup({type: "bookmark", date: Date.now()});
    assert.equal(wrapper.find(".hc-timestamp").text(), "<1m");
  });

  it("should not show a date if props.date is not specified", () => {
    setup({type: "bookmark"});
    assert.lengthOf(wrapper.find(".hc-timestamp").text(), 0);
  });

  it("should not show a tooltip if it is not defined by the type", () => {
    setup({type: "bookmark"});
    assert.lengthOf(wrapper.find(Tooltip), 0);
  });

  it("should show a tooltip for recommended links", () => {
    setup({type: "recommended", date: Date.now()});
    const tooltipWrapper = wrapper.find(Tooltip);

    assert.lengthOf(tooltipWrapper, 1);
    assert.equal(tooltipWrapper.prop("label"), types.recommended.tooltip);
  });

  it("should show not show a timestamps for recommended links", () => {
    setup({type: "recommended", date: Date.now()});
    assert.equal(wrapper.find(".hc-timestamp").prop("hidden"), true);
  });

  it("should have a .tooltip-container class", () => {
    setup();
    assert.ok(wrapper.hasClass("tooltip-container"));
  });
});

describe("PlaceholderHighlightContext", () => {
  it("should have a .placeholder class", () => {
    const wrapper = shallow(<PlaceholderHighlightContext />);

    assert.lengthOf(wrapper.find(".placeholder"), 1);
  });
});

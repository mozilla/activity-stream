const React = require("react");
const Tooltip = require("components/Tooltip/Tooltip");
const {types, PlaceholderHighlightContext, HighlightContext} = require("components/HighlightContext/HighlightContext");
const {mountWithIntl, shallowWithIntl} = require("test/test-utils");

describe("HighlightContext", () => {
  let wrapper;

  function setup(props = {type: "history"}) {
    wrapper = mountWithIntl(<HighlightContext {...props} />, {context: {}, childContextTypes: {}});
  }

  it("should render the component", () => {
    // finding by component needs a real DOM for functional components
    wrapper = mountWithIntl(<HighlightContext type="history" />, {context: {}, childContextTypes: {}});
    assert.equal(wrapper.find(HighlightContext).length, 1);
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
    const label = types.bookmark.intlID;
    const expectedString = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
    assert.equal(wrapper.find(".hc-label").text(), expectedString);
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

  it("should have a .tooltip-container class", () => {
    setup();
    assert.ok(wrapper.hasClass("tooltip-container"));
  });
});

describe("PlaceholderHighlightContext", () => {
  it("should have a .placeholder class", () => {
    const wrapper = shallowWithIntl(<PlaceholderHighlightContext />, {context: {}});

    assert.lengthOf(wrapper.find(".placeholder"), 1);
  });
});

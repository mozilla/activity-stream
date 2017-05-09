const React = require("react");
const {shallowWithIntl} = require("test/unit/utils");
const {_unconnected: LinkMenu} = require("content-src/components/LinkMenu/LinkMenu");
const ContextMenu = require("content-src/components/ContextMenu/ContextMenu");

describe("<LinkMenu>", () => {
  it("should render a ContextMenu element", () => {
    const wrapper = shallowWithIntl(<LinkMenu />);
    assert.ok(wrapper.find(ContextMenu));
  });
  it("should pass visible, onUpdate, and options to ContextMenu", () => {
    const wrapper = shallowWithIntl(<LinkMenu />);
    const contextMenuProps = wrapper.find(ContextMenu).props();
    ["visible", "onUpdate", "options", "tabbableOptionsLength"].forEach(prop => assert.property(contextMenuProps, prop));
  });
  it("should give ContextMenu the correct tabbable options length for a11y", () => {
    const wrapper = shallowWithIntl(<LinkMenu />);

    // stub the getOptions method
    let component = wrapper.instance();
    component.getOptions = () => [{label: "item1"}, {type: "separator"}, {label: "item2"}];

    // force the component and wrapper to update so that the stub is used
    component.forceUpdate();
    wrapper.update();
    const contextMenuProps = wrapper.find(ContextMenu).props();
    assert.equal(contextMenuProps.tabbableOptionsLength, 2);
  });
});

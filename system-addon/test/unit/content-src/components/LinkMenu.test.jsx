const React = require("react");
const {shallowWithIntl} = require("test/unit/utils");
const {_unconnected: LinkMenu} = require("content-src/components/LinkMenu/LinkMenu");
const ContextMenu = require("content-src/components/ContextMenu/ContextMenu");

describe("<LinkMenu>", () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: ""}} options={["CheckPinTopSite", "CheckBookmark", "OpenInNewWindow"]} dispatch={() => {}} />);
  });
  it("should render a ContextMenu element", () => {
    assert.ok(wrapper.find(ContextMenu));
  });
  it("should pass visible, onUpdate, and options to ContextMenu", () => {
    assert.ok(wrapper.find(ContextMenu));
    const contextMenuProps = wrapper.find(ContextMenu).props();
    ["visible", "onUpdate", "options"].forEach(prop => assert.property(contextMenuProps, prop));
  });
  it("should give ContextMenu the correct tabbable options length for a11y", () => {
    const options = wrapper.find(ContextMenu).props().options;
    const firstItem = options[0];
    const lastItem = options[options.length - 1];

    // first item should have {first: true}
    assert.isTrue(firstItem.first);
    assert.ok(!firstItem.last);

    // last item should have {last: true}
    assert.isTrue(lastItem.last);
    assert.ok(!lastItem.first);

    // middle items should have neither
    for (let i = 1; i < options.length - 1; i++) {
      assert.ok(!options[i].first && !options[i].last);
    }
  });
  it("should show the correct options for default sites", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", isDefault: true}} options={["CheckBookmark"]} source={"TOP_SITES"} dispatch={() => {}} />);
    const options = wrapper.find(ContextMenu).props().options;
    assert.ok(["menu_action_pin", "menu_action_unpin"].includes(options[0].id));
    assert.ok(options[1].type === "separator");
    assert.ok(options[2].id === "menu_action_open_new_window");
    assert.ok(options[3].id === "menu_action_open_private_window");
  });
  it("should show Unpin option for a pinned site if CheckPinTopSite in options list", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", isPinned: true}} source={"TOP_SITES"} options={["CheckPinTopSite"]} dispatch={() => {}} />);
    const options = wrapper.find(ContextMenu).props().options;
    assert.isDefined(options.find(o => (o.id && o.id === "menu_action_unpin")));
  });
  it("should show Pin option for an unpinned site if CheckPinTopSite in options list", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", isPinned: false}} source={"TOP_SITES"} options={["CheckPinTopSite"]} dispatch={() => {}} />);
    const options = wrapper.find(ContextMenu).props().options;
    assert.isDefined(options.find(o => (o.id && o.id === "menu_action_pin")));
  });
  it("should show Unbookmark option for a bookmarked site if CheckBookmark in options list", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", bookmarkGuid: 1234}} source={"TOP_SITES"} options={["CheckBookmark"]} dispatch={() => {}} />);
    const options = wrapper.find(ContextMenu).props().options;
    assert.isDefined(options.find(o => (o.id && o.id === "menu_action_remove_bookmark")));
  });
  it("should show Bookmark option for an unbookmarked site if CheckBookmark in options list", () => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: "", bookmarkGuid: 0}} source={"TOP_SITES"} options={["CheckBookmark"]} dispatch={() => {}} />);
    const options = wrapper.find(ContextMenu).props().options;
    assert.isDefined(options.find(o => (o.id && o.id === "menu_action_bookmark")));
  });
  describe(".onClick", () => {
    const FAKE_INDEX = 3;
    const FAKE_SOURCE = "TOP_SITES";
    const dispatch = sinon.stub();
    const propOptions = ["Separator", "RemoveBookmark", "AddBookmark", "OpenInNewWindow", "OpenInPrivateWindow", "BlockUrl", "DeleteUrl", "PinTopSite", "UnpinTopSite", "SaveToPocket"];
    const options = shallowWithIntl(<LinkMenu site={{url: ""}} dispatch={dispatch} index={FAKE_INDEX} options={propOptions} source={FAKE_SOURCE} />)
      .find(ContextMenu).props().options;
    afterEach(() => dispatch.reset());
    options.filter(o => o.type !== "separator").forEach(option => {
      it(`should fire a ${option.action} action for ${option.id}`, () => {
        option.onClick();
        assert.calledTwice(dispatch);
        assert.equal(dispatch.firstCall.args[0], option.action);
      });
      it(`should fire a UserEvent action for ${option.id}`, () => {
        option.onClick();
        const action = dispatch.secondCall.args[0];
        assert.isUserEventAction(action);
        assert.propertyVal(action.data, "source", FAKE_SOURCE);
        assert.propertyVal(action.data, "action_position", FAKE_INDEX);
      });
    });
  });
});

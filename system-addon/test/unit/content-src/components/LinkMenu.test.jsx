const React = require("react");
const {shallowWithIntl} = require("test/unit/utils");
const {_unconnected: LinkMenu} = require("content-src/components/LinkMenu/LinkMenu");
const ContextMenu = require("content-src/components/ContextMenu/ContextMenu");

describe("<LinkMenu>", () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallowWithIntl(<LinkMenu site={{url: ""}} dispatch={() => {}} />);
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
    const middleItem = options[Math.ceil(options.length / 2)];

    // first item should have {first: true}
    assert.isTrue(firstItem.first);
    assert.ok(!firstItem.last);

    // last item should have {last: true}
    assert.isTrue(lastItem.last);
    assert.ok(!lastItem.first);

    // middle items should have neither
    assert.ok(!middleItem.first);
    assert.ok(!middleItem.last);
  });
  describe(".onClick", () => {
    const FAKE_INDEX = 3;
    const FAKE_SOURCE = "TOP_SITES";
    const dispatch = sinon.stub();
    const options = shallowWithIntl(<LinkMenu site={{url: ""}} dispatch={dispatch} index={FAKE_INDEX} source={FAKE_SOURCE} />)
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

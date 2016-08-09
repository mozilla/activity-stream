const {assert} = require("chai");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");

const ContextMenu = require("components/ContextMenu/ContextMenu");

const DEFAULT_PROPS = {
  onUpdate: () => {},
  visible: false,
  options: []
};

describe("ContextMenu", () => {
  let instance;
  let el;
  let links;

  function setup(custom = {}) {
    const props = Object.assign({}, DEFAULT_PROPS, custom);
    instance = TestUtils.renderIntoDocument(<ContextMenu {...props} />);
    links = TestUtils.scryRenderedDOMComponentsWithClass(instance, "context-menu-link");
    el = ReactDOM.findDOMNode(instance);
  }

  beforeEach(setup);

  it("should render the component", () => {
    TestUtils.isCompositeComponentWithType(instance, ContextMenu);
  });
  it("should be hidden by default", () => {
    assert.equal(el.hidden, true);
  });
  it("should be visible if props.visible is true", () => {
    setup({visible: true});
    assert.equal(el.hidden, false);
  });
  it("should render one link per option", () => {
    const options = [
      {label: "Test", onClick: () => {}},
      {label: "Test 2", onClick: () => {}},
      {label: "Test 3", onClick: () => {}}
    ];
    setup({options});
    assert.equal(links.length, options.length);
  });
  it("should add a ref for options if provided", () => {
    const options = [
      {label: "Test", onClick: () => {}, ref: "foo"}
    ];
    setup({options});
    assert.ok(instance.refs.foo);
  });
  it("should call the onClick function when an option button is clicked", done => {
    setup({options: [{label: "Foo", onClick() {done();}}]});
    TestUtils.Simulate.click(links[0]);
  });
  it("should call the onUserEvent function when an option button is clicked and has a userEvent", done => {
    setup({
      onUserEvent: type => {
        assert.equal(type, "FOO");
        done();
      },
      options: [{label: "Foo", userEvent: "FOO", onClick() {}}]
    });
    TestUtils.Simulate.click(links[0]);
  });
  it("should call onUpdate with false when an option is clicked", done => {
    setup({
      visible: true,
      options: [{label: "Test", onClick: () => {}}],
      onUpdate: value => {
        assert.isFalse(value);
        done();
      }
    });
    TestUtils.Simulate.click(links[0]);
  });
});

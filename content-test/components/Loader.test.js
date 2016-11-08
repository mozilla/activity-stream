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
  it("should render props.title as a title", () => {
    setup({id: "foo", title: "Everglade"});
    assert.equal(instance.refs.title.innerHTML, "Everglade");
  });
  it("should render props.body content", () => {
    setup({id: "foo", body: "Everglade"});
    assert.equal(instance.refs.body.innerHTML, "Everglade");
  });
  it("should render a custom label", () => {
    setup({label: "Hello world"});
    assert.equal(instance.refs.statusBox.textContent, "Hello world");
  });
  it("should add className to the default className", () => {
    setup({className: "foo"});
    assert.equal(el.className, "loader foo");
  });
});

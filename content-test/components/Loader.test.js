const Loader = require("components/Loader/Loader");
const React = require("react");
const {mountWithIntl, messages} = require("test/test-utils");
const DEFAULT_PROPS = {
  title: messages.welcome_title,
  body: messages.welcome_body,
  label: messages.welcome_label
};

describe("Loader", () => {
  let wrapper;
  function setup(props = {}) {
    const customProps = Object.assign({}, DEFAULT_PROPS, props);
    wrapper = mountWithIntl(<Loader {...customProps} />, {context: {}, childContextTypes: {}});
  }

  beforeEach(() => setup());

  it("should render the component", () => {
    assert.ok(wrapper.find(Loader));
  });
  it("should be hidden by default", () => {
    assert.isTrue(wrapper.ref("loader").prop("hidden"));
  });
  it("should be visible if props.show is true", () => {
    setup({show: true});
    assert.isFalse(wrapper.ref("loader").prop("hidden"));
  });
  it("should render props.title as a title", () => {
    setup({id: "foo", title: "Everglade"});
    assert.equal(wrapper.ref("title").text(), "Everglade");
  });
  it("should render props.body content", () => {
    setup({id: "foo", body: "Everglade"});
    assert.equal(wrapper.ref("body").text(), "Everglade");
  });
  it("should render a custom label", () => {
    setup({label: "Hello world"});
    assert.equal(wrapper.ref("statusBox").text(), "Hello world");
  });
  it("should add className to the default className", () => {
    setup({className: "foo"});
    assert.ok(wrapper.ref("loader").hasClass("loader"));
    assert.ok(wrapper.ref("loader").hasClass("foo"));
  });
});

const {CollapsibleSection} = require("components/CollapsibleSection/CollapsibleSection");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {renderWithProvider} = require("test/test-utils");
const DEFAULT_PROPS = {
  className: "cool-section",
  titleId: "header_stories",
  prefName: "collapseSection",
  prefs: {collapseSection: false},
  dispatch: () => {}
};

describe("CollapsibleSection", () => {
  let instance;
  let el;

  function setup(props = {}) {
    const customProps = Object.assign({}, DEFAULT_PROPS, props);
    instance = renderWithProvider(<CollapsibleSection {...customProps}>foo</CollapsibleSection>);
    el = ReactDOM.findDOMNode(instance);
  }

  beforeEach(() => setup());

  it("should render the component", () => {
    assert.ok(el);
  });

  it("should have collapsed class if 'prefName' pref is true", () => {
    setup({prefs: {collapseSection: true}});
    assert.ok(el.className.indexOf("collapsed") >= 0);
  });

  it("should fire a pref change event when section title is clicked", done => {
    function dispatch(a) {
      if (a.type === "NOTIFY_PREF_CHANGE") {
        assert.equal(a.data.name, "collapseSection");
        assert.equal(a.data.value, true);
        done();
      }
    }
    setup({dispatch});
    TestUtils.Simulate.click(instance.refs.title);
  });
});

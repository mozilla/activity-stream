const {connect} = require("react-redux");
const React = require("react");
const TestUtils = require("react-addons-test-utils");
const firstRunData = require("lib/first-run-data");
const {justDispatch, selectNewTabSites} = require("common/selectors/selectors");
const {TOP_SITES_DEFAULT_LENGTH} = require("common/constants.js");
const {rawMockData, createMockProvider} = require("test/test-utils");
const fakeState = rawMockData;

describe("selectors", () => {
  describe("justDispatch", () => {
    const EmptyComponent = React.createClass({render: () => (<div />)});
    function connectSelectorToComponent(selector, InnerComponent = EmptyComponent) {
      const Provider = createMockProvider();
      const Connected = connect(justDispatch)(InnerComponent);
      const instance = TestUtils.renderIntoDocument(<Provider><Connected /></Provider>);
      return TestUtils.findRenderedComponentWithType(instance, InnerComponent);
    }
    it("should return an empty state object", () => {
      assert.deepEqual(justDispatch(fakeState), {});
    });
    it("should pass dispatch to inner element", () => {
      const instance = connectSelectorToComponent(justDispatch);
      assert.property(instance.props, "dispatch");
      assert.isFunction(instance.props.dispatch);
    });
  });
  describe("selectNewTabSites", () => {
    let state;
    let raw;
    function setup(customRows = {}, recommendedHighlight = false) {
      const custom = {};
      Object.keys(customRows).forEach(key => {
        custom[key] = Object.assign({}, fakeState[key], {rows: customRows[key]});
      });
      const Experiments = {values: {recommendedHighlight}, error: false, init: true};
      raw = Object.assign({}, fakeState, {Experiments}, custom);
      state = selectNewTabSites(raw);
    }

    beforeEach(() => setup());

    it("should return the right properties", () => {
      ["TopSites"].forEach(prop => assert.property(state, prop));
    });

    describe("TopSites", () => {
      it("should internally dedupe", () => {
        setup({TopSites: [{url: "https://foo.com", cache_key: "foo.com/"}, {url: "http://www.foo.com", cache_key: "foo.com/"}]});
        const urls = state.TopSites.rows.map(site => site.url);
        assert.equal(urls[0], "https://foo.com");
        assert.notInclude(urls, "http://www.foo.com");
      });
      it("should limit to TOP_SITES_DEFAULT_LENGTH items", () => {
        const rows = Array(TOP_SITES_DEFAULT_LENGTH + 2).fill("https://foo.com").map((url, i) => ({url: url.replace("foo", `foo${i}`)}));
        setup({TopSites: rows});
        assert.lengthOf(state.TopSites.rows, TOP_SITES_DEFAULT_LENGTH);
        assert.deepEqual(state.TopSites.rows.map(site => site.url), rows.slice(0, TOP_SITES_DEFAULT_LENGTH).map(site => site.url));
      });
      it("should add default sites to fill empty spaces", () => {
        const rows = [{url: "http://foo.com"}, {url: "http://bar.com"}];
        setup({TopSites: rows});
        assert.deepEqual(state.TopSites.rows, rows.concat(firstRunData.TopSites).slice(0, TOP_SITES_DEFAULT_LENGTH));
      });
    });
  });
});

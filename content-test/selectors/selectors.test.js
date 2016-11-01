const {connect} = require("react-redux");
const React = require("react");
const TestUtils = require("react-addons-test-utils");
const firstRunData = require("lib/first-run-data");
const {justDispatch, selectNewTabSites} = require("selectors/selectors");
const {SPOTLIGHT_DEFAULT_LENGTH, WEIGHTED_HIGHLIGHTS_LENGTH, TOP_SITES_LENGTH} = require("common/constants.js");
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
    function setup(customRows = {}, weightedHighlights = true, recommendedHighlight = false) {
      const custom = {};
      Object.keys(customRows).forEach(key => {
        custom[key] = Object.assign({}, fakeState[key], {rows: customRows[key]});
      });
      const Experiments = {values: {weightedHighlights, recommendedHighlight}, error: false, init: true};
      raw = Object.assign({}, fakeState, {Experiments}, custom);
      state = selectNewTabSites(raw);
    }

    beforeEach(() => setup());

    it("should return the right properties", () => {
      ["Highlights", "TopActivity", "TopSites", "showRecommendationOption"].forEach(prop => assert.property(state, prop));
    });

    describe("TopSites", () => {
      it("should internally dedupe", () => {
        setup({TopSites: [{url: "https://foo.com"}, {url: "http://www.foo.com"}]});
        const urls = state.TopSites.rows.map(site => site.url);
        assert.equal(urls[0], "https://foo.com");
        assert.notInclude(urls, "http://www.foo.com");
      });
      it("should limit to TOP_SITES_LENGTH items", () => {
        const rows = Array(TOP_SITES_LENGTH + 2).fill("https://foo.com").map((url, i) => ({url: url.replace("foo", `foo${i}`)}));
        setup({TopSites: rows});
        assert.lengthOf(state.TopSites.rows, TOP_SITES_LENGTH);
        assert.deepEqual(state.TopSites.rows.map(site => site.url), rows.slice(0, TOP_SITES_LENGTH).map(site => site.url));
      });
      it("should add default sites to fill empty spaces", () => {
        const rows = [{url: "http://foo.com"}, {url: "http://bar.com"}];
        setup({TopSites: rows});
        assert.deepEqual(state.TopSites.rows, rows.concat(firstRunData.TopSites).slice(0, TOP_SITES_LENGTH));
      });
    });

    // Note that this is for Weighted Highlights turned ON (see setup function)
    describe("Highlights", () => {
      it("should have a length of WEIGHTED_HIGHLIGHTS_LENGTH", () => {
        assert.lengthOf(state.Highlights.rows, WEIGHTED_HIGHLIGHTS_LENGTH);
      });
      it("should set .weightedHighlights to true", () => {
        assert.property(state.Highlights, "weightedHighlights");
      });
      it("should render the right sites in the right order", () => {
        const highlights = [{url: "http://foo1.com"}, {url: "http://www.foo2.com"}, {url: "http://www.foo3.com"},
              {url: "http://foo4.com"}, {url: "http://www.foo5.com"}, {url: "http://www.foo6.com"}];
        setup({WeightedHighlights: highlights});
        assert.lengthOf(state.Highlights.rows, highlights.length + firstRunData.Highlights.length);
        highlights.forEach((item, i) => {
          assert.equal(state.Highlights.rows[i].url, item.url);
        });
      });
      it("should render first run highlights if WeightedHighlights is empty", () => {
        setup({WeightedHighlights: []});
        assert.lengthOf(state.Highlights.rows, firstRunData.Highlights.length);
        firstRunData.Highlights.forEach((row, i) => assert.equal(row.url, firstRunData.Highlights[i].url));
      });
      it("should run assignImageAndBackgroundColor on firstRunData", () => {
        setup({WeightedHighlights: []});
        assert.property(state.Highlights.rows[0], "backgroundColor");
      });
      it("should append First Run data if less or equal to MIN_HIGHLIGHTS_LENGTH", () => {
        setup({WeightedHighlights: [{url: "http://foo.com"}, {url: "http://www.bar.com"}]});
        assert.lengthOf(state.Highlights.rows, 5);
        assert.equal(state.Highlights.rows[2].url, firstRunData.Highlights[0].url);
      });
      it("should internally dedupe", () => {
        setup({WeightedHighlights: [{url: "https://foo.com"}, {url: "http://www.foo.com"}]});
        assert.lengthOf(state.Highlights.rows, 1 + firstRunData.Highlights.length);
        assert.equal(state.Highlights.rows[0].url, "https://foo.com");
      });
      it("should dedupe against TopSites", () => {
        setup({
          TopSites: [{url: "https://foo.com"}],
          WeightedHighlights: [{url: "https://foo.com"}, {url: "https://bar.com"}]
        });
        assert.lengthOf(state.Highlights.rows, 1 + firstRunData.Highlights.length);
        assert.equal(state.Highlights.rows[0].url, "https://bar.com");
      });
      it("should be processed by assignImageAndBackgroundColor", () => {
        setup({WeightedHighlights: [{url: "http://asdad23asd.com", background_color: "#fff"}]});
        assert.equal(state.Highlights.rows[0].backgroundColor, "#fff");
      });
    });

    describe("TopActivity", () => {
      it("should be empty (when weightedHighlights is on)", () => {
        setup({History: [{url: "https://asdsad.com"}, {url: "https://g123asaw.com"}]});
        assert.deepEqual(state.TopActivity.rows, []);
      });
    });

    describe("showRecommendationOption", () => {
      it("should be false if the experiment value is false", () => {
        assert.isFalse(raw.Experiments.values.recommendedHighlight);
        assert.isFalse(state.showRecommendationOption);
      });
      it("should be true if the experiment value is true", () => {
        setup(undefined, undefined, true);
        assert.isTrue(raw.Experiments.values.recommendedHighlight);
        assert.isTrue(state.showRecommendationOption);
      });
    });

    describe.skip("old Highlights", () => { // XXXdmose remove in #1611
      it("should have highlights of SPOTLIGHT_DEFAULT_LENGTH", () => {
        setup(undefined, false);
        assert.lengthOf(state.Highlights.rows, SPOTLIGHT_DEFAULT_LENGTH);
      });
      it("should include History in TopActivity and Dedupe against TopSites, Highlights", () => {
        // note: the second param of setup sets weightedHighlights to false
        setup({
          TopSites: [{url: "http://foo.com"}],
          Highlights: [{url: "http://blah.com"}],
          History: [{url: "http://foo.com"}, {url: "http://blah.com"}, {url: "http://hello.com"}]
        }, false);
        assert.lengthOf(state.TopActivity.rows, 1);
      });
    });
  });
});

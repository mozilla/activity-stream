const {connect} = require("react-redux");
const React = require("react");
const TestUtils = require("react-addons-test-utils");
const dedupe = require("lib/dedupe");
const firstRunData = require("lib/first-run-data");
const {
  justDispatch,
  selectSpotlight,
  selectTopSites,
  selectNewTabSites,
  selectHistory,
  SPOTLIGHT_LENGTH
} = require("selectors/selectors");
const {rawMockData, createMockProvider} = require("test/test-utils");

const validSpotlightSite = {
  "title": "man throws alligator in wendys wptv dnt cnn",
  "url": "http://www.cnn.com/videos/tv/2016/02/09/man-throws-alligator-in-wendys-wptv-dnt.cnn",
  "description": "A Florida man faces multiple charges for throwing an alligator through a Wendy's drive-thru window. CNN's affiliate WPTV reports.",
  "lastVisitDate": 1456426160465,
  "images": [{
    "url": "http://i2.cdn.turner.com/cnnnext/dam/assets/160209053130-man-throws-alligator-in-wendys-wptv-dnt-00004611-large-169.jpg",
    "height": 259,
    "width": 460,
    "entropy": 3.98714569089,
    "size": 14757
  }]
};

const fakeState = rawMockData;
const EmptyComponent = React.createClass({render: () => (<div />)});

function connectSelectorToComponent(selector, InnerComponent = EmptyComponent) {
  const Provider = createMockProvider();
  const Connected = connect(justDispatch)(InnerComponent);
  const instance = TestUtils.renderIntoDocument(<Provider><Connected /></Provider>);
  return TestUtils.findRenderedComponentWithType(instance, InnerComponent);
}

describe("selectors", () => {
  describe("justDispatch", () => {
    it("should return an empty state object", () => {
      assert.deepEqual(justDispatch(fakeState), {});
    });
    it("should pass dispatch to inner element", () => {
      const instance = connectSelectorToComponent(justDispatch);
      assert.property(instance.props, "dispatch");
      assert.isFunction(instance.props.dispatch);
    });
  });
  describe("selectSpotlight", () => {
    let state = selectSpotlight(fakeState);

    function setup(custom) {
      state = selectSpotlight(Object.assign({}, fakeState, custom));
      return state;
    }

    beforeEach(() => setup());

    // Tests that provided sites are sorted to the bottom, because they don't
    // match the conditions for spotlight to use them
    function assertInvalidSite(site) {
      const invalidSite = Object.assign({}, validSpotlightSite, site);
      const result = setup({Highlights: {init: true, rows: [invalidSite, validSpotlightSite]}});
      assert.lengthOf(result.rows, 2 + firstRunData.Highlights.length);
      assert.equal(result.rows[0].url, validSpotlightSite.url);
      assert.equal(result.rows[1].url, invalidSite.url);
    }
    it("should have the same properties as Highlights plus recommendationShown", () => {
      Object.keys(fakeState.Highlights).forEach(prop => assert.property(state, prop));
      assert.property(state, "recommendationShown");
    });
    it("should set recommendationShown based on prefs.recommendations", () => {
      setup({Prefs: {prefs: {recommendations: true}}});
      assert.isTrue(state.recommendationShown);
    });
    it("should add a bestImage for each item", () => {
      state.rows.forEach(site => {
        assert.property(site, "bestImage");
        assert.isObject(site.bestImage);
        assert.property(site.bestImage, "url");
      });
    });
    it("should add a backgroundColor for items that dont have an image", () => {
      const site = {
        url: "https://foo.com",
        favicon_colors: [{color: [11, 11, 11]}]
      };
      const results = setup({Highlights: {rows: [site]}});
      assert.deepEqual(results.rows[0].backgroundColor, "rgba(11, 11, 11, 0.4)");
    });
    it("should use site.background_color for items that dont have an image if it exists", () => {
      const site = {
        url: "https://foo.com",
        background_color: "#111111",
        favicon_colors: [{color: [11, 11, 11]}]
      };
      const results = setup({Highlights: {rows: [site]}});
      assert.equal(results.rows[0].backgroundColor, "#111111");
    });
    it("should use a fallback bg color if no favicon_colors are available", () => {
      const site = {url: "https://foo.com"};
      const results = setup({Highlights: {rows: [site]}});
      assert.ok(results.rows[0].backgroundColor, "should have a bg color");
    });
    it("should include first run items if init is true and Highlights is empty", () => {
      const results = setup({Highlights: {init: true, rows: []}});
      firstRunData.Highlights.forEach((item, i) => {
        assert.equal(results.rows[i].url, item.url);
      });
    });
    it("should not include first run items if init is false", () => {
      const results = setup({Highlights: {init: false, rows: []}});
      assert.lengthOf(results.rows, 0);
    });
    it("should sort sites that do not have a title to the end", () => {
      assertInvalidSite({title: null});
    });
    it("should sort sites that do not have a description to the end", () => {
      assertInvalidSite({description: null});
    });
    it("should sort sites for which the title equals the description to the end", () => {
      assertInvalidSite({
        title: "foo",
        description: "foo"
      });
    });
    it("should sort sites that do not have an images prop or an empty array to the end", () => {
      assertInvalidSite({images: null});
      assertInvalidSite({images: []});
    });
    it("should append History sites to the end", () => {
      assertInvalidSite({images: null});
      assertInvalidSite({images: []});
    });
  });
  describe("selectTopSites", () => {
    it("should add default sites if init is true", () => {
      const rows = [{url: "http://foo.com"}, {url: "http://bar.com"}];
      const result = selectTopSites({TopSites: {init: true, rows}});
      assert.isTrue(result.init);
      assert.deepEqual(result.rows, rows.concat(firstRunData.TopSites));
    });
    it("should not add default sites if init is false", () => {
      const rows = [{url: "http://foo.com"}, {url: "http://bar.com"}];
      const result = selectTopSites({TopSites: {init: false, rows}});
      assert.isFalse(result.init);
      assert.deepEqual(result.rows, rows);
    });
    it("should dedupe by url", () => {
      const rows = [{url: "http://foo.com"}, {url: "http://www.foo.com"}];
      const result = selectTopSites({TopSites: {init: false, rows}});
      assert.deepEqual(result.rows, [{url: "http://foo.com"}]);
    });
  });
  describe("selectHistory weightedHighlights pref is false", () => {
    let state;
    let fakeStateNoWeights;
    beforeEach(() => {
      fakeStateNoWeights = Object.assign({}, fakeState, {
        Prefs: {
          prefs: {
            weightedHighlights: false,
            recommendations: true
          }
        }
      });
      state = selectHistory(fakeStateNoWeights);
    });
    it("should select Highlights rows when weightedHighlights pref is false", () => {
      // Because of the sorting cannot check links. If `selectSpotlight` is called then recommendations is read
      // and that can only happen if Spotlight links were selected.
      assert.ok(state.Spotlight.recommendationShown);
    });
  });
  describe("selectHistory weightedHighlights pref is true", () => {
    let state;
    let fakeStateWithWeights = Object.assign({}, fakeState, {Prefs: {prefs: {weightedHighlights: true}}});
    beforeEach(() => {
      state = selectHistory(fakeStateWithWeights);
    });
    it("should select WeightedHighlights when weightedHighlights pref is true", () => {
      // Because of the call to assignImageAndBackgroundColor the two `rows` prop are not identical.
      state.Spotlight.rows.forEach((row, i) => {
        assert.equal(row.url, fakeStateWithWeights.WeightedHighlights.rows[i].url);
      });
    });
  });
  describe("selectNewTabSites", () => {
    let state;
    beforeEach(() => {
      state = selectNewTabSites(fakeState);
    });
    it("should return the right properties", () => {
      [
        "Spotlight",
        "TopActivity",
        "TopSites",
        "showRecommendationOption"
      ].forEach(prop => {
        assert.property(state, prop);
      });
    });
    it("should use first 3 items of selectSpotlight for Spotlight", () => {
      assert.lengthOf(state.Spotlight.rows, SPOTLIGHT_LENGTH);
    });
    it("should dedupe TopSites, Spotlight, and TopActivity", () => {
      const groups = [state.TopSites.rows, state.Spotlight.rows, state.TopActivity.rows];
      assert.deepEqual(groups, dedupe.group(groups));
    });
    it("should not give showRecommendationOption if we are not in the experiment", () => {
      assert.deepEqual(state.showRecommendationOption, undefined);
    });
    it("should give a showRecommendationOption if we are in the experiment", () => {
      const experimentsData = {Experiments: {values: {recommendedHighlight: true}}};
      state = selectNewTabSites(Object.assign({}, fakeState, experimentsData));
      assert.isTrue(state.showRecommendationOption);
    });
    it("should show a rating system if the pref is on", () => {
      let rate = {Prefs: {prefs: {metadataRatingSystem: true}}};
      state = selectNewTabSites(Object.assign({}, fakeState, rate));
      assert.isTrue(state.Spotlight.metadataRating);
    });
    it("should render the correct Spotlight items for weightedHighlights", () => {
      let weightedHighlights = {
        WeightedHighlights: {rows: [{url: "http://foo.com"}, {url: "http://www.foo.com"}]},
        Prefs: {prefs: {weightedHighlights: true}}
      };

      state = selectNewTabSites(Object.assign({}, fakeState, weightedHighlights));
      assert.property(state.Spotlight, "weightedHighlights");
      assert.isTrue(state.Spotlight.weightedHighlights);
      assert.equal(state.Spotlight.rows.length, weightedHighlights.WeightedHighlights.rows.length);
      state.Spotlight.rows.forEach((row, i) => {
        assert.equal(row.url, weightedHighlights.WeightedHighlights.rows[i].url);
      });
    });
  });
});

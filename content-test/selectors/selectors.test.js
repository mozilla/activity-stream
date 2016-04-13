const {assert} = require("chai");
const {connect} = require("react-redux");
const React = require("react");
const TestUtils = require("react-addons-test-utils");
const dedupe = require("lib/dedupe");

const {
  justDispatch,
  selectSpotlight,
  selectNewTabSites,
  selectSiteIcon,
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

    // Tests that provided sites don't get selected, because they don't
    // match the conditions for spotlight to use them
    function assertInvalidSite(site) {
      const testSite = Object.assign({}, validSpotlightSite, site);
      const emptyState = selectSpotlight({
        FrecentHistory: {rows: [testSite]},
        Blocked: {urls: new Set()}
      });
      assert.lengthOf(emptyState.rows, 0);
    }

    it("should have the same properties as History", () => {
      assert.deepEqual(Object.keys(state), Object.keys(fakeState.History));
    });
    it("should add a bestImage for each item", () => {
      state.rows.forEach(site => {
        assert.property(site, "bestImage");
        assert.isObject(site.bestImage);
        assert.property(site.bestImage, "url");
      });
    });
    it("should skip sites that do not have a title", () => {
      assertInvalidSite({
        title: null
      });
    });
    it("should skip sites that do not have a description", () => {
      assertInvalidSite({
        description: null
      });
    });
    it("should skip sites for which the title equals the description", () => {
      assertInvalidSite({
        title: "foo",
        description: "foo"
      });
    });
    it("should skip sites that do not have an images prop or an empty array", () => {
      assertInvalidSite({
        images: null
      });
      assertInvalidSite({
        images: []
      });
    });
    it("should remove urls in block list", () => {
      let frecent = fakeState.FrecentHistory.rows.splice(0,3);
      state = selectSpotlight({
        FrecentHistory: {rows: frecent},
        Blocked: {urls: new Set([frecent[0].url])}
      });
      assert.equal(state.rows.length, frecent.length - 1);
    });
  });
  describe("selectNewTabSites", () => {
    let state = selectNewTabSites(fakeState);
    it("should return the right properties", () => {
      [
        "Spotlight",
        "TopActivity",
        "TopSites"
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
    it("should remove urls in block list", () => {
      state = selectNewTabSites({
        TopSites: {rows: [
          {url: "foo1.com", lastVisitDate: 1},
          {url: "bar2.com", lastVisitDate: 4},
          {url: "baz3.com", lastVisitDate: 3}
        ]},
        Spotlight: {rows: []},
        FrecentHistory: {rows: []},
        History: {rows: []},
        Blocked: {urls: new Set(["foo1.com"])}
      });
      assert.deepEqual(state.TopSites.rows, [
        {url: "bar2.com", lastVisitDate: 4},
        {url: "baz3.com", lastVisitDate: 3}
      ]);
    });
    it("should sort TopActivity by dateLastVisited", () => {
      state = selectNewTabSites({
        TopSites: {rows: []},
        Spotlight: {rows: []},
        FrecentHistory: {rows: [
          {url: "foo.com", lastVisitDate: 1},
          {url: "bar.com", lastVisitDate: 4},
          {url: "baz.com", lastVisitDate: 3}
        ]},
        History: {rows: [
          {url: "foo1.com", lastVisitDate: 1},
          {url: "bar2.com", lastVisitDate: 4},
          {url: "baz3.com", lastVisitDate: 3}
        ]},
        Blocked: {urls: new Set()}
      });
      assert.deepEqual(state.TopActivity.rows,
        [
          {url: "bar2.com", lastVisitDate: 4},
          {url: "baz3.com", lastVisitDate: 3},
          {url: "foo1.com", lastVisitDate: 1}
        ]
      );
    });
  });
  describe("selectSiteIcon", () => {
    const siteWithFavicon = {
      url: "http://foo.com",
      favicon_url: "http://foo.com/favicon.ico",
      favicon: "http://foo.com/favicon-16.ico",
      favicon_colors: [{color: [11, 11, 11]}]
    };
    let state;
    beforeEach(() => {
      state = selectSiteIcon(siteWithFavicon);
    });

    it("should not throw", () => {
      assert.doesNotThrow(() => {
        selectSiteIcon({});
      });
    });

    it("should have a url", () => {
      assert.equal(state.url, siteWithFavicon.url);
    });
    it("should select favicon_url", () => {
      assert.equal(state.favicon, siteWithFavicon.favicon_url);
    });
    it("should fall back to favicon_url", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {favicon_url: null}));
      assert.equal(state.favicon, siteWithFavicon.favicon);
    });
    it("should select the first letter of the hostname", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {url: "http://kate.com"}));
      assert.equal(state.firstLetter, "k");
    });
    it("should create a background color", () => {
      assert.equal(state.backgroundColor, `rgba(11, 11, 11, ${selectSiteIcon.BACKGROUND_FADE})`);
    });
    it("should create an opaque background color if there is no favicon", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {favicon_url: null, favicon: null}));
      assert.equal(state.backgroundColor, "rgba(11, 11, 11, 1)");
    });
    it("should create a random background color if no favicon color exists", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {favicon_colors: null}));
      assert.ok(state.backgroundColor);
    });
    it("should create a contrasting font color", () => {
      const darkColor = selectSiteIcon(Object.assign({}, siteWithFavicon, {favicon_colors: [{color: [1, 1, 1]}]}));
      assert.equal(darkColor.fontColor, "white");
      const lightColor = selectSiteIcon(Object.assign({}, siteWithFavicon, {favicon_colors: [{color: [200, 200, 200]}]}));
      assert.equal(lightColor.fontColor, "black");
    });
    it("should add a label (hostname)", () => {
      assert.equal(state.label, "foo.com");
    });
  });
});

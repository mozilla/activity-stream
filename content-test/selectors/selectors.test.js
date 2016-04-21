const {assert} = require("chai");
const {connect} = require("react-redux");
const React = require("react");
const TestUtils = require("react-addons-test-utils");
const dedupe = require("lib/dedupe");
const firstRunData = require("lib/first-run-data");
const {
  justDispatch,
  selectSpotlight,
  selectNewTabSites,
  selectSiteIcon,
  getBackgroundRGB,
  SPOTLIGHT_LENGTH,
  DEFAULT_FAVICON_BG_COLOR
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
      const invalidSite = Object.assign({}, validSpotlightSite, site);
      const result = selectSpotlight({
        FrecentHistory: {rows: [invalidSite, validSpotlightSite]},
        Blocked: {urls: new Set()}
      });
      assert.lengthOf(result.rows, 2 + firstRunData.Highlights.length);
      assert.equal(result.rows[0].url, validSpotlightSite.url);
      assert.equal(result.rows[1].url, invalidSite.url);
    }

    it("should have the same properties as FrecentHistory", () => {
      assert.deepEqual(Object.keys(state), Object.keys(fakeState.FrecentHistory));
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
      const results = selectSpotlight({
        FrecentHistory: {rows: [site]},
        Blocked: {urls: new Set()}
      });
      assert.deepEqual(results.rows[0].backgroundColor, "rgba(11, 11, 11, 0.4)");
    });
    it("should use site.background_color for items that dont have an image if it exists", () => {
      const site = {
        url: "https://foo.com",
        background_color: "#111111",
        favicon_colors: [{color: [11, 11, 11]}]
      };
      const results = selectSpotlight({
        FrecentHistory: {rows: [site]},
        Blocked: {urls: new Set()}
      });
      assert.equal(results.rows[0].backgroundColor, "#111111");
    });
    it("should use a fallback bg color if no favicon_colors are available", () => {
      const site = {url: "https://foo.com"};
      const results = selectSpotlight({
        FrecentHistory: {rows: [site]},
        Blocked: {urls: new Set()}
      });
      assert.ok(results.rows[0].backgroundColor, "should have a bg color");
    });
    it("should include first run items if FrecentHistory is empty", () => {
      const results = selectSpotlight({
        FrecentHistory: {rows: []},
        Blocked: {urls: new Set()}
      });
      firstRunData.Highlights.forEach((item, i) => {
        assert.equal(results.rows[i].url, item.url);
      });
    });
    it("should sort sites that do not have a title to the end", () => {
      assertInvalidSite({
        title: null
      });
    });
    it("should sort sites that do not have a description to the end", () => {
      assertInvalidSite({
        description: null
      });
    });
    it("should sort sites for which the title equals the description to the end", () => {
      assertInvalidSite({
        title: "foo",
        description: "foo"
      });
    });
    it("should sort sites that do not have an images prop or an empty array to the end", () => {
      assertInvalidSite({
        images: null
      });
      assertInvalidSite({
        images: []
      });
    });
    it("should append History sites to the end", () => {
      assertInvalidSite({
        images: null
      });
      assertInvalidSite({
        images: []
      });
    });
    it("should remove urls in block list", () => {
      let frecent = fakeState.FrecentHistory.rows.splice(0, 3);
      state = selectSpotlight({
        FrecentHistory: {rows: frecent},
        Blocked: {urls: new Set([frecent[0].url])}
      });
      assert.equal(state.rows.length, firstRunData.Highlights.length + frecent.length - 1);
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
      ].concat(firstRunData.TopSites).splice(0, 6));
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
    it("should use site.background_color if it exists", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {background_color: "#111111"}));
      assert.equal(state.backgroundColor, "#111111");
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

describe("getBackgroundRGB", () => {
  it("should use favicon_colors if available", () => {
    assert.deepEqual(
      getBackgroundRGB({url: "http://foo.com", favicon_colors: [{color: [11, 11, 11]}]}),
      [11, 11, 11]
    );
  });
  it("should use a default bg if a favicon is supplied", () => {
    const result = getBackgroundRGB({url: "http://foo.com", favicon_url: "adsd.ico"});
    assert.ok(result);
    assert.deepEqual(result, DEFAULT_FAVICON_BG_COLOR);
  });
  it("should use a random color if no favicon_colors or favicon", () => {
    const result = getBackgroundRGB({url: "http://foo.com"});
    assert.ok(result);
    assert.notDeepEqual(result, DEFAULT_FAVICON_BG_COLOR);
  });
});

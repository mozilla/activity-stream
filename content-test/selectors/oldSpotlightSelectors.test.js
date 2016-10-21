const {rawMockData: fakeState} = require("test/test-utils");
const firstRunData = require("lib/first-run-data");

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

const {selectSpotlight} = require("selectors/oldSpotlightSelectors");
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

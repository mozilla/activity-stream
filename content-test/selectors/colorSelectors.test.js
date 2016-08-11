const {assert} = require("chai");

const {
  selectSiteIcon,
  getBackgroundRGB,
  assignImageAndBackgroundColor
} = require("selectors/colorSelectors");

const DEFAULT_FAVICON_BG_COLOR = [150, 150, 150];
const BACKGROUND_FADE = 0.5;

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

describe("colorSelectors", () => {
  describe("getBackgroundRGB", () => {
    it("should use favicon_colors if available", () => {
      assert.deepEqual(
        getBackgroundRGB({url: "http://foo.com", favicon_colors: [{color: [11, 11, 11]}]}),
        [11, 11, 11]
      );
    });
    it("should use favicons[0].color if available", () => {
      assert.deepEqual(
        getBackgroundRGB({url: "http://foo.com", favicons: [{color: [11, 11, 11]}]}),
        [11, 11, 11]
      );
    });
    it("should use a default bg if a favicon is supplied", () => {
      const result = getBackgroundRGB({url: "http://foo.com", favicon_url: "adsd.ico"});
      assert.ok(result);
      assert.deepEqual(result, DEFAULT_FAVICON_BG_COLOR);
    });
    it("should use a random color if no favicon_colors or favicon or favicons[0].color", () => {
      const result = getBackgroundRGB({url: "http://foo.com"});
      assert.ok(result);
      assert.notDeepEqual(result, DEFAULT_FAVICON_BG_COLOR);
    });
  });

  describe("selectSiteIcon", () => {
    const siteWithFavicon = {
      url: "http://foo.com",
      favicon_url: "http://foo.com/favicon.ico",
      favicon: "http://foo.com/favicon-16.ico",
      favicons: [{
        colors: [11, 11, 11],
        url: "http://foo.com/metadatafavicon.ico"
      }],
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
    it("should fall back to favicon", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {favicon_url: null, favicons: null}));
      assert.equal(state.favicon, siteWithFavicon.favicon);
    });
    it("should use favicons[0].url if exists", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {favicon_url: null}));
      assert.equal(state.favicon, siteWithFavicon.favicons[0].url);
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
      assert.equal(state.backgroundColor, `rgba(11, 11, 11, ${BACKGROUND_FADE})`);
    });
    it("should create an opaque background color if there is no favicon", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {favicon_url: null, favicon: null, favicons: null}));
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

  describe("assignImageAndBackgroundColor", () => {
    it("should set bestImage and backgroundColor prop", () => {
      let result = assignImageAndBackgroundColor([validSpotlightSite]);

      assert.equal(result.length, 1);
      assert.ok(result[0].bestImage);
      assert.ok(result[0].backgroundColor);
    });
  });
});

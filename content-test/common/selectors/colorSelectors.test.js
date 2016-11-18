const {
  selectSiteIcon,
  getFallbackColor,
  assignImageAndBackgroundColor
} = require("common/selectors/colorSelectors");

const DEFAULT_FAVICON_BG_COLOR = [150, 150, 150];

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
  describe("getFallbackColor", () => {
    it("should use a default bg if a favicon is supplied", () => {
      const result = getFallbackColor({url: "http://foo.com", favicon_url: "adsd.ico"});
      assert.ok(result);
      assert.deepEqual(result, DEFAULT_FAVICON_BG_COLOR);
    });
    it("should use a random color if no background_color", () => {
      const result = getFallbackColor({url: "http://foo.com"});
      assert.ok(result);
      assert.notDeepEqual(result, DEFAULT_FAVICON_BG_COLOR);
    });
  });

  describe("selectSiteIcon", () => {
    const siteWithFavicon = {
      eTLD: "com",
      url: "http://foo.com",
      favicon_url: "http://foo.com/favicon.ico",
      background_color: [11, 11, 11]
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
    it("should select the first letter of the hostname", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {url: "http://kate.com"}));
      assert.equal(state.firstLetter, "k");
    });
    it("should use site.background_color if it exists", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {background_color: [0, 0, 0]}));
      assert.equal(state.backgroundColor, "rgb(0, 0, 0)");
    });
    it("should create a background color", () => {
      assert.equal(state.backgroundColor, "rgb(11, 11, 11)");
    });
    it("should create an opaque background color if there is no favicon", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {favicon_url: null, background_color: null}));
      const regex = /rgba\([1-9]+,\s{1}[1-9]+,\s{1}[1-9]+,\s{1}1\)/;
      assert.ok(regex.test(state.backgroundColor));
    });
    it("should create a random background color if no favicon color exists", () => {
      state = selectSiteIcon(Object.assign({}, siteWithFavicon, {background_color: null}));
      assert.ok(state.backgroundColor);
    });
    it("should create a contrasting font color", () => {
      const darkColor = selectSiteIcon(Object.assign({}, siteWithFavicon, {background_color: [1, 1, 1]}));
      assert.equal(darkColor.fontColor, "white");
      const lightColor = selectSiteIcon(Object.assign({}, siteWithFavicon, {background_color: [200, 200, 200]}));
      assert.equal(lightColor.fontColor, "black");
    });
    it("should add a label (hostname without eTLD)", () => {
      assert.equal(state.label, "foo");
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

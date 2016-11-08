const {selectSiteProperties} = require("selectors/siteMetadataSelectors");

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
const fakeFavicon = {favicon_url: "fakeFavIcon"};
const validSpotlightWithFavicon = Object.assign({}, validSpotlightSite, fakeFavicon);

describe("siteMetadataSelectors", () => {
  describe("selectSiteProperties", () => {
    it("should set favicon prop", () => {
      let result = selectSiteProperties(validSpotlightWithFavicon);

      assert.ok(result.favicon);
    });
    it("should set parsedUrl prop", () => {
      let result = selectSiteProperties(validSpotlightSite);

      assert.ok(result.parsedUrl);
    });
    it("should set label prop without eTLD set", () => {
      let result = selectSiteProperties(validSpotlightSite);

      assert.equal(result.label, "cnn.com");
    });
    it("should set label prop with eTLD set", () => {
      let result = selectSiteProperties(Object.assign({}, validSpotlightSite, {eTLD: "com"}));

      assert.equal(result.label, "cnn");
    });
  });
});

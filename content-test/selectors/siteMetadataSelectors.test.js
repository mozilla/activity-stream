const {
  selectSiteProperties,
  selectSitePreview
} = require("selectors/siteMetadataSelectors");

const {IMG_WIDTH, IMG_HEIGHT} = require("common/getBestImage");

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
  describe("selectSitePreview", () => {
    const siteWithMedia = {
      url: "https://www.youtube.com/watch?v=lDv68xYHFXM",
      images: [{url: "foo.jpg", height: IMG_HEIGHT, width: IMG_WIDTH}],
      media: {type: "video"}
    };
    const embedPreviewURL = "https://www.youtube.com/embed/lDv68xYHFXM?autoplay=1";
    let state;
    beforeEach(() => {
      state = selectSitePreview(siteWithMedia);
    });

    it("should not throw", () => {
      assert.doesNotThrow(() => {
        selectSitePreview({});
      });
    });

    it("should have a preview url", () => {
      assert.equal(state.previewURL, embedPreviewURL);
    });
    it("should have a thumbnail", () => {
      assert.property(state, "thumbnail");
      assert.isObject(state.thumbnail);
      assert.property(state.thumbnail, "url");
      assert.equal(state.thumbnail.url, siteWithMedia.images[0].url);
    });
    it("should have a type", () => {
      assert.equal(state.type, siteWithMedia.media.type);
    });
    it("should return null thumbnail if no images exists", () => {
      state = selectSitePreview(Object.assign({}, siteWithMedia, {images: []}));
      assert.isNull(state.thumbnail);
    });
    it("should return null preview url if no valid embed was found", () => {
      state = selectSitePreview(Object.assign({}, siteWithMedia, {url: "http://foo.com"}));
      assert.isNull(state.previewURL);
    });
    it("no video preview if type is not video", () => {
      state = selectSitePreview(Object.assign({}, siteWithMedia, {media: {type: "image"}}));
      assert.isNull(state.previewURL);
    });
    it("no video preview or thumbnail if no media type is set", () => {
      state = selectSitePreview(Object.assign({}, siteWithMedia, {media: null}));
      assert.isNull(state.thumbnail);
      assert.isNull(state.previewURL);
    });
  });

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

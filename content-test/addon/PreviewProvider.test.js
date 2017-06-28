"use strict";
const createPreviewProvider = require("inject!addon/PreviewProvider");
const {BACKGROUND_FADE} = require("../../common/constants");
const BACKGROUND_COLOR = [255, 255, 255];
const getColor = function() {
  return Promise.resolve(BACKGROUND_COLOR);
};

let fakeSite = {"url": "https://getMyFaviconColor.com", "favicon": "favicon.ico"};
const {PreviewProvider} = createPreviewProvider({"addon/ColorAnalyzerProvider": {getColor}});

describe("PreviewProvider", () => {
  let previewProvider;

  beforeEach(() => {
    previewProvider = new PreviewProvider({}, {});
  });

  it("should be an get the correct color and set the background fade", () => {
    const expectedColor = [...BACKGROUND_COLOR, BACKGROUND_FADE];
    return previewProvider._getFaviconColors(fakeSite).then(color => assert.deepEqual(color, expectedColor));
  });

  it("should return null if there is no favicon provided", () => {
    fakeSite.favicon = null;
    return previewProvider._getFaviconColors(fakeSite).then(color => assert.equal(color, null));
  });

  describe("asyncLinkExists", () => {
    it("should sanitize the url before calling createCacheKey", () => {
      const fakeMetadataStore = {asyncCacheKeyExists: url => Promise.resolve(url)};
      previewProvider = new PreviewProvider({}, fakeMetadataStore);

      const url1 = previewProvider.asyncLinkExist("https://developer.mozilla.org/search?bar=foo");
      const url2 = previewProvider.asyncLinkExist("https://developer.mozilla.org/search");

      return Promise.all([url1, url2]).then(([v1, v2]) => {
        assert.equal(v1, v2);
      });
    });
  });
});

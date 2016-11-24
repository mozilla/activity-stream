/* globals assert, require */
"use strict";
const createPreviewProvider = require("inject!addon/PreviewProvider");
const {BACKGROUND_FADE} = require("../../common/constants");
const BACKGROUND_COLOR = [255, 255, 255];
const mockExperimentProvider = {data: {metadataService: false}};
const getColor = function() {
  return Promise.resolve(BACKGROUND_COLOR);
};
describe("PreviewProvider", () => {
  const {PreviewProvider} = createPreviewProvider({"addon/ColorAnalyzerProvider": {getColor}});
  const previewProvider = new PreviewProvider({}, {}, mockExperimentProvider);
  let fakeSite = {"url": "https://getMyFaviconColor.com", "favicon": "favicon.ico"};

  it("should be an get the correct color and set the background fade", () => {
    const expectedColor = [...BACKGROUND_COLOR, BACKGROUND_FADE];
    return previewProvider._getFaviconColors(fakeSite).then(color => assert.deepEqual(color, expectedColor));
  });

  it("should return null if there is no favicon provided", () => {
    fakeSite.favicon = null;
    return previewProvider._getFaviconColors(fakeSite).then(color => assert.equal(color, null));
  });
});

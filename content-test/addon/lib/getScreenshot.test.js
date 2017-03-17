const getScreenshot = require("addon/lib/getScreenshot");
const {overrideGlobals} = require("test/test-utils");

describe("getScreenshot", () => {
  const testUrl = "http://www.example.com";
  const testScreenshot = "testScreenshot.jpg";

  let restore;

  beforeEach(() => {
    getScreenshot.screenshotCache.clear();
    restore = overrideGlobals({PreviewProvider: {getThumbnail: url => Promise.resolve(testScreenshot)}});
  });

  after(() => restore());

  it("should return null for an uncomputed screenshot and set the key to in flight", () => {
    const screenshot = getScreenshot(testUrl);
    assert.equal(screenshot, null);
    assert.equal(Array.from(getScreenshot.screenshotCache.keys()).length, 1);
    assert.equal(getScreenshot.screenshotCache.get(testUrl), getScreenshot.SCREENSHOT_IN_FLIGHT);
  });

  it("should send a SCREENSHOT_UPDATED action to the store when a screenshot is computed", done => {
    getScreenshot(testUrl, {
      dispatch: action => {
        assert.equal(action.type, "SCREENSHOT_UPDATED");

        const screenshot = getScreenshot(testUrl);
        assert.equal(screenshot, testScreenshot);

        done();
      }
    });
  });

  it("should store null for a screenshot that failed to compute", () => {
    restore();
    restore = overrideGlobals({PreviewProvider: {getThumbnail: url => Promise.reject(new Error("Screenshot failed"))}});

    const screenshot = getScreenshot(testUrl);
    assert.equal(screenshot, null);
  });
});

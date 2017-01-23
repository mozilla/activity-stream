const getScreenshots = require("addon/lib/getScreenshots");
const {overrideGlobals} = require("test/test-utils");

// Fake stuff for testing
const fakeThumbnail = url => `${url}/thumbnail.jpg`;
const TEST_SITES = [{url: "foo.com"}, {url: "bar.com"}];

// This is just a short form for calling getScreenshots with the default TEST_SITES data
function runWithSites(callback) {
  return getScreenshots(TEST_SITES).then(result => callback(result));
}

describe("getScreenshots", () => {
  let restore;
  beforeEach(() => {
    restore = overrideGlobals(
      {PreviewProvider: {getThumbnail: url => Promise.resolve(fakeThumbnail(url))}}
    );
  });
  after(() => restore());

  it("should return an array of sites", () => runWithSites(result => {
    assert.equal(result.length, TEST_SITES.length);
  }));

  it("should return a new array without modifying the original", () => runWithSites(result => {
    assert.notEqual(result, TEST_SITES);
    assert.deepEqual(TEST_SITES, [{url: "foo.com"}, {url: "bar.com"}]);
  }));

  it("should add a screenshot property to each site", () => runWithSites(result => {
    TEST_SITES.forEach((site, i) => {
      assert.property(result[i], "screenshot");
      assert.equal(result[i].screenshot, fakeThumbnail(result[i].url));
    });
  }));
  it("should not get thumbnails if if condition returns false", () => (
    getScreenshots(TEST_SITES, () => false).then(result => {
      TEST_SITES.forEach((site, i) => assert.notProperty(result[i], "screenshot"));
    })
  ));
  it("should get thumbnails if if condition returns true", () => (
    getScreenshots(TEST_SITES, site => site.url === TEST_SITES[0].url).then(result => {
      assert.property(result[0], "screenshot");
      assert.notProperty(result[1], "screenshot");
    })
  ));
});

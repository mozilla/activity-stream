"use strict";

const {before, after, waitUntil} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");
const {PreviewProvider} = require("addon/PreviewProvider");
const {MetadataStore} = require("addon/MetadataStore");
const {metadataFixture} = require("./lib/MetastoreFixture.js");

const gMetadataStore = new MetadataStore();
let gPreviewProvider;
let gPrefEnabled = simplePrefs.prefs["previews.enabled"];

exports.test_find_correct_links = function*(assert) {
  yield gMetadataStore.asyncInsert(metadataFixture);
  const links = [
    {url: "https://www.mozilla.org/", cache_key: "mozilla.org/"},
    {url: "https://www.mozilla.org/en-US/firefox/new", cache_key: "mozilla.org/en-US/firefox/new"},
    {url: "https://www.notinDB.com/", cache_key: "notinDB.com/", places_url: "https://www.notinDB.com/"}];

  // find the items in the database, based on their cache keys
  const dbLinks = yield gPreviewProvider._asyncFindItemsInDB(links);
  assert.equal(dbLinks.length, 2, "returned two items out of the three based on their cache_key");
  assert.equal(dbLinks[0].cache_key, links[0].cache_key, "correctly returned the first link");
  assert.equal(dbLinks[1].cache_key, links[1].cache_key, "correctly returned the second link");
};

exports.test_get_links_from_metadatastore = function*(assert) {
  yield gMetadataStore.asyncInsert(metadataFixture);
  const links = [
    {url: "https://www.mozilla.org/"},
    {url: "https://www.mozilla.org/en-US/firefox/new"},
    {
      url: "https://www.notindb.com/",
      cache_key: "notindb.com/",
      places_url: "https://www.notindb.com/",
      favicon_url: "https://www.someImage.com/image.jpg",
      favicon_height: 96,
      favicon_width: 96
    }];

  // get enhanced links - the third link should be returned as is since it
  // is not yet in the database
  let cachedLinks = yield gPreviewProvider.asyncGetEnhancedLinks(links);
  assert.equal(cachedLinks.length, 3, "returned all 3 links");
  assert.deepEqual(cachedLinks[2].cache_key, links[2].cache_key, "generated a cache_key for the third link");

  // get enhanced links after third link has been inserted in db - the third
  // link should now have more properties i.e title, description etc...
  yield gMetadataStore.asyncInsert([links[2]]);
  cachedLinks = yield gPreviewProvider.asyncGetEnhancedLinks(links);
  assert.equal(cachedLinks.length, 3, "returned all 3 links");
  assert.equal(cachedLinks[2].title, null, "the third link has a title field");
  assert.equal(cachedLinks[2].description, null, "the third link has a description field");
  assert.deepEqual(cachedLinks[2].images, [], "the third link has images field");
  assert.equal(cachedLinks[2].favicon_url, links[2].favicon_url, "the third link has the correct favicon_url");
  assert.equal(cachedLinks[2].favicon_height, 96, "the third link has the correct favicon_height");
  assert.equal(cachedLinks[2].favicon_width, 96, "the third link has the correct favicon_width");
};

function waitForAsyncReset() {
  return waitUntil(function*() {
    if (gMetadataStore.transactionInProgress) {
      return false;
    }

    try {
      let nMetadata = yield gMetadataStore.asyncExecuteQuery(
        "SELECT count(*) as count FROM page_metadata",
        {"columns": ["count"]});
      let nImages = yield gMetadataStore.asyncExecuteQuery(
        "SELECT count(*) as count FROM page_images",
        {"columns": ["count"]});
      let nMetadataImages = yield gMetadataStore.asyncExecuteQuery(
        "SELECT count(*) as count FROM page_metadata_images",
        {"columns": ["count"]});
      return !nMetadata[0].count &&
        !nImages[0].count &&
        !nMetadataImages[0].count;
    } catch (e) {
      // ignore whatever error that makes the query above fail
      return false;
    }
  }, 10);
}

before(exports, function*() {
  simplePrefs.prefs["previews.enabled"] = true;
  yield gMetadataStore.asyncConnect();
  let mockTabTracker = {handlePerformanceEvent() {}, generateEvent() {}};
  gPreviewProvider = new PreviewProvider(mockTabTracker, gMetadataStore, {initFresh: true});
  gPreviewProvider._store = {
    dispatch: () => {},
    getState: () => ({Experiments: {values: {}}})
  };
  gPreviewProvider._getFaviconColors = function() {
    return Promise.resolve(null);
  };
  gPreviewProvider._computeImageSize = function(url) {
    return Promise.resolve({url, height: 96, width: 96});
  };
});

after(exports, function*() {
  simplePrefs.prefs["previews.enabled"] = gPrefEnabled;
  yield gMetadataStore.asyncReset();
  yield waitForAsyncReset();
  yield gMetadataStore.asyncClose();
  gPreviewProvider.uninit();
});

require("sdk/test").run(exports);

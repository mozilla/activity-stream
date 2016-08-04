/* globals require, exports */

"use strict";

const {before, after, waitUntil} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");
const {Loader} = require("sdk/test/loader");
const loader = Loader(module);
const httpd = loader.require("./lib/httpd");
const {PreviewProvider} = require("lib/PreviewProvider");
const {MetadataStore} = require("lib/MetadataStore");
const {metadataFixture} = require("./lib/MetastoreFixture.js");

const gMetadataStore = new MetadataStore();
const gPort = 8079;
let gPreviewProvider;
let gPrefEmbedly = simplePrefs.prefs["embedly.endpoint"];
let gPrefEnabled = simplePrefs.prefs["previews.enabled"];

exports.test_metadatastore_saves_new_links = function*(assert) {
  // to start, put some links in the database
  yield gMetadataStore.asyncInsert(metadataFixture);
  let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 3, "sanity check that we only have 3 items in the database to start");

  // these are links we are going to request - the first two should get filtered out
  const links = [
    {cache_key: "https://www.mozilla.org/", places_url: "https://www.mozilla.org/"},
    {cache_key: "https://www.mozilla.org/en-US/firefox/new/", places_url: "https://www.mozilla.org/en-US/firefox/new"},
    {cache_key: "https://notinDB.com/", places_url: "https://www.notinDB.com/", sanitized_url: "https://www.notinDB.com/"}];
  const fakeResponse = {"urls": {
    "https://www.notinDB.com/": {
      "embedlyMetaData": "some embedly metadata"
    }
  }};

  let srv = httpd.startServerAsync(gPort);
  srv.registerPathHandler("/previewProviderMetadataStore", function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  // only request the items that are not in the database and wait for them to
  // successfully be inserted
  yield gPreviewProvider._asyncSaveLinks(links);

  // asyncSaveLinks doesn't yield on inserting in the db so we need to wait
  // until it has successfully finished the transaction before checking
  yield waitUntil(() => !gMetadataStore.transactionInProgress);

  // check that it inserted the link that was filtered out
  items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 4, "it should now have a length of 4");
  assert.equal(items[3][1], links[2].cache_key, "it newly inserted the one we didn't already have");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_find_correct_links = function*(assert) {
  yield gMetadataStore.asyncInsert(metadataFixture);
  const links = [
    {cache_key: "https://www.mozilla.org/", places_url: "https://www.mozilla.org/"},
    {cache_key: "https://www.mozilla.org/en-US/firefox/new/", places_url: "https://www.mozilla.org/en-US/firefox/new"},
    {cache_key: "https://www.notinDB.com/", places_url: "https://www.notinDB.com/"}];

  // find the items in the database, based on their cache keys
  const dbLinks = yield gPreviewProvider._asyncFindItemsInDB(links);
  assert.equal(dbLinks.length, 2, "returned two items out of the three based on their cache_key");
  assert.equal(dbLinks[0].cache_key, links[0].cache_key, "correctly returned the first link");
  assert.equal(dbLinks[1].cache_key, links[1].cache_key, "correctly returned the second link");
};

exports.test_get_links_from_metadatastore = function*(assert) {
  yield gMetadataStore.asyncInsert(metadataFixture);
  const links = [
    {cache_key: "https://www.mozilla.org/", places_url: "https://www.mozilla.org/"},
    {cache_key: "https://www.mozilla.org/en-US/firefox/new/", places_url: "https://www.mozilla.org/en-US/firefox/new"},
    {cache_key: "https://www.notinDB.com/", places_url: "https://www.notinDB.com/"}];

  // get enhanced links - the third link should be returned as is since it
  // is not yet in the database
  let cachedLinks = yield gPreviewProvider._asyncGetEnhancedLinks(links);
  assert.equal(cachedLinks.length, 3, "returned all 3 links");
  assert.deepEqual(cachedLinks[2], links[2], "the third link was untouched");

  // get enhanced links after third link has been inserted in db - the third
  // link should now have more properties i.e title, description etc...
  yield gMetadataStore.asyncInsert([links[2]]);
  cachedLinks = yield gPreviewProvider._asyncGetEnhancedLinks(links);
  assert.equal(cachedLinks.length, 3, "returned all 3 links");
  assert.equal(cachedLinks[2].title, null, "the third link has a title field");
  assert.equal(cachedLinks[2].description, null, "the third links has a description field");
  assert.deepEqual(cachedLinks[2].images, [], "the third links has images field");
  assert.deepEqual(cachedLinks[2].favicons, [], "the third links has favicons field");
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
      /* ignore whatever error that makes the query above fail */
      return false;
    }
  }, 10);
}

before(exports, function*() {
  simplePrefs.prefs["embedly.endpoint"] = `http://localhost:${gPort}/previewProviderMetadataStore`;
  simplePrefs.prefs["previews.enabled"] = true;
  yield gMetadataStore.asyncConnect();
  let mockTabTracker = {handlePerformanceEvent: function() {}, generateEvent: function() {}};
  gPreviewProvider = new PreviewProvider(mockTabTracker, gMetadataStore, {initFresh: true});
});

after(exports, function*() {
  simplePrefs.prefs["embedly.endpoint"] = gPrefEmbedly;
  simplePrefs.prefs["previews.enabled"] = gPrefEnabled;
  yield gMetadataStore.asyncReset();
  yield waitForAsyncReset();
  yield gMetadataStore.asyncClose();
  gPreviewProvider.uninit();
});

require("sdk/test").run(exports);

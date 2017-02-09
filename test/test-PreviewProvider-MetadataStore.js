/* globals require, exports */

"use strict";

const {before, after, waitUntil} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");
const {Loader} = require("sdk/test/loader");
const loader = Loader(module);
const httpd = loader.require("./lib/httpd");
const {PreviewProvider} = require("addon/PreviewProvider");
const {MetadataStore} = require("addon/MetadataStore");
const {metadataFixture} = require("./lib/MetastoreFixture.js");

const gMetadataStore = new MetadataStore();
const gPort = 8079;
let gPreviewProvider;
let gEndpoint = simplePrefs.prefs["metadata.endpoint"];
let gPrefEnabled = simplePrefs.prefs["previews.enabled"];

exports.test_metadatastore_saves_new_links = function*(assert) {
  // to start, put some links in the database
  yield gMetadataStore.asyncInsert(metadataFixture);
  let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 3, "sanity check that we only have 3 items in the database to start");

  // these are links we are going to request - the first two should get filtered out
  const links = [
    {url: "https://www.mozilla.org/"},
    {url: "https://www.mozilla.org/en-US/firefox/new"},
    {url: "https://www.notindb.com/", cache_key: "notindb.com/"}];
  const fakeResponse = {"urls": {"https://www.notindb.com/": {"description": "some metadata"}}};

  let srv = httpd.startServerAsync(gPort);
  srv.registerPathHandler("/previewProviderMetadataStore", function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  // only request the items that are not in the database and wait for them to
  // successfully be inserted
  yield gPreviewProvider.asyncSaveLinks(links);

  // asyncSaveLinks doesn't yield on inserting in the db so we need to wait
  // until it has successfully finished the transaction before checking
  yield waitUntil(() => !gMetadataStore.transactionInProgress);

  // check that it inserted the link that was filtered out
  items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata order by cache_key");
  assert.equal(items.length, 4, "it should now have a length of 4");
  assert.equal(items[3][1], links[2].cache_key, "it newly inserted the one we didn't already have");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

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

exports.test_metadatastore_saves_new_links_when_computeImageSize_rejects = function*(assert) {
  // change _computeImageSize to reject() always
  gPreviewProvider._computeImageSize = function(url) {
    return Promise.reject("unable to compute image size");
  };

  // put some links in the database
  yield gMetadataStore.asyncInsert(metadataFixture);
  let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 3, "sanity check that we only have 3 items in the database to start");

  // these are links we are going to request - the first two should get filtered out
  const links = [
    {url: "https://www.mozilla.org/"},
    {url: "https://www.mozilla.org/en-US/firefox/new"},
    {url: "https://www.notindb.com/", cache_key: "notindb.com/"}];
  const fakeResponse = {"urls": {"https://www.notindb.com/": {"description": "some metadata"}}};

  let srv = httpd.startServerAsync(gPort);
  srv.registerPathHandler("/previewProviderMetadataStore", function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  // only request the items that are not in the database and wait for them to
  // successfully be inserted
  yield gPreviewProvider.asyncSaveLinks(links);

  // asyncSaveLinks doesn't yield on inserting in the db so we need to wait
  // until it has successfully finished the transaction before checking
  yield waitUntil(() => !gMetadataStore.transactionInProgress);

  // check that it inserted the link that was filtered out
  items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata order by cache_key");
  assert.equal(items.length, 4, "it should now have a length of 4");
  assert.equal(items[3][1], links[2].cache_key, "it newly inserted the one we didn't already have");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
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
  simplePrefs.prefs["metadata.endpoint"] = `http://localhost:${gPort}/previewProviderMetadataStore`;
  simplePrefs.prefs["previews.enabled"] = true;
  yield gMetadataStore.asyncConnect();
  let mockTabTracker = {handlePerformanceEvent() {}, generateEvent() {}};
  gPreviewProvider = new PreviewProvider(mockTabTracker, gMetadataStore, {initFresh: true});
  gPreviewProvider._store = {dispatch: () => {}};
  gPreviewProvider._getFaviconColors = function() {
    return Promise.resolve(null);
  };
  gPreviewProvider._computeImageSize = function(url) {
    return Promise.resolve({url, height: 96, width: 96});
  };
});

after(exports, function*() {
  simplePrefs.prefs["metadata.endpoint"] = gEndpoint;
  simplePrefs.prefs["previews.enabled"] = gPrefEnabled;
  yield gMetadataStore.asyncReset();
  yield waitForAsyncReset();
  yield gMetadataStore.asyncClose();
  gPreviewProvider.uninit();
});

require("sdk/test").run(exports);

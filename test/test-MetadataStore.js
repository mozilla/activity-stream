/* globals require, exports */
"use strict";

const {before, after, waitUntil} = require("sdk/test/utils");
const {MetadataStore} = require("lib/MetadataStore.js");
const {metadataFixture} = require("./lib/MetastoreFixture.js");
const fileIO = require("sdk/io/file");

const gMetadataStore = new MetadataStore();

/**
 * Description of the metadata fixture
 *
 * The metadata fixture is composed of 3 pages, i.e.
 *   1. https://www.mozilla.org/
 *   2. https://www.mozilla.org/en-US/firefox/new/
 *   3. https://www.mozilla.org/en-GB/firefox/new/
 * where the page #1 consists of 1 favicon and 1 image, whereas both
 * page #2 and #3 share the same 1 favicon and 2 images, respectively
 */

/**
 * This function could be used to ensure the "asyncReset" actually commit
 * the transaction. It appears that the transaction might be still in
 * the uncommitted state despite its promise is resolved in Sqlite.jsm.
 * Hence, it has to poll for the table info periodically to comfirm that
 */
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

/**
 * Test insert every single page separately
 */
exports.test_insert_single = function*(assert) {
  for (let metadata of metadataFixture) {
    yield gMetadataStore.asyncInsert([metadata]);

    let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
    assert.equal(items.length, 1);
    items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_images");
    assert.equal(metadata.images.length + 1, items.length);
    items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata_images");
    assert.equal(metadata.images.length + 1, items.length);
    yield gMetadataStore.asyncReset();
    yield waitForAsyncReset();
  }
};

/**
 * Test insert a partial record
 */
exports.test_insert_partial = function*(assert) {
  yield gMetadataStore.asyncInsert([{
    places_url: "http://foobar.com",
    cache_key: "foobar.com/"
  }]);
  let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 1, "Page is inserted");
  items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_images");
  assert.equal(items.length, 0, "No images were inserted");
  items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata_images");
  assert.equal(items.length, 0, "No metadata_images were inserted");
};

/**
 * Test insert a record with images without colors or sizes
 */
exports.test_insert_partial_images = function*(assert) {
  yield gMetadataStore.asyncInsert([{
    places_url: "http://foobar.com",
    cache_key: "foobar.com/",
    images: [
      {url: "http://foobar.com/blah.com"}
    ]
  }]);
  let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 1, "Page is inserted");
  items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_images");
  assert.equal(items.length, 1, "1 image was inserted");
  items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata_images");
  assert.equal(items.length, 1, "1 metadata_image was inserted");
};

/**
 * Test missing required fields for insert should throw an error
 */
exports.test_insert_required_fields = function*(assert) {
  const correctMessage = "Objects to insert must include a places_url";
  let error;
  try {
    yield gMetadataStore.asyncInsert([{}]);
  } catch (e) {
    error = e;
  }
  assert.ok(error, "Error was thrown for missing cache_key");
  assert.equal(error.message, correctMessage, "Has the right error message");
};

exports.test_insert_twice = function*(assert) {
  const metadata = metadataFixture[0];
  yield gMetadataStore.asyncInsert([metadata]);

  let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 1, "Page is inserted");
  let error = false;
  try {
    yield gMetadataStore.asyncInsert([metadata]);
  } catch (e) {
    error = true;
  }
  assert.ok(error, "Re-insert the same page should be rejected!");
};

/**
 * Test insert all the fixture pages, to test that page #2 and #3
 * should share the same favicon and images instead of storing the
 * same image twice
 */
exports.test_async_insert_all = function*(assert) {
  yield gMetadataStore.asyncInsert(metadataFixture);

  let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 3);
  items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_images");
  assert.equal(items.length, 5); // page #1(1 + 1) + page #2&#3(1 + 2)
  items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata_images");
  assert.deepEqual(items.length, 8);
  assert.deepEqual(items[0], [1, 1]);
  assert.deepEqual(items[1], [1, 2]);
  assert.deepEqual(items[2], [2, 3]);
  assert.deepEqual(items[3], [2, 4]);
  assert.deepEqual(items[4], [2, 5]);
  assert.deepEqual(items[5], [3, 3]);
  assert.deepEqual(items[6], [3, 4]);
  assert.deepEqual(items[7], [3, 5]);
};

exports.test_async_get_by_cache_key = function*(assert) {
  yield gMetadataStore.asyncInsert(metadataFixture);

  for (let fixture of metadataFixture) {
    let metaObjects = yield gMetadataStore.asyncGetMetadataByCacheKey([fixture.cache_key]);
    assert.equal(metaObjects.length, 1, "It should fetch one metadata record");
    let metaObject = metaObjects[0];
    assert.equal(metaObject.favicons.length, 1, "It should fetch one favicon");
    assert.equal(metaObject.images.length, fixture.images.length, "It should fetch one favicon");
  }

  let cacheKeys = metadataFixture.map(fixture => {return fixture.cache_key;});
  let metaObjects = yield gMetadataStore.asyncGetMetadataByCacheKey(cacheKeys);
  assert.equal(metaObjects.length, metadataFixture.length, "It should fetch all metadata records");
};

exports.test_async_get_by_cache_key_in_special_cases = function*(assert) {
  yield gMetadataStore.asyncInsert(metadataFixture);

  let cacheKeys = metadataFixture.map(fixture => {return fixture.cache_key;});
  let metaObjects = yield gMetadataStore.asyncGetMetadataByCacheKey(
    cacheKeys.concat("missing-key1", "missing-key2"));
  assert.equal(metaObjects.length, metadataFixture.length,
    "It should fetch all metadata records despite missing keys are presented in the cache keys");

  // Manually set the image type to invalid values
  yield gMetadataStore.asyncExecuteQuery("UPDATE page_images SET type=-1");
  let error = false;
  try {
    yield gMetadataStore.asyncGetMetadataByCacheKey(cacheKeys);
  } catch (e) {
    error = true;
  }
  assert.ok(error, "It should raise exception on the invalid image type");
};

exports.test_on_an_invalid_connection = function*(assert) {
  yield gMetadataStore.asyncClose();

  let error = false;
  try {
    yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  } catch (e) {
    error = true;
  }
  assert.ok(error, "It should raise exception if the connection is closed or not established");

  error = false;
  try {
    yield gMetadataStore.asycnInsert(metadataFixture);
  } catch (e) {
    error = true;
  }
  assert.ok(error, "It should raise exception if the connection is closed or not established");

  let cacheKeys = metadataFixture.map(fixture => {return fixture.cache_key;});
  let metaObjects = yield gMetadataStore.asyncGetMetadataByCacheKey(cacheKeys);
  assert.equal(metaObjects.length, 0, "It should return an empty array if the connection is closed or not established");
};

exports.test_color_conversions = function(assert) {
  const white = [0, 0, 0];
  const black = [255, 255, 255];
  const randomColor = [111, 122, 133];

  assert.deepEqual(white,
    gMetadataStore._hexToRgb(gMetadataStore._rgbToHex(white)));
  assert.deepEqual(black,
    gMetadataStore._hexToRgb(gMetadataStore._rgbToHex(black)));
  assert.deepEqual(randomColor,
    gMetadataStore._hexToRgb(gMetadataStore._rgbToHex(randomColor)));
  assert.equal(gMetadataStore._hexToRgb(gMetadataStore._rgbToHex(null)), null);
};

exports.test_data_expiry = function*(assert) {
  let item = Object.assign({}, metadataFixture[0]);
  let expected = 2;
  let ticked = 0;

  gMetadataStore.enableDataExpiryJob(100);
  item.expired_at = Date.now();
  yield gMetadataStore.asyncInsert([].concat(item, metadataFixture.slice(1, 3)));
  // it waits until the expired item gets deleted or the waitUntil hits the timeout
  yield waitUntil(function*() {
    let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
    if (items.length === expected || ticked++ > 10) {
      return true;
    }
    return false;
  }, 1000);
  let items = yield gMetadataStore.asyncExecuteQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, expected, "It should have deleted the expired page");
  gMetadataStore.disableDataExpiryJob();
};

exports.test_delete = function*(assert) {
  yield gMetadataStore.asyncInsert(metadataFixture);
  yield gMetadataStore.asyncTearDown();
  assert.ok(!fileIO.exists(gMetadataStore._path), "It should remove the SQLite file");
};

before(exports, function*() {
  yield gMetadataStore.asyncConnect();
});

after(exports, function*() {
  yield gMetadataStore.asyncReset();
  yield waitForAsyncReset();
  yield gMetadataStore.asyncClose();
});

require("sdk/test").run(exports);

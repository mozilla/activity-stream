/* globals require, exports */
"use strict";

const {before, after, waitUntil} = require("sdk/test/utils");
const {MetadataStore} = require("lib/MetadataStore.js");
const {metadataFixture} = require("./lib/MetastoreFixture.js");

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
 * This function could be used to ensure the "asyncDrop" actually commit
 * the transaction. It appears that the transaction might be still in
 * the uncommitted state despite its promise is resolved in Sqlite.jsm.
 * Hence, it has to poll for the table info periodically to comfirm that
 */
function waitForDrop() {
  return waitUntil(function*() {
    if (gMetadataStore.transactionInProgress) {
      return false;
    }

    try {
      let nMetadata = yield gMetadataStore.executeQuery(
        "SELECT count(*) as count FROM page_metadata",
        {"columns": ["count"]});
      let nImages = yield gMetadataStore.executeQuery(
        "SELECT count(*) as count FROM page_images",
        {"columns": ["count"]});
      let nMetadataImages = yield gMetadataStore.executeQuery(
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

    let items = yield gMetadataStore.executeQuery("SELECT * FROM page_metadata");
    assert.equal(items.length, 1);
    items = yield gMetadataStore.executeQuery("SELECT * FROM page_images");
    assert.equal(metadata.images.length + 1, items.length);
    items = yield gMetadataStore.executeQuery("SELECT * FROM page_metadata_images");
    assert.equal(metadata.images.length + 1, items.length);
    yield gMetadataStore.asyncDrop();
    yield waitForDrop();
  }
};

exports.test_insert_twice = function*(assert) {
  const metadata = metadataFixture[0];
  yield gMetadataStore.asyncInsert([metadata]);

  let items = yield gMetadataStore.executeQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 1);
  let error = false;
  try {
    yield gMetadataStore.asyncInsert([metadata]);
  } catch (e) {
    error = true;
  }
  assert.ok(error, "Reinsert the same page should be rejected!");
  yield gMetadataStore.asyncDrop();
  yield waitForDrop();
};

/**
 * Test insert all the fixture pages, to test that page #2 and #3
 * should share the same favicon and images instead of storing the
 * same image twice
 */
exports.test_async_insert_all = function*(assert) {
  yield gMetadataStore.asyncInsert(metadataFixture);

  let items = yield gMetadataStore.executeQuery("SELECT * FROM page_metadata");
  assert.equal(items.length, 3);
  items = yield gMetadataStore.executeQuery("SELECT * FROM page_images");
  assert.equal(items.length, 5); // page #1(1 + 1) + page #2&#3(1 + 2)
  items = yield gMetadataStore.executeQuery("SELECT * FROM page_metadata_images");
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

before(exports, function*() {
  yield gMetadataStore.asyncConnect();
});

after(exports, function*() {
  yield gMetadataStore.asyncDrop();
  yield waitForDrop();
  while (gMetadataStore.transactionInProgress) {
    yield;
  }
  yield gMetadataStore.asyncClose();
});

require("sdk/test").run(exports);

/* globals Task */
"use strict";

const {Cu} = require("chrome");

const {Page, DEFAULT_MAX_AGE} = require("addon/task-queue/Page");
const {Storage} = require("addon/task-queue/Storage");

Cu.import("resource://gre/modules/Task.jsm");

const TEST_URLS = [
  "https://foo.bar",
  "https://bar.foo",
  "http://foo.bar",
  "https://example.com",
  "https://www.example.com",
  "https://example.com/page1",
  "https://example.com/page2",
  "https://example.com?query=true"
];

exports["test instantiation"] = function(assert) {
  assert.throws(() => new Page({}), /URL must be defined/, "Page needs at least an url to be instantiated");
};

exports["test Page serialization"] = function(assert) {
  let fullPage = {
    url: "https://foo.bar",
    maxAge: DEFAULT_MAX_AGE,
    remote: false,
    createdAt: Date.now()
  };

  // Creates a new page
  let page = new Page(fullPage);

  // Serializes the page and compare to the serialized fullPage
  let serializedPage = JSON.stringify(page);
  assert.equal(serializedPage, JSON.stringify(fullPage), "Serialized page is equal to serialized origin object");
};

exports["test save page"] = function*(assert) {
  // Initialize the database
  let storage = Storage.instance();
  yield storage.asyncCreateTables();

  // Create new page and saves it
  let page = new Page({url: TEST_URLS[0]});
  yield page.save();

  // Get the saved page from the database and compare to the original one.
  let savedPage = yield Page.asyncGetByUrl(page.url);
  assert.deepEqual(page, savedPage, "Saved page was recovered");

  // Drops the database and closes the connection
  yield storage.asyncDropTables();
  yield storage.asyncCloseConnection();
};

exports["test saving multiple pages and getting each one"] = function*(assert) {
  // Initialize the database
  let storage = Storage.instance();
  yield storage.asyncCreateTables();

  let savePromises = [];
  TEST_URLS.forEach(url => {
    let page = new Page({url});
    savePromises.push(page.save());
  });

  yield Promise.all(savePromises);

  let size = yield storage.asyncExecuteCached("check size", "SELECT count(*) FROM moz_pages");
  assert.equal(size[0][0], TEST_URLS.length, "table size is correct");

  let promises = TEST_URLS.map(Task.async(function*(url) {
    let page = yield Page.asyncGetByUrl(url);
    assert.ok(page instanceof Page, "Returned a page");
  }));

  yield Promise.all(promises);

  // Drops the database and closes the connection
  yield storage.asyncDropTables();
  yield storage.asyncCloseConnection();
};

exports["test getting page expiration"] = function*(assert) {
  let storage = Storage.instance();
  yield storage.asyncCreateTables();

  // Create new page and saves it
  let page = new Page({url: TEST_URLS[0]});
  yield page.save();

  let expiration = yield Page.asyncGetExpiration(page.url);
  assert.equal(page.expiration, expiration, "Recovered expiration is the same as the page one");

  yield storage.asyncDropTables();
  yield storage.asyncCloseConnection();
};

require("sdk/test").run(exports);

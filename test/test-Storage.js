/* globals Task */
"use strict";

const {before, after} = require("sdk/test/utils");
const {Storage} = require("addon/task-queue/Storage.js");
const {Cu} = require("chrome");

Cu.import("resource://gre/modules/Task.jsm");

let STORAGE;

const FILE_CONTENT = "Lorem ipsum dolor sit amet, no dolor epicuri posidonium usu, pro soluta ancillae ad. Est tibique patrioque temporibus eu, ei duo discere diceret denique. Dicam dolores constituam cum ea. Mei illum ipsum iriure ea. Ad tempor persequeris comprehensam cum, duo et quidam mentitum nominavi.";

exports["test that tables are created"] = function*(assert) {
  let tableCheckSQL = "SELECT name FROM sqlite_master WHERE type='table' AND name=:name";
  let pagesTable = yield STORAGE.asyncExecuteCached("check pages table existence", tableCheckSQL, {params: {name: "moz_pages"}});
  assert.ok(pagesTable.length, "Found a moz_pages table");

  let tasksTable = yield STORAGE.asyncExecuteCached("check tasks table existence", tableCheckSQL, {params: {name: "moz_tasks"}});
  assert.ok(tasksTable.length, "Found a moz_tasks table");
};

exports["test that indexes are created"] = function*(assert) {
  let taskIndexes = yield STORAGE.asyncExecuteCached("check task indexes", "PRAGMA INDEX_LIST(moz_tasks);");
  assert.equal(taskIndexes.length, 2, "Task table have 2 indexes"); // ROWID is not shown by this function

  let pageIndexes = yield STORAGE.asyncExecuteCached("check page indexes", "PRAGMA INDEX_LIST(moz_pages);");
  assert.equal(pageIndexes.length, 1, "Pages table have 1 index");
};

exports["test inserting, selecting and deleting a page"] = function*(assert) {
  const insertPage = `INSERT INTO moz_pages (url, maxAge, createdAt, remote)
                      VALUES (:url, :maxAge, :createdAt, :remote);`;
  const deletePage = "DELETE FROM moz_pages WHERE url = :url;";

  let requestPage = Task.async(function*(url) {
    const selectPage = "SELECT url, maxAge, createdAt, remote FROM moz_pages WHERE url = :url;";
    return yield STORAGE.asyncExecuteCached("select page", selectPage, {
      columns: ["url", "maxAge", "createdAt", "remote"],
      params: {url}
    });
  });

  let params = {
    url: "http://foo.bar",
    maxAge: 1467225044,
    createdAt: null,
    remote: 0
  };

  let page = yield requestPage(params.url);
  assert.equal(page.length, 0, "The table is empty.");

  yield STORAGE.asyncExecuteCached("insert pages", insertPage, {params});
  page = yield requestPage(params.url);

  assert.equal(page.length, 1, "The table has 1 entry.");
  assert.deepEqual(page, [params], "Selected page is equal to the inserted one.");

  yield STORAGE.asyncExecuteCached("delete page", deletePage, {params: {url: params.url}});
  page = yield requestPage(params.url);
  assert.equal(page.length, 0, "The table is empty again.");
};

exports["test inserting, selecting and deleting a task"] = function*(assert) {
  const insertTask = `INSERT INTO moz_tasks (id, pageUrl, createdAt, jobStartedAt, status, type)
                      VALUES (:id, :pageUrl, :createdAt, :jobStartedAt, :status, :type);`;
  const deleteTask = "DELETE FROM moz_tasks WHERE id = :id;";

  let requestTask = Task.async(function*(id) {
    const selectTask = "SELECT id, pageUrl, createdAt, jobStartedAt, status, type FROM moz_tasks WHERE id = :id;";
    return yield STORAGE.asyncExecuteCached("select task", selectTask, {
      columns: ["id", "pageUrl", "createdAt", "jobStartedAt", "status", "type"],
      params: {id}
    });
  });
  let params = {
    id: 1,
    pageUrl: "http://foo.bar",
    createdAt: 1467225044,
    jobStartedAt: null,
    status: "new",
    type: "metadata"
  };

  let task = yield requestTask(params.id);
  assert.equal(task.length, 0, "The table is empty.");

  yield STORAGE.asyncExecuteCached("insert tasks", insertTask, {params});
  task = yield requestTask(params.id);

  assert.equal(task.length, 1, "The table has 1 entry.");
  assert.deepEqual(task, [params], "Selected task is equal to the inserted one.");

  yield STORAGE.asyncExecuteCached("delete task", deleteTask, {params: {id: params.id}});
  task = yield requestTask(params.url);
  assert.equal(task.length, 0, "The table is empty again.");
};

exports["test saving a file and reading from it"] = function*(assert) {
  const filename = "testfile";
  yield Storage.asyncSaveFile(filename, FILE_CONTENT);
  let fileContent = yield Storage.asyncGetFile(filename);
  assert.equal(fileContent, FILE_CONTENT);
  yield Storage.asyncRemoveFile(filename);
};

exports["test reading from an inexistent file gets rejected"] = function*(assert) {
  const file = yield Storage.asyncGetFile("no-file-here");
  assert.equal(file, null, "Returned null for an inexistent file");
};

exports["test saving to existing file overwrites"] = function*(assert) {
  const filename = "testfile";
  yield Storage.asyncSaveFile(filename, FILE_CONTENT);
  let fileContent = yield Storage.asyncGetFile(filename);
  assert.equal(fileContent, FILE_CONTENT);

  yield Storage.asyncSaveFile(filename, FILE_CONTENT.toUpperCase());
  let uppercaseFileContent = yield Storage.asyncGetFile(filename);
  assert.equal(uppercaseFileContent, FILE_CONTENT.toUpperCase());
  assert.notEqual(uppercaseFileContent, fileContent);
  yield Storage.asyncRemoveFile(filename);
};

exports["test if file exists on system"] = function*(assert) {
  const filename = "testfile";
  yield Storage.asyncSaveFile(filename, FILE_CONTENT);

  let fileExists = yield Storage.asyncFileExists(filename);
  assert.ok(fileExists, "The file exists");
  fileExists = yield Storage.asyncFileExists("not a file name");
  assert.ok(!fileExists, "The file does not exists");
};

before(exports, function*() {
  STORAGE = Storage.instance();
  yield STORAGE.asyncCreateTables();
});

after(exports, function*() {
  yield STORAGE.asyncDropTables();
  yield STORAGE.asyncCloseConnection();
});

require("sdk/test").run(exports);

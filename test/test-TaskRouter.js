/* globals PromiseUtils */
"use strict";

const {before, after} = require("sdk/test/utils");
const {cleanUpFolder} = require("test/lib/utils");
const {Cu} = require("chrome");
const {DeferProcessor} = require("test/resources/DeferProcessor");
const {Page} = require("addon/task-queue/Page");
const {Storage} = require("addon/task-queue/Storage");
const {TaskRouter} = require("addon/task-queue/TaskRouter");
const {WorkerTask} = require("addon/task-queue/WorkerTask");

Cu.import("resource://gre/modules/PromiseUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");

let STORAGE = Storage.instance();

exports["test TaskRouter needs a map parameter"] = function(assert) {
  assert.throws(() => new TaskRouter(null), /TaskRouter needs a map as argument/, "Can't construct without arguments.");
};

exports["test if url needs processing"] = function*(assert) {
  const url = "http://foo.bar";
  const expiredPageArgs = {
    url,
    maxAge: 1,
    createdAt: 1000
  };
  const tr = new TaskRouter(new Map());

  let needsProcessing = yield tr.asyncNeedProcessing("http://foo.bar");
  assert.equal(needsProcessing, true, "New url does need processing");

  // Create page for url
  let page = new Page({url});
  yield page.save();
  needsProcessing = yield tr.asyncNeedProcessing(url);
  assert.equal(needsProcessing, false, "Page already exists and is valid");

  // Creates an expired page
  page = new Page(expiredPageArgs);
  yield page.save();
  needsProcessing = yield tr.asyncNeedProcessing(url);
  assert.equal(needsProcessing, false, "Page expired, but file does not exist");

  // Create a file for the page
  yield Storage.asyncSaveFile(page.url, "<html></html>");
  needsProcessing = yield tr.asyncNeedProcessing(url);
  assert.equal(needsProcessing, true, "Expired page with file, should process");

  // Create a task for the page
  let task = new WorkerTask(url, "test task");
  yield task.save();
  needsProcessing = yield tr.asyncNeedProcessing(url);
  assert.equal(needsProcessing, false, "Page has task, no processing needed");
};

exports["test sends one message and wait for results"] = function*(assert) {
  const message = {
    type: "test1",
    data: {
      url: "http://foo.bar",
      data: "<html></html>"
    }
  };

  // Initialize the database
  const deferred = PromiseUtils.defer();
  const tp = new DeferProcessor(deferred);

  const routeMap = new Map();
  routeMap.set("test1", [tp]);
  const router = new TaskRouter(routeMap);
  router.handleMessage(message);

  let deferredWorkers = yield deferred.promise;
  assert.equal(deferredWorkers, "1", "Worker returned");
};

exports["test sends multiple messages"] = function*(assert) {
  const messages = [{
    type: "test1",
    data: {
      url: "http://foo.bar",
      data: "<html>1</html>"
    }
  },
    {
      type: "test1",
      data: {
        url: "http://bar.foo",
        data: "<html>2</html>"
      }
    },
    {
      type: "test1",
      data: {
        url: "http://bar.foo", // Duplicate url, should not be processed
        data: "<html>3</html>"
      }
    },
    {
      type: "test2",
      data: {
        url: "http://example.com",
        data: "<html>4</html>"
      }
    },
    {
      type: "test2",
      data: {
        url: "http://example.org",
        data: "<html>5</html>"
      }
    }
  ];
  const deferredTp1 = PromiseUtils.defer();
  const deferredTp2 = PromiseUtils.defer();
  const tp1 = new DeferProcessor(deferredTp1, 2);
  const tp2 = new DeferProcessor(deferredTp2, 2);

  const routeMap = new Map();
  routeMap.set("test1", [tp1]);
  routeMap.set("test2", [tp2]);
  const router = new TaskRouter(routeMap);
  for (let message of messages) {
    router.handleMessage(message);
  }

  const dataTp1 = yield deferredTp1.promise;
  assert.equal(dataTp1, "2", "Task processor 1 returned 2 worker");
  const dataTp2 = yield deferredTp2.promise;
  assert.equal(dataTp2, "2", "Task processor 2 returned 2 workers");
};

exports["test one message type, multiple processors"] = function*(assert) {
  const messages = [{
    type: "test1",
    data: {
      url: "http://foo.bar",
      data: "<html>1</html>"
    }
  },
    {
      type: "test1",
      data: {
        url: "http://bar.foo",
        data: "<html>2</html>"
      }
    }
  ];

  const deferredTp1 = PromiseUtils.defer();
  const deferredTp2 = PromiseUtils.defer();
  const tp1 = new DeferProcessor(deferredTp1, 2);
  const tp2 = new DeferProcessor(deferredTp2, 2);

  const routeMap = new Map();
  routeMap.set("test1", [tp1, tp2]);
  const router = new TaskRouter(routeMap);
  for (let message of messages) {
    router.handleMessage(message);
  }

  const dataTp1 = yield deferredTp1.promise;
  assert.equal(dataTp1, "2", "Task processor 1 returned 2 worker");
  const dataTp2 = yield deferredTp2.promise;
  assert.equal(dataTp2, "2", "Task processor 2 returned 2 workers");
};

before(exports, function*() {
  STORAGE = Storage.instance();
  yield STORAGE.asyncCreateTables();
});

after(exports, function*() {
  yield cleanUpFolder("taskqueue");
  yield STORAGE.asyncDropTables();
  yield STORAGE.asyncCloseConnection();
});

require("sdk/test").run(exports);

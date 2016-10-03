/* globals Services */

"use strict";

const {TaskProcessor} = require("addon/task-queue/TaskProcessor");
const {Cu} = require("chrome");
const {getResourceURL} = require("addon/task-queue/utils");
Cu.import("resource://gre/modules/Services.jsm");

exports["test enqueue"] = function*(assert) {
  let workerURL = getResourceURL("test/resources/echo-worker.js");
  let tp = new TaskProcessor(workerURL, 1);
  tp.handleResults = data => {
    assert.equal(0, tp.numFreeWorkers, "there are no free workers");
    assert.equal(1, data.id, "expected ID matches up");
  };
  assert.equal(1, tp.numFreeWorkers, "there is an initial free worker");
  yield tp.enqueue({id: 1});
};

exports["test delay"] = function*(assert) {
  // delay-worker is set to wait 12 ms before responding
  let workerURL = getResourceURL("test/resources/delay-worker.js");
  // with a delay of 5 ms, and one worker, at least half of the jobs will be delayed
  let tp = new TaskProcessor(workerURL, 1, 5);
  let count = 0;
  let numTasks = 10;
  tp.handleResults = data => {
    count += 1;
    if (count === numTasks) {
      assert.equal(count, numTasks, "handleResults called an expected number of times");
    }
  };

  let delayPromise = new Promise(resolve => {
    let delayedCount = 0;
    let notif = "taskprocessor-worker-delayed";
    let observer = (subject, topic, data) => {
      if (topic === notif) {
        delayedCount += 1;
      }
      if (delayedCount === numTasks / 2) {
        assert.ok(true, "At least half of the enqueue requests have been delayed");
        Services.obs.removeObserver(observer, notif);
        resolve();
      }
    };
    Services.obs.addObserver(observer, notif, false);
  });

  let promises = [];
  for (let num of Array(numTasks).keys()) {
    promises.push(tp.enqueue({id: num + 1}));
  }
  yield Promise.all(promises);
  yield delayPromise;
};

exports["test concurrency"] = function*(assert) {
  // delay-worker is set to wait 12 ms before responding
  let workerURL = getResourceURL("test/resources/delay-worker.js");
  // with 2 workers, we should have zero free workers by the time the second worker starts
  let numTasks = 10;
  let numWorkers = 5;
  let tp = new TaskProcessor(workerURL, numWorkers, 5);
  tp.handleResults = data => {};

  let freeNumbers = new Set();
  let countPromise = new Promise(resolve => {
    let startCount = 0;
    let notif = "taskprocessor-worker-started";
    let observer = (subject, topic, data) => {
      if (topic === notif) {
        startCount += 1;
        freeNumbers.add(tp.numFreeWorkers);
      }
      if (startCount === numTasks) {
        Services.obs.removeObserver(observer, notif);
        resolve();
      }
    };
    Services.obs.addObserver(observer, notif, false);
  });

  let promises = [];
  for (let num of Array(numTasks).keys()) {
    promises.push(tp.enqueue({id: num + 1}));
  }
  yield Promise.all(promises);
  yield countPromise;

  // should have from `0` to `numWorkers - 1`. TP can't have `numWorkers` free workers
  // because the notification is sent when a job has already been assigned
  for (let num of Array(numWorkers).keys()) {
    assert.ok(freeNumbers.has(num), `TaskProcessor had ${num} free worker(s) at some point`);
  }
};

exports["test handleResults required"] = function*(assert) {
  let workerURL = getResourceURL("test/resources/echo-worker.js");
  let tp = new TaskProcessor(workerURL, 1);
  let errored = false;
  try {
    yield tp.enqueue({id: 1});
  } catch (e) {
    errored = true;
    assert.equal(e.message, "function not implemented", "expect a not-implemented error");
  }
  assert.ok(errored, "enqueue promise fails if handleResults is not implemented");
};

exports["test handleResults exceptions are handled"] = function*(assert) {
  let workerURL = getResourceURL("test/resources/echo-worker.js");
  let tp = new TaskProcessor(workerURL, 1);
  tp.handleResults = data => {throw new Error("foo");};
  let errored = false;
  try {
    yield tp.enqueue({id: 1});
  } catch (e) {
    errored = true;
    assert.equal(e.message, "foo", "expect handler exception");
  }
  assert.ok(errored, "enqueue promise fails if handleResults fails");
};

exports["test handleResults can return promises"] = function*(assert) {
  let expectedValue = 5;
  let workerURL = getResourceURL("test/resources/echo-worker.js");
  let tp = new TaskProcessor(workerURL, 1);
  tp.handleResults = data => new Promise(resolve => {
    resolve(expectedValue);
  });
  let value = yield tp.enqueue({id: 1});
  assert.equal(value, expectedValue, "handleResults can return promises");
};

exports["test results error handling"] = function*(assert) {
  // the error-worker throws an exception on every odd number of invocations
  let workerURL = getResourceURL("test/resources/error-worker.js");
  let tp = new TaskProcessor(workerURL, 1);
  tp.handleResults = data => {};

  let errored = false;
  try {
    yield tp.enqueue({id: 1});
  } catch (e) {
    errored = true;
    assert.equal(e.message, "Error: i like being fussy", "the worker exception is thrown");
  }
  assert.ok(errored, "an error is thrown if a worker errors");

  yield tp.enqueue({id: 2});
  assert.ok(errored, "the worker still works after an error");
};

require("sdk/test").run(exports);

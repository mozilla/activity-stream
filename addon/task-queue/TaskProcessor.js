/* globals Services, PromiseUtils */
"use strict";
const {LIFOQueue} = require("addon/task-queue/Queue");
const {Cu, Cc, Ci, ChromeWorker} = require("chrome");
const {setTimeout, clearTimeout} = require("sdk/timers");
const {generateUUID} = Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator);

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/PromiseUtils.jsm");

class TaskProcessor {

  /**
   * A generic Task Processor whose purpose is to managed workers
   *
   * @param {String}    workerScriptURL
   *                    URL of script to start workers with. This needs to be a resouce URL (required)
   * @param {Integer}   numWorkers
   *                    Number of workers to spawn (default: 5)
   * @param {Integer}   timeoutDelay
   *                    Amount of time in milliseconds to wait until retrying when jobs are queued up (default: 50)
   */
  constructor(workerScriptURL, numWorkers = 5, timeoutDelay = 50) {
    this._numWorkers = numWorkers;
    this._workerScriptURL = workerScriptURL;
    this._queue = new LIFOQueue();
    this._workers = new Set();
    this._freeWorkers = new Set();
    this._taskDeferredMap = new Map();
    this._workerTaskMap = new Map();
    this._createWorkers();
    this._distributeTaskTimeout = null;
    this._timeoutDelay = timeoutDelay;
    this._taskType = "default";
  }

  /**
   * A callback invoked when workers emit messages
   *
   * @param {Event}     evt
   *                    An Event object
   */
  handleEvent(evt) {
    let taskId = this._workerTaskMap.get(evt.target);
    let deferred = this._taskDeferredMap.get(taskId);
    try {
      switch (evt.type) {
        case "message":
          if (evt.data && evt.data.name === "result") {
            let result = this.handleResults(evt.data.payload);
            deferred.resolve(result);
          }
          break;
        case "error":
          deferred.reject(evt);
          break;
      }
    } catch (e) {
      deferred.reject(e);
    }
    this._workerTaskMap.delete(evt.target);
    this._taskDeferredMap.delete(taskId);
    this._freeWorkers.add(evt.target);
  }

  /**
   * Returns the type of this processor workers
   */
  get taskType() {
    return this._taskType;
  }

  /**
   * Returns the size of the worker pool
   */
  get numWorkers() {
    return this._workers.size;
  }

  /**
   * Returns the number of free workers
   */
  get numFreeWorkers() {
    return this._freeWorkers.size;
  }

  /**
   * Add an object to the queue to be processed by a background worker
   *
   * @param {Object}    task
   *                    An object whose value will be given to a worker
   * @returns {Promise}
   *                    Returns a promise object that resolves when the job
   *                    is complete
   */
  enqueue(task) {
    if (!task.id) {
      // generates an ID if not present
      task.id = generateUUID().toString();
    }

    if (this._taskDeferredMap.has(task.id)) {
      return this._taskDeferredMap.get(task.id).promise;
    }

    let deferred = PromiseUtils.defer();
    this._taskDeferredMap.set(task.id, deferred);
    this._queue.enqueue(task);
    this._distributeTask();

    return deferred.promise;
  }

  /**
   * A results handler that needs to be implemented.
   */
  handleResults(data) {
    throw new Error("function not implemented");
  }

  /**
   * Initializes workers with a given script
   */
  _createWorkers() {
    for (let _ of Array(this._numWorkers).keys()) { // eslint-disable-line no-unused-vars
      let worker = new ChromeWorker(this._workerScriptURL);
      worker.addEventListener("message", this, false);
      worker.addEventListener("error", this, false);
      this._workers.add(worker);
      this._freeWorkers.add(worker);
    }
  }

  /**
   * Ensures jobs on a queue will be distributed to workers. This will run periodically until
   * all jobs are completed.
   */
  _distributeTask() {
    if (this._distributeTaskTimeout === null) {
      if (this._queue.size > 0 && this._freeWorkers.size > 0) {
        let worker = this._freeWorkers.values().next().value;
        let payload = this._queue.dequeue();

        // remove from free worker pool
        this._freeWorkers.delete(worker);

        worker.postMessage({
          command: "start",
          payload
        });

        // keep track of the worker/task relationship
        this._workerTaskMap.set(worker, payload.id);

        Services.obs.notifyObservers(null, "taskprocessor-worker-started", this._workerScriptURL);
      }

      if (this._queue.size > 0) {
        this._distributeTaskTimeout = setTimeout(() => {
          this._distributeTaskTimeout = null;
          this._distributeTask();
        }, this._timeoutDelay);
        Services.obs.notifyObservers(null, "taskprocessor-worker-delayed", null);
      }
    }
  }

  /**
   * Uninitializes the processor
   */
  uninit() {
    if (this._distributeTaskTimeout) {
      clearTimeout(this._distributeTaskTimeout);
      this._distributeTaskTimeout = null;
    }
    for (let workerSet of [this._freeWorkers, this._workers]) {
      for (let worker of workerSet) {
        worker.terminate();
        workerSet.delete(worker);
      }
    }
    this._workerTaskMap.clear();
    this._taskDeferredMap.clear();
  }
}

exports.TaskProcessor = TaskProcessor;

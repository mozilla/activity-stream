/* globals Task */
"use strict";

const {Cu} = require("chrome");
const {Page} = require("addon/task-queue/Page");
const {Storage} = require("addon/task-queue/Storage");
const {WorkerTask} = require("addon/task-queue/WorkerTask");
const {normalizeUrl} = require("addon/task-queue/utils");

Cu.import("resource://gre/modules/Task.jsm");

// The lock for page and task creation test-and-set
let taskCreationLock = false;
// The queue for messages waiting to be processed
const mutexQueue = [];

class TaskRouter {

  /**
   * Creates a new task router from a map of messages to TaskProcessor arrays
   *
   * @param {Map<string, TaskProcessor[]>} processorMap
   *                                       A map of Task Processors arrays for each message
   */
  constructor(processorMap) {
    if (!processorMap) {
      throw new Error("TaskRouter needs a map as argument.");
    }
    // Initialize task processors
    this.routes = processorMap;
  }

  /**
   * Check if the page should be processed by the queue
   *
   * @param {String}    url
   *                    The URL of the page we want to check
   * @returns {Promise}
   *                    Returns true if the page should be processed, false otherwise
   */
  asyncNeedProcessing(url) {
    return Task.spawn(function*() {
      // Do we have a valid url?
      if (!url) {
        return false;
      }

      // Do we already have a task for this url?
      const taskExists = yield WorkerTask.asyncURLExists(url);
      if (taskExists) {
        return false;
      }

      // Do we already have a page for this url?
      const pageExpiration = yield Page.asyncGetExpiration(url);
      if (pageExpiration === null) {
        return true;
      }

      // Is the page still valid?
      if (pageExpiration > Date.now()) {
        return false;
      }

      // Do we have a DOM file for this page?
      const file = yield Storage.asyncFileExists(url);
      if (!file) {
        return false;
      }

      return true;
    });
  }

  /**
   * Create the worker tasks for a given message
   *
   * @param {Object} message
   *                 The message we want to create the tasks for
   */
  asyncCreateTasks(message) {
    return Task.spawn((function*() {
      // If someone is already working on the critic section, wait to be executed later
      if (taskCreationLock) {
        mutexQueue.push(message);
        return;
      }

      taskCreationLock = true;

      // Normalize the url and keep the reference part if it's canonical
      message.data.url = normalizeUrl(message.data.url, message.data.urlIsCanonical);

      const needsProcessing = yield this.asyncNeedProcessing(message.data.url);
      if (needsProcessing) {
        const page = new Page({url: message.data.url});
        yield page.save();

        // Writes the DOM string to the file system
        yield Storage.asyncSaveFile(page.url, message.data.data);

        // Create tasks and enqueue them
        const promises = this.routes.get(message.type).map(processor => {
          const task = new WorkerTask(message.data.url, processor.taskType);
          return task.save().then(() => processor.enqueue(task));
        });

        // Wait for every task to be created
        yield Promise.all(promises);
      }

      // Free the lock and call any waiting function
      taskCreationLock = false;
      if (mutexQueue.length) {
        this.asyncCreateTasks(mutexQueue.pop());
      }
    }).bind(this));
  }

  /**
   * Message handling and routing
   *
   * @param {Object} message
   *                 A message to be routed
   *                 - type: {String} the message type
   *                 - data {Object}
   *                   - url: {String} the page url
   *                   - data: {String} the page DOM content
   */
  handleMessage(message) {
    if (!message.type) {
      throw new Error("Worker queue messages should contain a type.");
    }

    if (!this.routes.has(message.type)) {
      throw new Error(`No route defined for message of type: ${message.type}`);
    }

    this.asyncCreateTasks(message);
  }
}

exports.TaskRouter = TaskRouter;

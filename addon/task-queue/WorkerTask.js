/* globals Task */
"use strict";

const {Storage} = require("addon/task-queue/Storage.js");
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Task.jsm");

const TASK_NEW = "new";
const TASK_WORKING = "working";
const TASK_DONE = "done";
const TASK_STATUS = [TASK_NEW, TASK_WORKING, TASK_DONE];

class WorkerTask {

  /**
   * A generic task to be executed by workers
   *
   * @param {String}  pageUrl
   *                  URL of the page the task will work with
   * @param {String}  type
   *                  The type of worker this task relates to
   * @param {Integer} createdAt
   *                  The task creation date (Default: now)
   */
  constructor(pageUrl, type, createdAt = Date.now()) {
    this.id = null;
    this.pageUrl = pageUrl;
    this.createdAt = createdAt;
    this.jobStartedAt = null;
    this._status = "new";
    this.type = type;
  }

  /**
   * Validates and sets the task status
   *
   * @param {String} newStatus
   *                 The new task status
   */
  set status(newStatus) {
    if (TASK_STATUS.indexOf(newStatus) === -1) {
      throw new Error("Invalid task status.");
    }
    this._status = newStatus;
  }

  /**
   * A getter for the task status
   *
   * @returns {String}
   *                   Returns the task status
   */
  get status() {
    return this._status;
  }

  /**
   * Sets this task as a started job
   */
  jobStarted() {
    this.jobStartedAt = Date.now();
    this._status = TASK_WORKING;
  }

  /**
   * Saves the current task
   *
   * @returns {Promise}
   *                    Returns a promise that resolves when the task is saved
   */
  save() {
    return WorkerTask.asyncSave(this);
  }

  /**
   * Used by JSON.stringify to serialize the Task object
   *
   * @return {Object}
   *                  Returns the serializable task
   */
  toJSON() {
    return {
      id: this.id,
      pageUrl: this.pageUrl,
      createdAt: this.createdAt,
      jobStartedAt: this.jobStartedAt,
      status: this._status,
      type: this.type
    };
  }

  /**
   * Creates a new task from an Object
   *
   * @param {Object} obj
   *                 The object containing the task attributes values
   */
  static fromObject(obj) {
    let task = new WorkerTask(obj.pageUrl, obj.type, obj.createdAt);
    Object.assign(task, {
      id: obj.id,
      jobStartedAt: obj.jobStartedAt,
      _status: obj.status
    });
    return task;
  }

  /**
   * A static method to save a task
   *
   * @param {Task}      task
   *                    The task to save
   * @returns {Promise}
   *                    Returns a promise that resolves when the task is saved
   */
  static asyncSave(task) {
    // SQL to insert a new task
    const insertSQL = `INSERT INTO moz_tasks (pageUrl, createdAt, jobStartedAt, status, type)
                       VALUES (:pageUrl, :createdAt, :jobStartedAt, :status, :type);`;
    // SQL to update an existing task
    const updateSQL = `UPDATE moz_tasks SET pageUrl = :pageUrl, createdAt = :createdAt,
                       jobStartedAt = :jobStartedAt, status = :status, type = :type WHERE id = :id`;
    // SQL to select the id of the inserted task
    const idSelectSQL = "select last_insert_rowid() FROM moz_tasks";
    // Query parameters
    let params = {
      pageUrl: task.pageUrl,
      createdAt: task.createdAt,
      jobStartedAt: task.jobStartedAt,
      status: task.status,
      type: task.type
    };

    let sql = insertSQL;

    // If the task id is set, it's an existing task, so we want to update it.
    if (task.id) {
      sql = updateSQL;
      params.id = task.id;
    }
    // Starts a transaction to execute the SQL query and returns a promise.
    const storage = Storage.instance();
    return storage.asyncExecuteTransaction(function*() {
      yield storage.asyncExecuteCached("Saving task", sql, {params});
      // If the task is new and doesn't have an id we want to recover the auto-incremented id value from the database.
      if (!task.id) {
        yield storage.asyncExecuteCached("Recovering task id", idSelectSQL, {
          callback: row => {
            task.id = row.getResultByName("last_insert_rowid()");
          }
        });
      }
    });
  }

  /**
   * Get a task from the database by it's id
   *
   * @param {String}   id
   *                   The id of the task we want to get
   * @return {Promise}
   *                   Returns a promise that resolves to the found task, or null otherwise.
   */
  static asyncGetById(id) {
    const SQL = "SELECT id, pageUrl, createdAt, jobStartedAt, status, type FROM moz_tasks WHERE id = :id;";
    const columns = ["id", "pageUrl", "createdAt", "jobStartedAt", "status", "type"];
    const params = {id};

    let storage = Storage.instance();
    return Task.spawn(function*() {
      let tasks = yield storage.asyncExecuteCached(`Selecting task with id ${id}`, SQL, {columns, params});
      // If no task was found, return null
      if (!tasks.length) {
        return null;
      }
      let dbTask = tasks.pop();
      // Create a new task from the database result
      let task = new WorkerTask(dbTask.pageUrl, dbTask.type, dbTask.createdAt);
      Object.assign(task, {
        id: dbTask.id,
        jobStartedAt: dbTask.jobStartedAt,
        _status: dbTask.status
      });
      return task;
    });
  }

  /**
   * Get tasks from the database by url
   *
   * @param {String}   pageUrl
   *                   The url of the tasks we want to get
   * @return {Promise}
   *                   Returns a promise that resolves to the found tasks, or null otherwise.
   */
  static asyncGetByUrl(pageUrl) {
    const SQL = "SELECT id, pageUrl, createdAt, jobStartedAt, status, type FROM moz_tasks WHERE pageUrl = :pageUrl;";
    const columns = ["id", "pageUrl", "createdAt", "jobStartedAt", "status", "type"];
    const params = {pageUrl};

    let storage = Storage.instance();
    return Task.spawn(function*() {
      let taskRows = yield storage.asyncExecuteCached(`Selecting tasks with url ${pageUrl}`, SQL, {columns, params});

      // If no task was found, return null
      if (!taskRows.length) {
        return null;
      }

      return taskRows.map(dbTask => {
        let newTask = new WorkerTask(dbTask.pageUrl, dbTask.type, dbTask.createdAt);
        Object.assign(newTask, {
          id: dbTask.id,
          jobStartedAt: dbTask.jobStartedAt,
          _status: dbTask.status
        });
        return newTask;
      });
    });
  }

  /**
   * Verify if at least one task exists for a url
   *
   * @param {String}   pageUrl
   *                   The url of the tasks we want to get
   * @return {Promise}
   *                   Returns a promise that resolves to the found tasks, or null otherwise.
   */
  static asyncURLExists(pageUrl) {
    const SQL = "SELECT 1 FROM moz_tasks WHERE pageUrl = :pageUrl;";
    const params = {pageUrl};

    const storage = Storage.instance();
    return storage.asyncExecuteCached(`Checking existance of tasks with url ${pageUrl}`, SQL, {params})
                  .then(rows => rows.length);
  }
}

exports.WorkerTask = WorkerTask;
exports.TASK_DONE = TASK_DONE;
exports.TASK_WORKING = TASK_WORKING;
exports.TASK_NEW = TASK_NEW;

/* globals XPCOMUtils, Sqlite, Task */
"use strict";

const {Cu} = require("chrome");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.importGlobalProperties(["crypto"]);

const {TextDecoder, TextEncoder, OS} = Cu.import("resource://gre/modules/osfile.jsm", {});

XPCOMUtils.defineLazyModuleGetter(this, "Sqlite",
                                  "resource://gre/modules/Sqlite.jsm");
const DB_PATH = "taskqueue.sqlite";
const DB_CONFIG_QUERIES = [
  "PRAGMA journal_mode = WAL;",
  "PRAGMA foreign_keys = ON;",
  "PRAGMA wal_autocheckpoint = 16;",
  "PRAGMA journal_size_limit = 1536;"
];

// SQL for creating the moz_pages table
const CREATE_PAGES_TABLE = `CREATE TABLE IF NOT EXISTS moz_pages (
  url LONGVARCHAR PRIMARY KEY,
  maxAge INTEGER,
  createdAt DATE,
  remote BOOLEAN DEFAULT 0 NOT NULL CHECK (remote IN (0,1))
);`;

// SQL for droping the moz_pages table
const DROP_PAGES_TABLE = "DROP TABLE moz_pages;";

// SQL for creating the moz_tasks table
const CREATE_TASKS_TABLE = `CREATE TABLE IF NOT EXISTS moz_tasks (
  id INTEGER PRIMARY KEY ASC,
  pageUrl LONGVARCHAR,
  createdAt INTEGER,
  jobStartedAt INTEGER,
  status LONGVARCHAR,
  type LONGVARCHAR
);`;

// SQL for droping the moz_tasks table
const DROP_TASKS_TABLE = "DROP TABLE moz_tasks;";

const CREATE_INDEXES = [
  "CREATE INDEX taskUrl ON moz_tasks (pageUrl);",
  "CREATE INDEX taskStatus ON moz_tasks (status)"
];
const DROP_TASKS_INDEX = "DROP INDEX taskUrl";

let INSTANCE = null;

/**
 * Handles database and filesystem storage needs for the task queue
 */
class Storage {

  /**
   * Get the singleton instance of the Storage class
   *
   * @returns {Storage}
   *                    The singleton instance of Storage
   */
  static instance() {
    if (!INSTANCE) {
      INSTANCE = new Storage();
    }
    return INSTANCE;
  }

  /**
   * Creates the database tables for the job infrastructure
   */
  asyncCreateTables() {
    return Task.spawn((function*() {
      for (let config of DB_CONFIG_QUERIES) {
        yield this._asyncGetConnection().then(db => db.execute(config));
      }
      yield this._asyncGetConnection().then(db => db.execute(CREATE_PAGES_TABLE));
      yield this._asyncGetConnection().then(db => db.execute(CREATE_TASKS_TABLE));
      for (let index of CREATE_INDEXES) {
        yield this._asyncGetConnection().then(db => db.execute(index));
      }
    }).bind(this));
  }

  /**
   * Removes the database tables used for the job infrastructure
   */
  asyncDropTables() {
    return Task.spawn((function*() {
      yield this._asyncGetConnection().then(db => db.execute(DROP_PAGES_TABLE));
      yield this._asyncGetConnection().then(db => db.execute(DROP_TASKS_INDEX));
      yield this._asyncGetConnection().then(db => db.execute(DROP_TASKS_TABLE));
    }).bind(this));
  }

  /**
   * Close the connection to the database
   */
  asyncCloseConnection() {
    return Task.spawn((function*() {
      yield this._conn.close();
      this._conn = null;
    }).bind(this));
  }

  /**
   * Executes a SQL query in the database.
   *
   * @param {string} name
   *                 an human readable name for the request
   * @param {string} sql
   *                 the SQL query to execute
   * @param {Object} options
   *                 options to pass to the execution:
   *                   - columns: name of the columns if you want a list of objects returned.
   *                   - params: the sql statement parameters as an object.
   *                   - callback: a callback function to manually handle.
   */
  asyncExecuteCached(name, sql, options = {}) {
    let {columns, params, callback} = options;
    let items = [];

    return this._asyncGetConnection().then(db => db.executeBeforeShutdown(name, Task.async(function*(db) {
      yield db.executeCached(sql, params, aRow => {
        try {
          // check if caller wants to handle query raws
          if (callback) {
            callback(aRow);
          }
          // otherwise fill in the item and add items array
          else {
            let item = null;
            // if columns array is given construct an object
            if (columns && Array.isArray(columns)) {
              item = {};
              columns.forEach(column => {
                item[column] = aRow.getResultByName(column);
              });
            } else {
              // if no columns - make an array of raw values
              item = [];
              for (let i = 0; i < aRow.numEntries; i++) {
                item.push(aRow.getResultByIndex(i));
              }
            }
            items.push(item);
          }
        } catch (e) {
          throw new Error(e);
        }
      });
      return items;
    })));
  }

  /**
   * Perform a transaction in the current connection.
   *
   * @param {Function} func
   *                   What to perform as part of the transaction.
   *
   * @returns {Promise}
   *                   Returns promise that resolves when the transaction is finished.
   */
  asyncExecuteTransaction(func) {
    return Task.spawn((function*() {
      yield this._asyncGetConnection().then(db => db.executeTransaction(func));
    }).bind(this));
  }

  /**
   * Get a connection to the database and keep it.
   *
   * @return {Promise}
   *                   Returns a promise that resolves to the opened connection.
   */
  _asyncGetConnection() {
    return Task.spawn((function*() {
      if (!this._conn) {
        this._conn = yield Sqlite.openConnection({path: DB_PATH});
      }
      return this._conn;
    }).bind(this));
  }

  /**
   * Get a file from the filesystem
   *
   * @param {String} url
   *                 The url of the file we want to get
   *
   * @returns {Promise}
   *                 Returns a promise that resolves to the file content
   */
  static asyncGetFile(url) {
    return Task.spawn(function*() {
      const filename = yield Storage._asyncSha1(url);
      const path = OS.Path.join(OS.Constants.Path.profileDir, "taskqueue", filename);
      try {
        const contentArray = yield OS.File.read(path);
        return new TextDecoder().decode(contentArray);
      } catch (e) {
        // File does not exist or can't be read
        return null;
      }
    });
  }

  /**
   * Saves a file to the filesystem
   *
   * @param {String} url
   *                 The url of the file we want to save
   * @param {String} content
   *                 The file content
   * @returns {Promise}
   *                 Returns a promise that resolves when the file is saved
   */
  static asyncSaveFile(url, content) {
    return Task.spawn(function*() {
      const filename = yield Storage._asyncSha1(url);
      const path = OS.Path.join(OS.Constants.Path.profileDir, "taskqueue", filename);
      yield OS.File.makeDir(OS.Path.join(OS.Constants.Path.profileDir, "taskqueue"), {
        ignoreExisting: true,
        from: OS.Constants.Path.profileDir
      });

      const array = new TextEncoder().encode(content);
      return yield OS.File.writeAtomic(path, array,
          {tmpPath: OS.Path.join(OS.Constants.Path.profileDir, "taskqueue", `${filename}.tmp`)});
    });
  }

  /**
   * Removes a file from the filesystem
   *
   * @param {String} url
   *                 The url of the file we want to remove
   *
   * @returns {Promise}
   *                 Returns a promise that resolves when the file is removed
   */
  static asyncRemoveFile(url) {
    return Task.spawn(function*() {
      const filename = yield Storage._asyncSha1(url);
      const path = OS.Path.join(OS.Constants.Path.profileDir, "taskqueue", filename);
      return yield OS.File.remove(path, {ignoreAbsent: true});
    });
  }

  /**
   * Checks if a file exist and returns a boolean
   *
   * @param {String} url
   *                 The url of the file we want to check
   *
   * @returns {Promise}
   *                 Returns a promise that resolves to true if the file exists
   */
  static asyncFileExists(url) {
    return Task.spawn(function*() {
      const filename = yield Storage._asyncSha1(url);
      const path = OS.Path.join(OS.Constants.Path.profileDir, "taskqueue", filename);
      return yield OS.File.exists(path);
    });
  }

  /**
   * Digests a string into a SHA-1 hash
   *
   * @param {String} str
   *                 The string to be digested
   *
   * @returns {Promise}
   *                   Returns a promise that resolves to a string
   *                   representing the hex digest of the original string.
   */
  static _asyncSha1(str) {
    // Converts the digested byteArray to it's string hex representation
    function hex(buffer) {
      const padding = "00000000";
      const hexCodes = [];
      const view = new DataView(buffer);

      for (let i = 0; i < view.byteLength; i += 4) {
        const value = view.getUint32(i).toString(16);
        const paddedValue = String(padding + value).slice(-padding.length);
        hexCodes.push(paddedValue);
      }
      return hexCodes.join("");
    }

    const buffer = new TextEncoder("utf-8").encode(str);
    return crypto.subtle.digest("SHA-1", buffer).then(hash => hex(hash));
  }
}

exports.Storage = Storage;

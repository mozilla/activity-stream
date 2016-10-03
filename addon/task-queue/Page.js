/* globals Task */
"use strict";

const {Cu} = require("chrome");
const {Storage} = require("addon/task-queue/Storage.js");

Cu.import("resource://gre/modules/Task.jsm");

const DEFAULT_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // one week

class Page {

  /**
   * A page to be processed by the worker queue
   *
   * @param {String}  url
   *                  the page URL
   * @param {Integer} [maxAge]
   *                  The page max age (Default: DEFAULT_MAX_AGE)
   * @param {Boolean} [remote]
   *                  If the page was captured by navigating to it or by a remote process  (Default: false)
   * @param {Integer} [createdAt]
   *                  The page entry creation date (Default: now)
   */
  constructor({url, maxAge, remote, createdAt}) {
    if (!url) {
      throw (new TypeError("URL must be defined"));
    }
    this.url = url;
    this.maxAge = maxAge || DEFAULT_MAX_AGE;
    this.remote = Boolean(remote);
    this.createdAt = createdAt || Date.now();
  }

  /**
   * Gets the expiration date for the page cache
   *
   * @returns {Integer}
   *                    The page expiration date
   */
  get expiration() {
    return this.createdAt + this.maxAge;
  }

  /**
   * Saves the current page
   *
   * @returns {Promise}
   *                    Returns a promise that resolves when the page is saved
   */
  save() {
    return Page.asyncSave(this);
  }

  /**
   * Used by JSON.stringify to serialize the Page object
   *
   * @return {Object}
   *                  Returns the serializable page
   */
  toJSON() {
    return {
      url: this.url,
      maxAge: this.maxAge,
      remote: this.remote,
      createdAt: this.createdAt
    };
  }

  /**
   * A static method to save a page
   *
   * @param {Page}      page
   *                    The page to save
   * @returns {Promise}
   *                    Returns a promise that resolves when the page is saved
   */
  static asyncSave(page) {
    // SQL to insert a new page
    const replaceSQL = `INSERT OR REPLACE INTO moz_pages (url, maxAge, createdAt, remote)
                        VALUES (:url, :maxAge, :createdAt, :remote);`;

    // Query parameters
    let params = {
      url: page.url,
      createdAt: page.createdAt,
      maxAge: page.maxAge,
      remote: page.remote
    };

    // Spawns a task to execute the SQL query and returns a promise.
    return Task.spawn(function*() {
      let storage = Storage.instance();
      yield storage.asyncExecuteCached("Saving page", replaceSQL, {params});
    });
  }

  /**
   * Get a page from the database by it's url
   *
   * @param {String}   url
   *                   The url of the page we want to get
   * @return {Promise}
   *                   Returns a promise that resolves to the found page, or null otherwise.
   */
  static asyncGetByUrl(url) {
    const SQL = "SELECT url, maxAge, createdAt, remote FROM moz_pages WHERE url = :url;";
    const columns = ["url", "maxAge", "createdAt", "remote"];
    const params = {url};

    let storage = Storage.instance();
    return Task.spawn(function*() {
      let pages = yield storage.asyncExecuteCached(`Selecting page with url ${url}`, SQL, {columns, params});

      // If no page was found, return null
      if (!pages.length) {
        return null;
      }
      let dbPage = pages.pop();
      // Create a new page from the database result
      return new Page(dbPage);
    });
  }

  /**
   * Get the expiration timestamp for a page or null if it doesn't exist
   *
   * @param {String} url
   *                 The url of the page we want to get the expiration
   *
   * @returns {Promise}
   *                    Returns a promise that resolves to the expiration
   *                    timestamp or null if the page doesn't exist.
   */
  static asyncGetExpiration(url) {
    const SQL = "SELECT (IFNULL(createdAt,0) + IFNULL(maxAge,0)) as 'expiration' FROM moz_pages WHERE url = :url";
    const columns = ["expiration"];
    const params = {url};

    let storage = Storage.instance();
    return Task.spawn(function*() {
      let expirations = yield storage.asyncExecuteCached(`Selecting expiration for page with url ${url}`, SQL, {columns, params});

      // If no page was found, return null
      if (!expirations.length) {
        return null;
      }
      let expiration = expirations.pop();
      // Create a new page from the database result
      return expiration.expiration;
    });
  }
}

exports.Page = Page;
exports.DEFAULT_MAX_AGE = DEFAULT_MAX_AGE;

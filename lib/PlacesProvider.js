/* globals XPCOMUtils, Services, gPrincipal, EventEmitter, PlacesUtils, Task, Bookmarks */

"use strict";

const {Ci, Cu} = require("chrome");
const base64 = require("sdk/base64");
const simplePrefs = require("sdk/simple-prefs");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Bookmarks",
                                  "resource://gre/modules/Bookmarks.jsm");

XPCOMUtils.defineLazyGetter(this, "gPrincipal", () => {
  let uri = Services.io.newURI("about:newtab", null, null);
  return Services.scriptSecurityManager.getNoAppCodebasePrincipal(uri);
});

const {
  LINKS_QUERY_LIMIT,
  FRECENT_RESULTS_TIME_LIMIT,
  HIGHLIGHTS_THRESHOLDS
} = require("../common/constants");

const REV_HOST_BLACKLIST = [
  "moc.elgoog.www.",
  "ac.elgoog.www.",
  "moc.elgoog.radnelac.",
  "moc.elgoog.liam.",
  "moc.oohay.liam.",
  "moc.oohay.hcraes.",
  "tsohlacol.",
  "oc.t.",
  "."
].map(item => `'${item}'`);

const PREF_BLOCKED_URLS = "query.blockedURLs";

/**
 * Singleton that manages the list of blocked urls
 */
class BlockedURLs extends Set {

  constructor(prefName = PREF_BLOCKED_URLS) {
    let urls = [];
    try {
      urls = JSON.parse(simplePrefs.prefs[prefName]);
      if (typeof urls[Symbol.iterator] !== "function") {
        urls = [];
        simplePrefs.prefs[prefName] = "[]";
      }
    } catch (e) {
      Cu.reportError(e);
      simplePrefs.prefs[prefName] = "[]";
    }

    super(urls);

    this._prefName = prefName;
  }

  /**
   * Add url and persist to pref
   *
   * @param {String} url a url to block
   * @returns {Boolean} true if the item has been added
   */
  save(url) {
    if (!this.has(url)) {
      this.add(url);
      simplePrefs.prefs[this._prefName] = JSON.stringify(this.items());
      return true;
    }
    return false;
  }

  /**
   * Remove a url and persist to pref
   *
   * @param {String} url a url to unblock
   * @returns {Boolean} true if the item has been remove
   */
  remove(url) {
    if (this.has(url)) {
      this.delete(url);
      simplePrefs.prefs[this._prefName] = JSON.stringify(this.items());
      return true;
    }
    return false;
  }

  /**
   * Clear blocked url set and persist
   *
   * @returns {Boolean} whether or not blocklist was cleared
   */
  clear() {
    if (this.size !== 0) {
      simplePrefs.prefs[this._prefName] = "[]";
      super.clear();
      return true;
    }
    return false;
  }

  /**
   * Return url set as an array ordered by insertion time
   */
  items() {
    return [...this];
  }
}

/**
 * Singleton that checks if a given link should be displayed on about:newtab
 * or if we should rather not do it for security reasons. URIs that inherit
 * their caller's principal will be filtered.
 */
let LinkChecker = {
  _cache: new Map(),

  get flags() {
    return Ci.nsIScriptSecurityManager.DISALLOW_INHERIT_PRINCIPAL |
           Ci.nsIScriptSecurityManager.DONT_REPORT_ERRORS;
  },

  checkLoadURI: function LinkChecker_checkLoadURI(aURI) {
    if (!this._cache.has(aURI)) {
      this._cache.set(aURI, this._doCheckLoadURI(aURI));
    }

    return this._cache.get(aURI);
  },

  _doCheckLoadURI: function LinkChecker_doCheckLoadURI(aURI) {
    let result = false;
    // check for 'place:' protocol
    if (aURI.startsWith("place:")) {
      return false;
    }
    try {
      Services.scriptSecurityManager.checkLoadURIStrWithPrincipal(gPrincipal, aURI, this.flags);
      result = true;
    } catch (e) {
      // We got a weird URI or one that would inherit the caller's principal.
      Cu.reportError(e);
    }
    return result;
  }
};

/* Queries history to retrieve the most visited sites. Emits events when the
 * history changes.
 * Implements the EventEmitter interface.
 */
let Links = function Links() {
  EventEmitter.decorate(this);
  this.blockedURLs = new BlockedURLs();
};

Links.prototype = {
  /**
   * A set of functions called by @mozilla.org/browser/nav-historyservice
   * All history events are emitted from this object.
   */
  historyObserver: {
    onDeleteURI: function historyObserver_onDeleteURI(aURI) {
      // let observers remove sensitive data associated with deleted visit
      gLinks.emit("deleteURI", {url: aURI.spec});
    },

    onClearHistory: function historyObserver_onClearHistory() {
      gLinks.emit("clearHistory");
    },

    onFrecencyChanged: function historyObserver_onFrecencyChanged(aURI,
                           aNewFrecency, aGUID, aHidden, aLastVisitDate) {
      // The implementation of the query in getLinks excludes hidden and
      // unvisited pages, so it's important to exclude them here, too.
      if (!aHidden && aLastVisitDate) {
        gLinks.emit("linkChanged", {
          url: aURI.spec,
          frecency: aNewFrecency,
          lastVisitDate: aLastVisitDate,
          type: "history"
        });
      }
    },

    onManyFrecenciesChanged: function historyObserver_onManyFrecenciesChanged() {
      // Called when frecencies are invalidated and also when clearHistory is called
      // See toolkit/components/places/tests/unit/test_frecency_observers.js
      gLinks.emit("manyLinksChanged");
    },

    onTitleChanged: function historyObserver_onTitleChanged(aURI, aNewTitle) {
      gLinks.emit("linkChanged", {
        url: aURI.spec,
        title: aNewTitle
      });
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsINavHistoryObserver,
                                           Ci.nsISupportsWeakReference])
  },

  /**
   * A set of functions called by @mozilla.org/browser/nav-bookmarks-service
   * All bookmark events are emitted from this object.
   */
  bookmarksObserver: {
    onItemAdded(id, folderId, index, type) {
      if (type === Bookmarks.TYPE_BOOKMARK) {
        gLinks.getBookmark({id}).then(bookmark => {
          gLinks.emit("bookmarkAdded", bookmark);
        });
      }
    },

    onItemRemoved(id, folderId, index, type, uri) {
      if (type === Bookmarks.TYPE_BOOKMARK) {
        gLinks.emit("bookmarkRemoved", {bookmarkId: id, url: uri.spec});
      }
    },

    onItemChanged(id, property, isAnnotation, value, lastModified, type) {
      if (type === Bookmarks.TYPE_BOOKMARK) {
        gLinks.getBookmark({id}).then(bookmark => {
          gLinks.emit("bookmarkChanged", bookmark);
        });
      }
    },

    QueryInterface: XPCOMUtils.generateQI([Ci.nsINavBookmarkObserver,
                                           Ci.nsISupportsWeakReference])
  },

  /**
   * Must be called before the provider is used.
   * Makes it easy to disable under pref
   */
  init: function PlacesProvider_init() {
    PlacesUtils.history.addObserver(this.historyObserver, true);
    PlacesUtils.bookmarks.addObserver(this.bookmarksObserver, true);
  },

  /**
   * Must be called before the provider is unloaded.
   */
  uninit: function PlacesProvider_uninit() {
    PlacesUtils.history.removeObserver(this.historyObserver);
    PlacesUtils.bookmarks.removeObserver(this.bookmarksObserver);
  },

  /**
   * Removes a bookmark
   *
   * @param {String} bookmarkGuid the bookmark guid
   * @returns {Promise} Returns a promise set to an object representing the removed bookmark
   */
  asyncDeleteBookmark: function PlacesProvider_asyncDeleteBookmark(bookmarkGuid) {
    return Bookmarks.remove(bookmarkGuid);
  },

  /**
   * Adds a bookmark
   *
   * @param {String} url the url to bookmark
   * @returns {Promise} Returns a promise set to an object representing the bookmark
   */
  asyncAddBookmark: function PlacesProvider_asyncAddBookmark(url) {
    return Bookmarks.insert({url, type: Bookmarks.TYPE_BOOKMARK, parentGuid: Bookmarks.unfiledGuid});
  },

  /**
   * Removes a history link
   *
   * @param {String} url
   * @returns {Promise} Returns a promise set to true if link was removed
   */
  deleteHistoryLink: function PlacesProvider_deleteHistoryLink(url) {
    return PlacesUtils.history.remove(url);
  },

  /**
   * Blocks a URL
   */
  blockURL(url) {
    if (this.blockedURLs.save(url)) {
      this.emit("linkChanged", {url, blocked: true});
    }
  },

  /**
   * Unblocks a URL
   */
  unblockURL(url) {
    if (this.blockedURLs.remove(url)) {
      this.emit("linkChanged", {url, blocked: false});
    }
  },

  /**
   * Unblocks all URLs
   */
  unblockAll(url) {
    if (this.blockedURLs.clear()) {
      this.emit("manyLinksChanged");
    }
  },

  /**
   * Gets links from history based on supplied options
   *
   * @param {Object} options
   *        {Integer} limit: Maximum number of results to return. Max 20
   *        {Milliseconds} beforeDate: Only return links older than beforeDate
   *        {Milliseconds} afterDate: Only return links fresher than afterDate
   *        {String} order: if order=="bookmarksFrecency", orders by bookmarks and frecency, otherwise by recency
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  _getHistoryLinks: Task.async(function*(options = {}) {
    let {limit, afterDate, beforeDate, order, ignoreBlocked} = options;
    if (!limit || limit.options > LINKS_QUERY_LIMIT) {
      limit = LINKS_QUERY_LIMIT;
    }

    let blockedURLs = ignoreBlocked ? [] : this.blockedURLs.items().map(item => `"${item}"`);

    // setup binding parameters
    let params = {limit};

    // setup afterDate binding and sql clause
    let afterDateClause = "";
    if (afterDate) {
      afterDateClause = "AND moz_places.last_visit_date > :afterDate * 1000";
      params.afterDate = afterDate;
    }

    // setup beforeDate binding and sql clause
    let beforeDateClause = "";
    if (beforeDate) {
      beforeDateClause = "AND moz_places.last_visit_date < :beforeDate * 1000";
      params.beforeDate = beforeDate;
    }

    // setup order by clause
    let orderbyClause = (order === "bookmarksFrecency") ?
                    "ORDER BY bookmarkDateCreated DESC, frecency DESC, lastVisitDate DESC, url" :
                    "ORDER BY lastVisitDate DESC, frecency DESC, url";

    // construct sql query
    let sqlQuery = `SELECT moz_places.url as url,
                            moz_places.guid as guid,
                            moz_favicons.data as favicon,
                            moz_favicons.mime_type as mimeType,
                            moz_places.title,
                            moz_places.frecency,
                            moz_places.last_visit_date / 1000 as lastVisitDate,
                            "history"  as type,
                            moz_bookmarks.guid as bookmarkGuid,
                            moz_bookmarks.dateAdded / 1000 as bookmarkDateCreated
                     FROM moz_places
                     LEFT JOIN moz_favicons
                     ON moz_places.favicon_id = moz_favicons.id
                     LEFT JOIN moz_bookmarks
                     ON moz_places.id = moz_bookmarks.fk
                     WHERE hidden = 0 AND last_visit_date NOTNULL
                     AND moz_places.url NOT IN (${blockedURLs})
                     ${afterDateClause}
                     ${beforeDateClause}
                     ${orderbyClause}
                     LIMIT :limit`;

    let links = yield this.executePlacesQuery(sqlQuery, {
      columns: ["url", "guid", "favicon", "mimeType", "title", "lastVisitDate",
                "frecency", "type", "bookmarkGuid", "bookmarkDateCreated"],
      params
    });

    links = this._faviconBytesToDataURI(links);
    return links.filter(link => LinkChecker.checkLoadURI(link.url));
  }),

  /**
   * Gets the top recent links
   *
   * @param {Integer} options
   *                  limit: Maximum number of results to return. Max 20.
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  getRecentLinks: function PlacesProvider_getRecentLinks(options) {
    return this._getHistoryLinks(options);
  },

  /**
   * Gets the top frecent links - visited in last 72 hours and ordered by frecency
   *
   * @param {Integer} options
   *                  limit: Maximum number of results to return. Max 20.
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  getFrecentLinks: function PlacesProvider_getFrecentLinks(options = {}) {
    options.order = "bookmarksFrecency";
    options.afterDate = (new Date()).getTime() - FRECENT_RESULTS_TIME_LIMIT;
    return this._getHistoryLinks(options);
  },

  /**
   * Gets the top frecent sites.
   *
   * @param {Object} options
   *          options.limit: Maximum number of results to return. Max 20.
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  getTopFrecentSites: Task.async(function*(options = {}) {
    let {limit, ignoreBlocked} = options;
    if (!limit || limit.options > LINKS_QUERY_LIMIT) {
      limit = LINKS_QUERY_LIMIT;
    }

    let blockedURLs = ignoreBlocked ? [] : this.blockedURLs.items().map(item => `"${item}"`);

    // this query does "GROUP BY rev_host" to remove urls from same domain.
    // Note that unlike mysql, sqlite picks the last raw from groupby bucket.
    // Which is why subselect orders frecency and last_visit_date backwards.
    // In general the groupby behavior in the absence of aggregates is not
    // defined in SQL, hence we are relying on sqlite implementation that may
    // change in the future.
    let sqlQuery = `SELECT url, title, frecency, guid,
                          last_visit_date / 1000 as lastVisitDate, favicon, mimeType,
                          "history" as type
                    FROM
                    (
                      SELECT rev_host, moz_places.url, moz_favicons.data as favicon, mime_type as mimeType, title, frecency, last_visit_date, moz_places.guid as guid
                      FROM moz_places
                      LEFT JOIN moz_favicons
                      ON favicon_id = moz_favicons.id
                      WHERE hidden = 0 AND last_visit_date NOTNULL
                      AND moz_places.url NOT IN (${blockedURLs})
                      ORDER BY rev_host, frecency, last_visit_date, moz_places.url DESC
                    )
                    GROUP BY rev_host
                    ORDER BY frecency DESC, lastVisitDate DESC, url
                    LIMIT :limit`;

    let links = yield this.executePlacesQuery(sqlQuery, {
      columns: ["url", "guid", "title", "lastVisitDate", "frecency", "favicon", "mimeType", "type"],
      params: {limit}
    });

    links = this._faviconBytesToDataURI(links);
    return links.filter(link => LinkChecker.checkLoadURI(link.url));
  }),

  /**
   * Gets the most recent bookmarks
   *
   * @param {Object} options
   *          options.limit: Maximum number of results to return. Max 20.
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  getRecentBookmarks: Task.async(function*(options = {}) {
    let {limit, afterDate, beforeDate, ignoreBlocked} = options;
    if (!limit || limit.options > LINKS_QUERY_LIMIT) {
      limit = LINKS_QUERY_LIMIT;
    }

    let blockedURLs = ignoreBlocked ? [] : this.blockedURLs.items().map(item => `"${item}"`);

    // setup binding parameters
    let params = {limit, type: Bookmarks.TYPE_BOOKMARK};

    // setup afterDate binding and sql clause
    let afterDateClause = "";
    if (afterDate) {
      afterDateClause = "AND b.lastModified > :afterDate * 1000";
      params.afterDate = afterDate;
    }

    // setup beforeDate binding and sql clause
    let beforeDateClause = "";
    if (beforeDate) {
      beforeDateClause = "AND b.lastModified < :beforeDate * 1000";
      params.beforeDate = beforeDate;
    }

    let sqlQuery = `SELECT p.url, p.title, p.frecency, p.guid,
                          p.last_visit_date / 1000 as lastVisitDate,
                          b.lastModified / 1000 as lastModified,
                          b.dateAdded / 1000 as bookmarkDateCreated,
                          b.id as bookmarkId,
                          b.title as bookmarkTitle,
                          b.guid as bookmarkGuid,
                          "bookmark" as type,
                          f.data as favicon,
                          f.mime_type as mimeType
                    FROM moz_places p, moz_bookmarks b
                    LEFT JOIN moz_favicons f
                      ON p.favicon_id = f.id
                    WHERE b.fk = p.id
                    AND p.url NOT IN (${blockedURLs})
                    AND p.rev_host IS NOT NULL
                    AND b.type = :type
                    ${afterDateClause}
                    ${beforeDateClause}
                    ORDER BY bookmarkDateCreated DESC, b.lastModified DESC, lastVisitDate DESC, b.id DESC
                    LIMIT :limit`;

    let links = yield this.executePlacesQuery(sqlQuery, {
      columns: ["bookmarkId", "bookmarkTitle", "bookmarkGuid", "bookmarkDateCreated", "url", "guid",
                "title", "lastVisitDate", "frecency", "type", "lastModified", "favicon", "mimeType"],
      params
    });

    links = this._faviconBytesToDataURI(links);
    return links.filter(link => LinkChecker.checkLoadURI(link.url));
  }),

  /**
   * Gets a specific bookmark given an id
   *
   * @param {Object} options
   *          options.id: bookmark ID
   */
  getBookmark: Task.async(function*(options = {}) {
    let {id} = options;

    let sqlQuery = `SELECT p.url, p.title, p.frecency, p.guid,
                          p.last_visit_date / 1000 as lastVisitDate,
                          b.lastModified / 1000 as lastModified,
                          b.id as bookmarkId,
                          b.title as bookmarkTitle,
                          b.guid as bookmarkGuid,
                          "bookmark" as type,
                          f.data as favicon,
                          f.mime_type as mimeType
                    FROM moz_places p, moz_bookmarks b
                    LEFT JOIN moz_favicons f
                      ON p.favicon_id = f.id
                    WHERE b.fk = p.id
                    AND p.rev_host IS NOT NULL
                    AND b.type = :type
                    AND b.id = :id
                    ORDER BY b.lastModified, lastVisitDate DESC, b.id`;

    let links = yield this.executePlacesQuery(sqlQuery, {
      columns: ["bookmarkId", "bookmarkTitle", "bookmarkGuid", "url", "guid", "title", "lastVisitDate", "frecency", "type", "lastModified", "favicon", "mimeType"],
      params: {id, type: Bookmarks.TYPE_BOOKMARK}
    });

    links = this._faviconBytesToDataURI(links);
    links.filter(link => LinkChecker.checkLoadURI(link.url));
    if (links.length) {
      return links[0];
    }
    return null;
  }),

  /**
   * Obtain a set of links for highlights
   *
   * @param {Object} options
   *        {Integer} limit: Maximum number of results to return. Max 20
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  getHighlightsLinks: Task.async(function*(options = {}) {
    let {limit, ignoreBlocked} = options;
    if (!limit || limit.options > LINKS_QUERY_LIMIT) {
      limit = LINKS_QUERY_LIMIT;
    }

    let blockedURLs = ignoreBlocked ? [] : this.blockedURLs.items().map(item => `"${item}"`);

    let params = {limitBookmarks: 1, limitHistory: (limit - 1)};

    let sqlQuery = `SELECT DISTINCT * FROM (
                      SELECT * FROM (
                        SELECT p.url as url,
                               p.guid as guid,
                               f.data as favicon,
                               f.mime_type as mimeType,
                               p.title as title,
                               p.frecency as frecency,
                               p.last_visit_date / 1000 as lastVisitDate,
                               "bookmark" as type,
                               b.id as bookmarkId,
                               b.guid as bookmarkGuid,
                               b.title as bookmarkTitle,
                               b.lastModified / 1000 as lastModified,
                               b.dateAdded / 1000 as bookmarkDateCreated
                        FROM moz_places p
                        INNER JOIN moz_bookmarks b
                          ON b.fk = p.id
                        LEFT JOIN moz_favicons f
                          ON p.favicon_id = f.id
                        WHERE date(b.dateAdded / 1000 / 1000, 'unixepoch') > date('now', '${HIGHLIGHTS_THRESHOLDS.created}')
                        AND p.url NOT IN (${blockedURLs})
                        AND p.visit_count <= 3
                        ORDER BY b.dateAdded DESC
                        LIMIT :limitBookmarks
                      )

                      UNION ALL

                      SELECT * FROM (
                        SELECT p.url as url,
                               p.guid as guid,
                               f.data as favicon,
                               f.mime_type as mimeType,
                               p.title as title,
                               p.frecency as frecency,
                               p.last_visit_date / 1000 as lastVisitDate,
                               "history" as type,
                               b.id as bookmarkId,
                               b.guid as bookmarkGuid,
                               b.title as bookmarkTitle,
                               b.lastModified / 1000 as lastModified,
                               b.dateAdded / 1000 as bookmarkDateCreated
                        FROM moz_places p
                        LEFT JOIN moz_bookmarks b
                          ON b.fk = p.id
                        LEFT JOIN moz_favicons f
                          ON p.favicon_id = f.id
                        WHERE datetime(p.last_visit_date / 1000 / 1000, 'unixepoch') < datetime('now', '${HIGHLIGHTS_THRESHOLDS.visited}')
                        AND p.url NOT IN (${blockedURLs})
                        AND p.visit_count <= 3
                        AND p.title NOT NULL
                        AND p.rev_host NOT IN (${REV_HOST_BLACKLIST})
                        GROUP BY p.rev_host
                        ORDER BY p.last_visit_date DESC
                        LIMIT :limitHistory
                      )
                    )`;

    let links = yield this.executePlacesQuery(sqlQuery, {
      columns: ["bookmarkId", "bookmarkTitle", "bookmarkGuid", "bookmarkDateCreated", "url", "guid",
                "title", "lastVisitDate", "frecency", "type", "lastModified", "favicon", "mimeType"],
      params
    });

    links = this._faviconBytesToDataURI(links);
    return links.filter(link => LinkChecker.checkLoadURI(link.url));
  }),

  /**
   * From an Array of links, if favicons are present, convert to data URIs
   *
   * @param {Array} links
   *            an array containing objects with favicon data and mimeTypes
   *
   * @returns {Array} an array of links with favicons as data uri
   */
  _faviconBytesToDataURI(links) {
    return links.map(link => {
      if (link.favicon) {
        let encodedData = base64.encode(String.fromCharCode.apply(null, link.favicon));
        link.favicon = `data:${link.mimeType};base64,${encodedData}`;
      }
      delete link.mimeType;
      return link;
    });
  },

  /**
   * Gets History size
   *
   * @returns {Promise} Returns a promise with the count of moz_places records
   */
  getHistorySize: Task.async(function*(options = {}) {
    let {ignoreBlocked} = options;
    let blockedURLs = ignoreBlocked ? [] : this.blockedURLs.items().map(item => `"${item}"`);

    let sqlQuery = `SELECT count(1) as count
                    FROM moz_places
                    WHERE hidden = 0 AND last_visit_date NOT NULL
                    AND url NOT IN (${blockedURLs})`;

    let result = yield this.executePlacesQuery(sqlQuery);
    return result[0][0];
  }),

  /**
   * Gets Bookmarks count
   *
   * @returns {Promise} Returns a promise with the count of bookmarks
   */
  getBookmarksSize: Task.async(function*(options = {}) {
    let {ignoreBlocked} = options;
    let blockedURLs = ignoreBlocked ? [] : this.blockedURLs.items().map(item => `"${item}"`);

    let sqlQuery = `SELECT count(1) as count
                    FROM moz_bookmarks b, moz_places p
                    WHERE type = :type
                    AND b.fk = p.id
                    AND p.url NOT IN (${blockedURLs})`;

    let result = yield this.executePlacesQuery(sqlQuery, {params: {type: Bookmarks.TYPE_BOOKMARK}});
    return result[0][0];
  }),

  /**
   * Executes arbitrary query against places database
   *
   * @param {String} aSql
   *        SQL query to execute
   * @param {Object} [optional] aOptions
   *        aOptions.columns - an array of column names. if supplied the return
   *        items will consists of objects keyed on column names. Otherwise
   *        array of raw values is returned in the select order
   *        aOptions.param - an object of SQL binding parameters
   *        aOptions.callback - a callback to handle query raws
   *
   * @returns {Promise} Returns a promise with the array of retrieved items
   */
  executePlacesQuery: function PlacesProvider_executePlacesQuery(aSql, aOptions = {}) {
    let {columns, params, callback} = aOptions;
    let items = [];
    let queryError = null;
    return Task.spawn(function*() {
      let conn = yield PlacesUtils.promiseDBConnection();
      yield conn.executeCached(aSql, params, aRow => {
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
          queryError = e;
          throw StopIteration;
        }
      });
      if (queryError) {
        throw new Error(queryError);
      }
      return items;
    });
  }
};

/**
 * Singleton that serves as the default link provider for the grid.
 */
const gLinks = new Links();

exports.PlacesProvider = {
  LinkChecker,
  links: gLinks,
  BlockedURLs
};

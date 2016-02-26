/* globals XPCOMUtils, Services, gPrincipal, EventEmitter, PlacesUtils, Task, Bookmarks */

"use strict";

const {Ci, Cu} = require("chrome");
const base64 = require("sdk/base64");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function() {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Bookmarks",
                                  "resource://gre/modules/Bookmarks.jsm");

XPCOMUtils.defineLazyGetter(this, "gPrincipal", function() {
  let uri = Services.io.newURI("about:newtab", null, null);
  return Services.scriptSecurityManager.getNoAppCodebasePrincipal(uri);
});

// The maximum number of results PlacesProvider retrieves from history.
const HISTORY_RESULTS_LIMIT = 20;

// time interval for for frecent links query in milliseconds (72 hours).
const FRECENT_RESULTS_TIME_LIMIT = 72 * 60 * 60 * 1000;

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
      Services.scriptSecurityManager.
        checkLoadURIStrWithPrincipal(gPrincipal, aURI, this.flags);
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
};

Links.prototype = {
  /**
   * A set of functions called by @mozilla.org/browser/nav-historyservice
   * All history events are emitted from this object.
   */
  historyObserver: {
    onDeleteURI: function historyObserver_onDeleteURI(aURI) {
      // let observers remove sensetive data associated with deleted visit
      gLinks.emit("deleteURI", {
        url: aURI.spec,
      });
    },

    onClearHistory: function historyObserver_onClearHistory() {
      gLinks.emit("clearHistory");
    },

    onFrecencyChanged: function historyObserver_onFrecencyChanged(aURI,
                           aNewFrecency, aGUID, aHidden, aLastVisitDate) { // jshint ignore:line
      // The implementation of the query in getLinks excludes hidden and
      // unvisited pages, so it's important to exclude them here, too.
      if (!aHidden && aLastVisitDate) {
        gLinks.emit("linkChanged", {
          url: aURI.spec,
          frecency: aNewFrecency,
          lastVisitDate: aLastVisitDate,
          type: "history",
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
   * Removes a history link
   *
   * @param {String} url
   * @returns {Promise} Returns a promise set to true if link was removed
   */
  deleteHistoryLink: function PlacesProvider_deleteHistoryLink(url) {
    return PlacesUtils.history.remove(url);
  },

  /**
   * Gets links from history based on supplied options
   *
   * @param {Object} options
   *        {Integer} limit: Maximum number of results to return. Max 20
   *        {Milliseconds} beforeDate: Only return links older than beforeDate
   *        {Milliseconds} afterDate: Only return links fresher than afterDate
   *        {String} order: if order=="frecency", orders by frecency, otherwise by recency
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  _getHistoryLinks: Task.async(function*(options={}) {

    let {limit, afterDate, beforeDate, order} = options;
    if (!limit || limit.options > HISTORY_RESULTS_LIMIT) {
      limit = HISTORY_RESULTS_LIMIT;
    }

    // setup binding parameters
    let params = {limit: limit};

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
    let orderbyClause = (order == "frecency") ?
                    "ORDER BY frecency DESC, lastVisitDate DESC, url" :
                    "ORDER BY lastVisitDate DESC, frecency DESC, url" ;

    // construct sql query
    let sqlQuery =  `SELECT moz_places.url as url,
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
                     ${afterDateClause}
                     ${beforeDateClause}
                     ${orderbyClause}
                     LIMIT :limit`;

    let links = yield this.executePlacesQuery(sqlQuery, {
                  columns: ["url", "favicon", "mimeType", "title", "lastVisitDate",
                            "frecency", "type", "bookmarkGuid", "bookmarkDateCreated"],
                  params: params
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
  getFrecentLinks: function PlacesProvider_getFrecentLinks(options={}) {
    options.order = "frecency";
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
  getTopFrecentSites: Task.async(function*(options={}) {

    let {limit} = options;
    if (!limit || limit.options > HISTORY_RESULTS_LIMIT) {
      limit = HISTORY_RESULTS_LIMIT;
    }

    // this query does "GROUP BY rev_host" to remove urls from same domain.
    // Note that unlike mysql, sqlite picks the last raw from groupby bucket.
    // Which is why subselect orders frecency and last_visit_date backwards.
    // In general the groupby behavior in the absence of aggregates is not
    // defined in SQL, hence we are relying on sqlite implementation that may
    // change in the future.
    let sqlQuery = `SELECT url, title, frecency,
                          last_visit_date / 1000 as lastVisitDate, favicon, mimeType,
                          "history" as type
                    FROM
                    (
                      SELECT rev_host, moz_places.url, moz_favicons.data as favicon, mime_type as mimeType, title, frecency, last_visit_date
                      FROM moz_places
                      LEFT JOIN moz_favicons
                      ON favicon_id = moz_favicons.id
                      WHERE hidden = 0 AND last_visit_date NOTNULL
                      ORDER BY rev_host, frecency, last_visit_date, moz_places.url DESC
                    )
                    GROUP BY rev_host
                    ORDER BY frecency DESC, lastVisitDate DESC, url
                    LIMIT :limit`;

    let links = yield this.executePlacesQuery(sqlQuery, {
                  columns: ["url", "title", "lastVisitDate", "frecency", "favicon", "mimeType", "type"],
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
  getRecentBookmarks: Task.async(function*(options={}) {
    let {limit} = options;
    if (!limit || limit.options > HISTORY_RESULTS_LIMIT) {
      limit = HISTORY_RESULTS_LIMIT;
    }

    let sqlQuery = `SELECT p.url, p.title, p.frecency,
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
                    AND p.rev_host IS NOT NULL
                    AND b.type = :type
                    ORDER BY b.lastModified DESC, lastVisitDate DESC, b.id DESC
                    LIMIT :limit`;

    let links = yield this.executePlacesQuery(sqlQuery, {
                  columns: ["bookmarkId", "bookmarkTitle", "bookmarkGuid", "bookmarkDateCreated", "url", "title", "lastVisitDate", "frecency", "type", "lastModified", "favicon", "mimeType"],
                  params: {limit, type: Bookmarks.TYPE_BOOKMARK}
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
  getBookmark: Task.async(function*(options={}) {
    let {id} = options;

    let sqlQuery = `SELECT p.url, p.title, p.frecency,
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
                  columns: ["bookmarkId", "bookmarkTitle", "bookmarkGuid", "url", "title", "lastVisitDate", "frecency", "type", "lastModified", "favicon", "mimeType"],
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
  executePlacesQuery: function PlacesProvider_executePlacesQuery(aSql, aOptions={}) {
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
const gLinks = new Links(); // eslint-disable-line no-use-before-define

exports.PlacesProvider = {
  LinkChecker,
  links: gLinks,
};

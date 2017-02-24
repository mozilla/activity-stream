module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 116);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("chrome");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

// This has to be relative so the firefox add-on side can read the path
const ActionManager = __webpack_require__(56);
const eventConstants = __webpack_require__(8);

const am = new ActionManager([
  "APP_INIT",
  "APP_UNLOAD",
  "EXPERIMENTS_RESPONSE",
  "HIGHLIGHTS_AWAITING_METADATA",
  "HIGHLIGHTS_LINKS_REQUEST",
  "HIGHLIGHTS_LINKS_RESPONSE",
  "HIGHLIGHTS_REQUEST",
  "HIGHLIGHTS_RESPONSE",
  "LOCALE_UPDATED",
  "MANY_LINKS_CHANGED",
  "MERGE_STORE",
  "METADATA_UPDATED",
  "NOTIFY_BLOCK_URL",
  "NOTIFY_BOOKMARK_ADD",
  "NOTIFY_BOOKMARK_DELETE",
  "NOTIFY_COPY_URL",
  "NOTIFY_EMAIL_URL",
  "NOTIFY_FILTER_QUERY",
  "NOTIFY_HISTORY_DELETE_CANCELLED",
  "NOTIFY_HISTORY_DELETE",
  "NOTIFY_MANAGE_ENGINES",
  "NOTIFY_OPEN_WINDOW",
  "NOTIFY_PERFORM_SEARCH",
  "NOTIFY_PERFORMANCE",
  "NOTIFY_REMOVE_FORM_HISTORY_ENTRY",
  "NOTIFY_ROUTE_CHANGE",
  "NOTIFY_UNBLOCK_URL",
  "NOTIFY_UNDESIRED_EVENT",
  "NOTIFY_UPDATE_SEARCH_STRING",
  "NOTIFY_USER_EVENT",
  "PLACES_STATS_UPDATED",
  "PREF_CHANGED_RESPONSE",
  "PREFS_RESPONSE",
  "RECEIVE_BOOKMARK_ADDED",
  "RECEIVE_BOOKMARK_REMOVED",
  "RECEIVE_PLACES_CHANGES",
  "RECENT_LINKS_REQUEST",
  "RECENT_LINKS_RESPONSE",
  "SEARCH_CYCLE_CURRENT_ENGINE_REQUEST",
  "SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE",
  "SEARCH_ENGINES_CHANGED",
  "SEARCH_STATE_UPDATED",
  "SEARCH_SUGGESTIONS_REQUEST",
  "SEARCH_SUGGESTIONS_RESPONSE",
  "SYNC_COMPLETE",
  "TOP_FRECENT_SITES_REQUEST",
  "TOP_FRECENT_SITES_RESPONSE"
]);

// This is a a set of actions that have sites in them,
// so we can do stuff like filter them, add metadata, etc.
am.ACTIONS_WITH_SITES = new Set([
  "HIGHLIGHTS_LINKS_RESPONSE",
  "RECENT_LINKS_RESPONSE",
  "TOP_FRECENT_SITES_RESPONSE"
].map(type => am.type(type)));

/**
 * Notify - Notify add-on action
 *
 * @param  {string} type  name of the action
 * @param  {obj} data    (optional) data associated with the action
 * @param  {obj} meta    (optional) options to be included in the meta part of the action.
 *               meta.skipMasterStore - Does not dispatch to the master store
 * @return {obj} action   The final action as a plain object
 */
function Notify(type, data, meta) {
  const action = {
    type,
    meta: {broadcast: eventConstants.CONTENT_TO_ADDON}
  };
  if (data) {
    action.data = data;
  }
  if (meta) {
    action.meta = Object.assign(action.meta, meta);
  }
  return action;
}

function Response(type, data, options = {}) {
  const action = {type, data};
  if (options.error) {
    action.error = true;
  }
  if (options.append) {
    action.meta = {append: true};
  }
  return action;
}

function RequestExpect(type, expect, options = {}) {
  const action = {
    type,
    meta: {broadcast: eventConstants.CONTENT_TO_ADDON, expect}
  };
  if (options.timeout) {
    action.meta.timeout = options.timeout;
  }
  if (options.data) {
    action.data = options.data;
  }
  if (options.append) {
    action.meta.append = true;
  }
  if (options.meta) {
    action.meta = Object.assign({}, options.meta, action.meta);
  }
  return action;
}

function RequestHighlightsLinks() {
  return RequestExpect("HIGHLIGHTS_LINKS_REQUEST", "HIGHLIGHTS_LINKS_RESPONSE");
}

function RequestSearchSuggestions(data) {
  return RequestExpect("SEARCH_SUGGESTIONS_REQUEST", "SEARCH_SUGGESTIONS_RESPONSE", {data});
}

function NotifyRemoveFormHistory(data) {
  return Notify("NOTIFY_REMOVE_FORM_HISTORY_ENTRY", data);
}

function NotifyCycleEngine(data) {
  return Notify("SEARCH_CYCLE_CURRENT_ENGINE_REQUEST", data);
}

function NotifyManageEngines() {
  return Notify("NOTIFY_MANAGE_ENGINES");
}

function NotifyUpdateSearchString(searchString) {
  return Notify("NOTIFY_UPDATE_SEARCH_STRING", {searchString}, {skipMasterStore: true});
}

function NotifyBookmarkAdd(url) {
  return Notify("NOTIFY_BOOKMARK_ADD", url);
}

function NotifyBookmarkDelete(bookmarkGuid) {
  return Notify("NOTIFY_BOOKMARK_DELETE", bookmarkGuid);
}

function NotifyHistoryDelete(data) {
  if (confirm("Are you sure you want to delete this from your entire history? This action cannot be undone.")) { // eslint-disable-line no-alert
    return Notify("NOTIFY_HISTORY_DELETE", data);
  }
  return {type: "NOTIFY_HISTORY_DELETE_CANCELLED"};
}

function NotifyBlockURL(url) {
  return Notify("NOTIFY_BLOCK_URL", url);
}

function NotifyUnblockURL(url) {
  return Notify("NOTIFY_UNBLOCK_URL", url);
}

function NotifyPerformSearch(data) {
  return Notify("NOTIFY_PERFORM_SEARCH", data);
}

function NotifyRouteChange(data) {
  return Notify("NOTIFY_ROUTE_CHANGE", data);
}

function NotifyPerf(data) {
  return Notify("NOTIFY_PERFORMANCE", data);
}

function NotifyEvent(data) {
  if (!eventConstants.defaultPage === data.page) {
    throw new Error(`${data.page} is not a valid page`);
  }
  if (!eventConstants.events.has(data.event)) {
    throw new Error(`${data.event} is not a valid event type`);
  }
  if (data.source && !eventConstants.sources.has(data.source)) {
    throw new Error(`${data.source} is not a valid source`);
  }
  return Notify("NOTIFY_USER_EVENT", data);
}

function NotifyUndesiredEvent(data) {
  if (!eventConstants.defaultPage === data.page) {
    throw new Error(`${data.page} is not a valid page`);
  }
  if (!eventConstants.undesiredEvents.has(data.event)) {
    throw new Error(`${data.event} is not a valid event type`);
  }
  return Notify("NOTIFY_UNDESIRED_EVENT", data);
}

function NotifyFilterQuery(data) {
  return Notify("NOTIFY_FILTER_QUERY", data);
}

function NotifyOpenWindow(data) {
  return Notify("NOTIFY_OPEN_WINDOW", data);
}

function NotifyCopyUrl(url) {
  return Notify("NOTIFY_COPY_URL", {url});
}

function NotifyEmailUrl(url, title) {
  return Notify("NOTIFY_EMAIL_URL", {url, title});
}

function PlacesStatsUpdate(historySize, bookmarksSize) {
  const data = {};
  if (typeof historySize !== "undefined") {
    data.historySize = historySize;
  }
  if (typeof bookmarksSize !== "undefined") {
    data.bookmarksSize = bookmarksSize;
  }
  return {type: "PLACES_STATS_UPDATED", data};
}

am.defineActions({
  Notify,
  NotifyBlockURL,
  NotifyBookmarkAdd,
  NotifyBookmarkDelete,
  NotifyCopyUrl,
  NotifyCycleEngine,
  NotifyEmailUrl,
  NotifyEvent,
  NotifyFilterQuery,
  NotifyHistoryDelete,
  NotifyManageEngines,
  NotifyOpenWindow,
  NotifyPerf,
  NotifyPerformSearch,
  NotifyRemoveFormHistory,
  NotifyRouteChange,
  NotifyUnblockURL,
  NotifyUndesiredEvent,
  NotifyUpdateSearchString,
  PlacesStatsUpdate,
  RequestExpect,
  RequestHighlightsLinks,
  RequestSearchSuggestions,
  Response
});

module.exports = am;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = {
  // The opacity value of favicon background colors
  BACKGROUND_FADE: 0.5,

  // Age of bookmarks in milliseconds that results in a 1.0 quotient, i.e., an
  // age smaller/younger than this value results in a larger-than-1.0 fraction
  BOOKMARK_AGE_DIVIDEND: 3 * 24 * 60 * 60 * 1000,

  // What is our default locale for the app?
  DEFAULT_LOCALE: "en-US",

  // Locales that should be displayed RTL
  RTL_LIST: ["ar", "he", "fa", "ur"],

  // Number of large Highlight titles in the new Highlights world, including
  // all rows.
  HIGHLIGHTS_LENGTH: 9,

  // How many items per query?
  LINKS_QUERY_LIMIT: 500,

  // This is where we cache redux state so it can be shared between pages
  LOCAL_STORAGE_KEY: "ACTIVITY_STREAM_STATE",

  // Number of top sites
  TOP_SITES_LENGTH: 6,

  // This is a perf event
  WORKER_ATTACHED_EVENT: "WORKER_ATTACHED"
};


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("sdk/simple-prefs");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("sdk/self");

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/* globals XPCOMUtils, Services, gPrincipal, EventEmitter, PlacesUtils, Task, Bookmarks, SyncedTabs */



const {Ci, Cu} = __webpack_require__(0);
const base64 = __webpack_require__(110);
const simplePrefs = __webpack_require__(4);

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://services-sync/SyncedTabs.jsm");

XPCOMUtils.defineLazyGetter(global, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

XPCOMUtils.defineLazyModuleGetter(global, "Task",
                                  "resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(global, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(global, "Bookmarks",
                                  "resource://gre/modules/Bookmarks.jsm");

XPCOMUtils.defineLazyGetter(global, "gPrincipal", () => {
  let uri = Services.io.newURI("about:newtab", null, null);
  return Services.scriptSecurityManager.getNoAppCodebasePrincipal(uri);
});

const {TOP_SITES_LENGTH, LINKS_QUERY_LIMIT} = __webpack_require__(3);

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
    // check for 'place:' protocol
    if (aURI.startsWith("place:")) {
      return false;
    }
    try {
      Services.scriptSecurityManager.checkLoadURIStrWithPrincipal(gPrincipal, aURI, this.flags);
      return true;
    } catch (e) {
      // We got a weird URI or one that would inherit the caller's principal.
    }
    return false;
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

let gLinks;
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

    QueryInterface: XPCOMUtils.generateQI([
      Ci.nsINavHistoryObserver,
      Ci.nsISupportsWeakReference
    ])
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
        }).catch(err => Cu.reportError(err));
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
        }).catch(err => Cu.reportError(err));
      }
    },

    QueryInterface: XPCOMUtils.generateQI([
      Ci.nsINavBookmarkObserver,
      Ci.nsISupportsWeakReference
    ])
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

  getFavicon: Task.async(function*(url) {
    let sqlQuery = `SELECT moz_favicons.mime_type as mimeType, moz_favicons.data as favicon
                    FROM moz_favicons
                    INNER JOIN moz_places ON
                    moz_places.favicon_id = moz_favicons.id
                    WHERE moz_places.url = :url`;
    let res = yield this.executePlacesQuery(sqlQuery, {
      columns: ["favicon", "mimeType"],
      params: {url}
    });
    if (res.length) {
      const {favicon} = this._faviconBytesToDataURI(res)[0];
      return favicon;
    }
    return null;
  }),

  /**
   * Gets the top frecent sites.
   *
   * @param {Object} options
   *          options.limit: Maximum number of results to return.
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  getTopFrecentSites: Task.async(function*(options = {}) {
    let {limit, ignoreBlocked} = options;

    // Use double the number to allow for immediate display when blocking sites
    const QUERY_LIMIT = TOP_SITES_LENGTH * 2;
    if (!limit || limit > QUERY_LIMIT) {
      limit = QUERY_LIMIT;
    }

    let blockedURLs = ignoreBlocked ? [] : this.blockedURLs.items().map(item => `"${item}"`);

    // GROUP first by rev_host to get the most-frecent page of an exact host
    // then GROUP by rev_nowww to dedupe between top two pages of nowww host.
    // Note that unlike mysql, sqlite picks the last raw from groupby bucket.
    // Which is why subselect orders frecency and last_visit_date backwards.
    // In general the groupby behavior in the absence of aggregates is not
    // defined in SQL, hence we are relying on sqlite implementation that may
    // change in the future.
    let sqlQuery = `SELECT url, title, SUM(frecency) frecency, guid, bookmarkGuid,
                          last_visit_date / 1000 as lastVisitDate, favicon, mimeType,
                          "history" as type
                    FROM (SELECT * FROM (
                      SELECT
                        rev_host,
                        CASE SUBSTR(rev_host, -5)
                          WHEN ".www." THEN SUBSTR(rev_host, -4, -999)
                          ELSE rev_host
                        END AS rev_nowww,
                        moz_places.url,
                        moz_favicons.data AS favicon,
                        mime_type AS mimeType,
                        moz_places.title,
                        frecency,
                        last_visit_date,
                        moz_places.guid AS guid,
                        moz_bookmarks.guid AS bookmarkGuid
                      FROM moz_places
                      LEFT JOIN moz_favicons
                      ON favicon_id = moz_favicons.id
                      LEFT JOIN moz_bookmarks
                      on moz_places.id = moz_bookmarks.fk
                      WHERE hidden = 0 AND last_visit_date NOTNULL
                      AND moz_places.url NOT IN (${blockedURLs})
                      ORDER BY frecency, last_visit_date, moz_places.url DESC
                    ) GROUP BY rev_host)
                    GROUP BY rev_nowww
                    ORDER BY frecency DESC, lastVisitDate DESC, url
                    LIMIT :limit`;

    let links = yield this.executePlacesQuery(sqlQuery, {
      columns: [
        "bookmarkGuid",
        "favicon",
        "frecency",
        "guid",
        "lastVisitDate",
        "mimeType",
        "title",
        "type",
        "url"
      ],
      params: {limit}
    });

    return this._processLinks(links);
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
      columns: [
        "bookmarkGuid",
        "bookmarkId",
        "bookmarkTitle",
        "favicon",
        "frecency",
        "guid",
        "lastModified",
        "lastVisitDate",
        "mimeType",
        "title",
        "type",
        "url"
      ],
      params: {id, type: Bookmarks.TYPE_BOOKMARK}
    });

    links = this._processLinks(links);
    if (links.length) {
      return links[0];
    }
    return null;
  }),

  /**
   * Obtain a set of most recently visited links to rank.
   *
   * @param {Object} options
   *          options.limit: Maximum number of results to return.
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  getRecentlyVisited: Task.async(function*(options = {}) {
    let {ignoreBlocked, limit} = options;
    let blockedURLs = ignoreBlocked ? [] : this.blockedURLs.items().map(item => `"${item}"`);
    if (!limit || limit > LINKS_QUERY_LIMIT) {
      limit = LINKS_QUERY_LIMIT;
    }

    const columns = [
      "bookmarkDateCreated",
      "bookmarkGuid",
      "bookmarkId",
      "bookmarkTitle",
      "favicon",
      "frecency",
      "guid",
      "lastModified",
      "lastVisitDate",
      "mimeType",
      "title",
      "type",
      "url",
      "visitCount"
    ];
    let sqlQuery = `SELECT p.url as url,
                           p.guid as guid,
                           f.data as favicon,
                           f.mime_type as mimeType,
                           p.title as title,
                           p.frecency as frecency,
                           p.visit_count as visitCount,
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
                    WHERE p.url NOT IN (${blockedURLs})
                    AND p.title NOT NULL
                    AND p.rev_host NOT IN (${REV_HOST_BLACKLIST})
                    ORDER BY p.last_visit_date DESC
                    LIMIT :limit`;

    let links = yield this.executePlacesQuery(sqlQuery, {columns, params: {limit}});
    return this._processLinks(links);
  }),

  /**
   * Gets the remote tabs links.
   *
   * @param {Integer} options
   *
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  getRemoteTabsLinks: Task.async(function*(options = {}) {
    let {limit} = options;
    if (!limit || limit > LINKS_QUERY_LIMIT) {
      limit = LINKS_QUERY_LIMIT;
    }

    // We first get the URLs open on other devices from SyncedTabs.
    let clients = yield SyncedTabs.getTabClients();

    if (clients.length === 0) {
      // No reason to waste cycles doing anything else.
      return Promise.resolve([]);
    }

    // get the URLs with the data we need from all the clients
    let urls = {};
    for (let client of clients) {
      for (let tab of client.tabs) {
        urls[tab.url] = {
          deviceName: client.name,
          deviceIsMobile: client.isMobile,
          lastUsed: tab.lastUsed
        };
      }
    }

    // Now we add the data required from the places DB.
    // setup binding parameters
    let params = {limit};

    let blockedURLs = this.blockedURLs.items().map(item => `"${item}"`);

    let urlsToSelect = Object.keys(urls).map(item => `"${item}"`); //

    // construct sql query
    let sqlQuery = `SELECT moz_places.url as url,
                            moz_places.guid as guid,
                            moz_favicons.data as favicon,
                            moz_favicons.mime_type as mimeType,
                            moz_places.title,
                            moz_places.frecency,
                            moz_places.last_visit_date / 1000 as lastVisitDate,
                            "synced"  as type,
                            moz_bookmarks.guid as bookmarkGuid,
                            moz_bookmarks.dateAdded / 1000 as bookmarkDateCreated
                     FROM moz_places
                     LEFT JOIN moz_favicons
                     ON moz_places.favicon_id = moz_favicons.id
                     LEFT JOIN moz_bookmarks
                     ON moz_places.id = moz_bookmarks.fk
                     WHERE hidden = 0 AND last_visit_date NOTNULL
                     AND moz_places.url IN (${urlsToSelect}) AND moz_places.url NOT IN (${blockedURLs})
                     ORDER BY lastVisitDate DESC, frecency DESC, url
                     LIMIT :limit`;

    let links = yield this.executePlacesQuery(sqlQuery, {
      columns: [
        "bookmarkDateCreated",
        "bookmarkGuid",
        "favicon",
        "frecency",
        "guid",
        "lastVisitDate",
        "mimeType",
        "title",
        "type",
        "url"
      ],
      params
    });

    links = this._processLinks(links);

    // Add the sync data to each link.
    links = links.map(link => Object.assign(link, urls[link.url]));

    return links;
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
   * Add the eTLD to each link in the array of links.
   *
   * @param {Array} links
   *            an array containing objects with urls
   *
   * @returns {Array} an array of links with eTLDs added
   */
  _addETLD(links) {
    return links.map(link => {
      try {
        link.eTLD = Services.eTLD.getPublicSuffix(Services.io.newURI(link.url, null, null));
      } catch (e) {
        link.eTLD = "";
      }
      return link;
    });
  },

  /**
   * Process links after getting them from the database.
   *
   * @param {Array} links
   *            an array containing link objects
   *
   * @returns {Array} an array of checked links with favicons and eTLDs added
   */
  _processLinks(links) {
    let links_ = links.filter(link => LinkChecker.checkLoadURI(link.url));
    links_ = this._faviconBytesToDataURI(links_);
    return this._addETLD(links_);
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
   * Gets History size since a certain timestamp
   *
   * @param {String} timestamp in milliseconds
   *
   * @returns {Promise} Returns a promise with the count of moz_places records
   *                    that have been entered since the timestamp provided
   */
  getHistorySizeSince: Task.async(function*(timestamp) {
    let sqlQuery = `SELECT count(*)
                    FROM moz_places WHERE id IN
                    (SELECT DISTINCT place_id FROM moz_historyvisits
                    WHERE datetime(visit_date / 1000 / 1000, 'unixepoch') >= :timestamp)
                    AND hidden = 0 AND last_visit_date NOT NULL`;

    let result = yield this.executePlacesQuery(sqlQuery, {params: {timestamp}});
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
   * Get all history items from the past 90 days.
   * Used to determine frequency of domain visits.
   */
  getAllHistoryItems: Task.async(function*() {
    let sqlQuery = `SELECT rev_host AS reversedHost,
                           SUM(visit_count) AS visitCount
                    FROM moz_places
                    WHERE rev_host NOT IN (${REV_HOST_BLACKLIST})
                    AND datetime(last_visit_date / 1000 / 1000, 'unixepoch') > datetime('now', '-90 days')
                    GROUP BY rev_host`;

    return yield this.executePlacesQuery(sqlQuery, {
      columns: [
        "reversedHost",
        "visitCount"
      ]
    });
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
gLinks = new Links();

exports.PlacesProvider = {
  LinkChecker,
  links: gLinks,
  BlockedURLs
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

const {Cu} = __webpack_require__(0);

module.exports = class Feed {
  constructor(options = {}) {
    this.options = options;
    this.state = {
      lastUpdated: null,
      inProgress: false
    };
    this.store = null; // added in .connectStore
  }
  connectStore(store) {
    this.store = store;
  }
  log(text) {
    console.log(text); // eslint-disable-line no-console
  }

  /**
   * refresh - Call getData,
   *
   * @param  {type} reason description
   * @return {type}        description
   */
  refresh(reason) {
    return new Promise((resolve, reject) => {
      if (!this.getData || typeof this.getData !== "function") {
        reject(new Error("You need to declare a .getData function on your feed in order to use .refresh"));
        return;
      }
      if (!this.store) {
        reject(new Error("No store was connected"));
        return;
      }

      if (this.state.inProgress) {
        resolve();
        return;
      }

      this.log(`Refreshing data for ${this.constructor.name}` + (reason ? ` because ${reason}` : "")); // eslint-disable-line prefer-template

      this.state.inProgress = true;

      this.getData()
        .then(action => {
          this.state.inProgress = false;
          this.state.lastUpdated = new Date().getTime();
          this.store.dispatch(action);
          resolve();
        })
        .catch(err => {
          this.state.inProgress = false;
          reject(err);
        });
    }).catch(e => {
      Cu.reportError(e);
    });
  }
};


/***/ }),
/* 8 */
/***/ (function(module, exports) {

const DEFAULT_PAGE = "NEW_TAB";

const constants = {
  CONTENT_TO_ADDON: "content-to-addon",
  ADDON_TO_CONTENT: "addon-to-content",
  defaultPage: DEFAULT_PAGE,
  events: new Set([
    "BLOCK",
    "BOOKMARK_ADD",
    "BOOKMARK_DELETE",
    "CLICK",
    "DELETE",
    "LOAD_MORE",
    "LOAD_MORE_SCROLL",
    "OPEN_NEW_WINDOW",
    "OPEN_PRIVATE_WINDOW",
    "SEARCH",
    "UNBLOCK"
  ]),
  undesiredEvents: new Set([
    "HIDE_LOADER",
    "MISSING_IMAGE",
    "SHOW_LOADER",
    "SLOW_ADDON_DETECTED"
  ]),
  sources: new Set([
    "TOP_SITES",
    "FEATURED",
    "ACTIVITY_FEED"
  ])
};

module.exports = constants;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var required = __webpack_require__(100)
  , lolcation = __webpack_require__(106)
  , qs = __webpack_require__(93)
  , protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i;

/**
 * These are the parse rules for the URL parser, it informs the parser
 * about:
 *
 * 0. The char it Needs to parse, if it's a string it should be done using
 *    indexOf, RegExp using exec and NaN means set as current value.
 * 1. The property we should set when parsing this value.
 * 2. Indication if it's backwards or forward parsing, when set as number it's
 *    the value of extra chars that should be split off.
 * 3. Inherit from location if non existing in the parser.
 * 4. `toLowerCase` the resulting value.
 */
var rules = [
  ['#', 'hash'],                        // Extract from the back.
  ['?', 'query'],                       // Extract from the back.
  ['/', 'pathname'],                    // Extract from the back.
  ['@', 'auth', 1],                     // Extract from the front.
  [NaN, 'host', undefined, 1, 1],       // Set left over value.
  [/:(\d+)$/, 'port', undefined, 1],    // RegExp the back.
  [NaN, 'hostname', undefined, 1, 1]    // Set left over.
];

/**
 * @typedef ProtocolExtract
 * @type Object
 * @property {String} protocol Protocol matched in the URL, in lowercase.
 * @property {Boolean} slashes `true` if protocol is followed by "//", else `false`.
 * @property {String} rest Rest of the URL that is not part of the protocol.
 */

/**
 * Extract protocol information from a URL with/without double slash ("//").
 *
 * @param {String} address URL we want to extract from.
 * @return {ProtocolExtract} Extracted information.
 * @api private
 */
function extractProtocol(address) {
  var match = protocolre.exec(address);

  return {
    protocol: match[1] ? match[1].toLowerCase() : '',
    slashes: !!match[2],
    rest: match[3]
  };
}

/**
 * Resolve a relative URL pathname against a base URL pathname.
 *
 * @param {String} relative Pathname of the relative URL.
 * @param {String} base Pathname of the base URL.
 * @return {String} Resolved pathname.
 * @api private
 */
function resolve(relative, base) {
  var path = (base || '/').split('/').slice(0, -1).concat(relative.split('/'))
    , i = path.length
    , last = path[i - 1]
    , unshift = false
    , up = 0;

  while (i--) {
    if (path[i] === '.') {
      path.splice(i, 1);
    } else if (path[i] === '..') {
      path.splice(i, 1);
      up++;
    } else if (up) {
      if (i === 0) unshift = true;
      path.splice(i, 1);
      up--;
    }
  }

  if (unshift) path.unshift('');
  if (last === '.' || last === '..') path.push('');

  return path.join('/');
}

/**
 * The actual URL instance. Instead of returning an object we've opted-in to
 * create an actual constructor as it's much more memory efficient and
 * faster and it pleases my OCD.
 *
 * @constructor
 * @param {String} address URL we want to parse.
 * @param {Object|String} location Location defaults for relative paths.
 * @param {Boolean|Function} parser Parser for the query string.
 * @api public
 */
function URL(address, location, parser) {
  if (!(this instanceof URL)) {
    return new URL(address, location, parser);
  }

  var relative, extracted, parse, instruction, index, key
    , instructions = rules.slice()
    , type = typeof location
    , url = this
    , i = 0;

  //
  // The following if statements allows this module two have compatibility with
  // 2 different API:
  //
  // 1. Node.js's `url.parse` api which accepts a URL, boolean as arguments
  //    where the boolean indicates that the query string should also be parsed.
  //
  // 2. The `URL` interface of the browser which accepts a URL, object as
  //    arguments. The supplied object will be used as default values / fall-back
  //    for relative paths.
  //
  if ('object' !== type && 'string' !== type) {
    parser = location;
    location = null;
  }

  if (parser && 'function' !== typeof parser) parser = qs.parse;

  location = lolcation(location);

  //
  // Extract protocol information before running the instructions.
  //
  extracted = extractProtocol(address || '');
  relative = !extracted.protocol && !extracted.slashes;
  url.slashes = extracted.slashes || relative && location.slashes;
  url.protocol = extracted.protocol || location.protocol || '';
  address = extracted.rest;

  //
  // When the authority component is absent the URL starts with a path
  // component.
  //
  if (!extracted.slashes) instructions[2] = [/(.*)/, 'pathname'];

  for (; i < instructions.length; i++) {
    instruction = instructions[i];
    parse = instruction[0];
    key = instruction[1];

    if (parse !== parse) {
      url[key] = address;
    } else if ('string' === typeof parse) {
      if (~(index = address.indexOf(parse))) {
        if ('number' === typeof instruction[2]) {
          url[key] = address.slice(0, index);
          address = address.slice(index + instruction[2]);
        } else {
          url[key] = address.slice(index);
          address = address.slice(0, index);
        }
      }
    } else if (index = parse.exec(address)) {
      url[key] = index[1];
      address = address.slice(0, index.index);
    }

    url[key] = url[key] || (
      relative && instruction[3] ? location[key] || '' : ''
    );

    //
    // Hostname, host and protocol should be lowercased so they can be used to
    // create a proper `origin`.
    //
    if (instruction[4]) url[key] = url[key].toLowerCase();
  }

  //
  // Also parse the supplied query string in to an object. If we're supplied
  // with a custom parser as function use that instead of the default build-in
  // parser.
  //
  if (parser) url.query = parser(url.query);

  //
  // If the URL is relative, resolve the pathname against the base URL.
  //
  if (
      relative
    && location.slashes
    && url.pathname.charAt(0) !== '/'
    && (url.pathname !== '' || location.pathname !== '')
  ) {
    url.pathname = resolve(url.pathname, location.pathname);
  }

  //
  // We should not add port numbers if they are already the default port number
  // for a given protocol. As the host also contains the port number we're going
  // override it with the hostname which contains no port number.
  //
  if (!required(url.port, url.protocol)) {
    url.host = url.hostname;
    url.port = '';
  }

  //
  // Parse down the `auth` for the username and password.
  //
  url.username = url.password = '';
  if (url.auth) {
    instruction = url.auth.split(':');
    url.username = instruction[0] || '';
    url.password = instruction[1] || '';
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  //
  // The href is just the compiled result.
  //
  url.href = url.toString();
}

/**
 * This is convenience method for changing properties in the URL instance to
 * insure that they all propagate correctly.
 *
 * @param {String} part          Property we need to adjust.
 * @param {Mixed} value          The newly assigned value.
 * @param {Boolean|Function} fn  When setting the query, it will be the function
 *                               used to parse the query.
 *                               When setting the protocol, double slash will be
 *                               removed from the final url if it is true.
 * @returns {URL}
 * @api public
 */
URL.prototype.set = function set(part, value, fn) {
  var url = this;

  switch (part) {
    case 'query':
      if ('string' === typeof value && value.length) {
        value = (fn || qs.parse)(value);
      }

      url[part] = value;
      break;

    case 'port':
      url[part] = value;

      if (!required(value, url.protocol)) {
        url.host = url.hostname;
        url[part] = '';
      } else if (value) {
        url.host = url.hostname +':'+ value;
      }

      break;

    case 'hostname':
      url[part] = value;

      if (url.port) value += ':'+ url.port;
      url.host = value;
      break;

    case 'host':
      url[part] = value;

      if (/:\d+$/.test(value)) {
        value = value.split(':');
        url.port = value.pop();
        url.hostname = value.join(':');
      } else {
        url.hostname = value;
        url.port = '';
      }

      break;

    case 'protocol':
      url.protocol = value.toLowerCase();
      url.slashes = !fn;
      break;

    case 'pathname':
      url.pathname = value.length && value.charAt(0) !== '/' ? '/' + value : value;

      break;

    default:
      url[part] = value;
  }

  for (var i = 0; i < rules.length; i++) {
    var ins = rules[i];

    if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  url.href = url.toString();

  return url;
};

/**
 * Transform the properties back in to a valid and full URL string.
 *
 * @param {Function} stringify Optional query stringify function.
 * @returns {String}
 * @api public
 */
URL.prototype.toString = function toString(stringify) {
  if (!stringify || 'function' !== typeof stringify) stringify = qs.stringify;

  var query
    , url = this
    , protocol = url.protocol;

  if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';

  var result = protocol + (url.slashes ? '//' : '');

  if (url.username) {
    result += url.username;
    if (url.password) result += ':'+ url.password;
    result += '@';
  }

  result += url.host + url.pathname;

  query = 'object' === typeof url.query ? stringify(url.query) : url.query;
  if (query) result += '?' !== query.charAt(0) ? '?'+ query : query;

  if (url.hash) result += url.hash;

  return result;
};

//
// Expose the URL parser and some additional properties that might be useful for
// others or testing.
//
URL.extractProtocol = extractProtocol;
URL.location = lolcation;
URL.qs = qs;

module.exports = URL;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals Services */


let usablePerfObj;

// if we're running in an addon module
if (typeof Window === "undefined") {
  const {Cu} = __webpack_require__(0);
  Cu.import("resource://gre/modules/Services.jsm");

  // Borrow the high-resolution timer from the hidden window....
  usablePerfObj = Services.appShell.hiddenDOMWindow.performance;
} else { // we must be running in content space
  usablePerfObj = performance;
}

function _AbsPerf() {
}
_AbsPerf.prototype = {
  /**
   * Drop in replacement for Date.now, using performance.now to get monotonic
   * high resolution timing.  Useful since we need to be able to do math with
   * timestamps obtained both in chrome (from the hidden window) and in
   * content.  At some point, we may want to replace/augment this with
   * something that returns even higher precision (non-integer ms, since
   * Performance.now is supposed to offer 5us granularity).
   *
   * @return {Number} Milliseconds since the UNIX epoch, rounded to the nearest
   * integer.
   *
   */
  now: function now() {
    return Math.round(usablePerfObj.timing.navigationStart + usablePerfObj.now());
  }
};

module.exports = {
  absPerf: new _AbsPerf(),  // a singleton
  _AbsPerf
};


/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("sdk/preferences/event-target");

/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = require("sdk/tabs");

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals module */


const urlParse = __webpack_require__(9);

/**
 * Convert a hex color string to the RGB form, e.g. #0A0102 => [10, 1, 2]
 */
function hexToRGB(hex) {
  if (!hex) {
    return hex;
  }
  let hexToConvert = hex;
  // if the hex is in shorthand form, expand it first
  if (/^#?([a-f\d])([a-f\d])([a-f\d])$/i.test(hexToConvert)) {
    const expandedHex = [...hex].slice(1, 4).map(item => `${item}${item}`).join("");
    hexToConvert = `#${expandedHex}`;
  }
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexToConvert);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

/*
 * Consolidate favicons from tippytop, firefox, and our own metadata. Tippytop
 * is our number 1 choice, followed by the favicon returned by the metadata service,
 * and finally firefox's data URI as a last resort
 */
function consolidateFavicons(tippyTopFavicon, metadataFavicon, firefoxFavicon) {
  return tippyTopFavicon || metadataFavicon || firefoxFavicon;
}

/*
 * Consolidate the background colors from tippytop, firefox, and our own metadata.
 * TippyTop background color and metadata background color both need to be converted
 * from hex to an rgb array, whereas the firefox background color is already rgb
 */
function consolidateBackgroundColors(tippyTopBackgroundColor, metadataBackgroundColor, firefoxBackgroundColor) {
  return hexToRGB(tippyTopBackgroundColor) || hexToRGB(metadataBackgroundColor) || firefoxBackgroundColor;
}

function extractMetadataFaviconFields(link) {
  let result = {
    url: null,
    height: null,
    width: null,
    color: null
  };
  if (link && link.favicons && link.favicons.length) {
    const favicons = link.favicons[0];
    result.url = favicons.url;
    result.height = favicons.height;
    result.width = favicons.width;
    result.color = favicons.color;
  }
  return result;
}

/**
 * Returns true if the path of the passed in url is "/" or ""
 */
function isRootDomain(url) {
  const path = urlParse(url).pathname;
  return path === "/" || path === "";
}

module.exports = {
  consolidateFavicons,
  consolidateBackgroundColors,
  hexToRGB,
  extractMetadataFaviconFields,
  isRootDomain
};


/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = {
	"ar": {
		"newtab_page_title": "تبويب جديد",
		"default_label_loading": "جارِ التحميل…",
		"header_top_sites": "المواقع الأكثر زيارة"
	},
	"ast": {
		"newtab_page_title": "Llingüeta nueva",
		"default_label_loading": "Cargando…",
		"header_top_sites": "Sitios destacaos",
		"type_label_open": "Abrir",
		"type_label_topic": "Tema",
		"welcome_title": "Bienllegáu/ada a la llingüeta nueva",
		"welcome_body": "Firefox usará esti espaciu p'amosate los marcadores, artículos, vídeos y páxines más relevantes de los que visitares apocayá, asina pues volver a ello de mou cenciellu."
	},
	"az": {
		"newtab_page_title": "Yeni Vərəq",
		"default_label_loading": "Yüklənir…",
		"header_top_sites": "Qabaqcıl Saytlar",
		"header_highlights": "Seçilmişlər",
		"type_label_visited": "Ziyarət edilib",
		"type_label_bookmarked": "Əlfəcinlənib",
		"type_label_synced": "Digər cihazdan sync edilib",
		"type_label_open": "Açıq",
		"type_label_topic": "Mövzu",
		"menu_action_bookmark": "Əlfəcinlə",
		"menu_action_remove_bookmark": "Əlfəcini sil",
		"menu_action_share": "Paylaş",
		"menu_action_copy_address": "Ünvanı köçür",
		"menu_action_email_link": "Keçidi e-poçt ilə göndər…",
		"menu_action_open_new_window": "Yeni Pəncərədə Aç",
		"menu_action_open_private_window": "Yeni Məxfi Pəncərədə Aç",
		"menu_action_dismiss": "Rədd et",
		"menu_action_delete": "Tarixçədən Sil",
		"search_for_something_with": "{search_term} üçün bununla axtar:",
		"search_header": "{search_engine_name} Axtarış",
		"search_web_placeholder": "İnternetdə Axtar",
		"search_settings": "Axtarış Tənzimləmələrini Dəyiş",
		"welcome_title": "Yeni vərəqə xoş gəldiniz",
		"welcome_body": "Firefox bu səhifədə ən uyğun əlfəcin, məqalə, video və son ziyarət etdiyiniz səhifələri göstərərək onları rahat tapmağınıza kömək edəcək.",
		"welcome_label": "Seçilmişləriniz təyin edilir",
		"time_label_less_than_minute": "<1d",
		"time_label_minute": "{number}d",
		"time_label_hour": "{number}s",
		"time_label_day": "{number}g"
	},
	"be": {
		"newtab_page_title": "Новая картка",
		"default_label_loading": "Загрузка…",
		"header_top_sites": "Папулярныя сайты",
		"header_highlights": "Выбранае",
		"type_label_visited": "Наведанае",
		"type_label_bookmarked": "У закладках",
		"type_label_synced": "Сінхранізаванае з іншай прылады",
		"type_label_open": "Адкрыта",
		"type_label_topic": "Тэма",
		"menu_action_bookmark": "У закладкі",
		"menu_action_remove_bookmark": "Выдаліць закладку",
		"menu_action_share": "Падзяліцца",
		"menu_action_copy_address": "Скапіраваць адрас",
		"menu_action_email_link": "Даслаць спасылку…",
		"menu_action_open_new_window": "Адкрыць у новым акне",
		"menu_action_open_private_window": "Адкрыць у новым прыватным акне",
		"menu_action_dismiss": "Адхіліць",
		"menu_action_delete": "Выдаліць з гісторыі",
		"search_for_something_with": "Шукаць {search_term} у:",
		"search_header": "Шукаць у {search_engine_name}",
		"search_web_placeholder": "Пошук у Інтэрнэце",
		"search_settings": "Змяніць налады пошуку",
		"welcome_title": "Калі ласка ў новую картку",
		"welcome_body": "Firefox будзе выкарыстоўваць гэта месца, каб адлюстроўваць самыя актуальныя закладкі, артыкулы, відэа і старонкі, якія вы нядаўна наведалі, каб вы змаглі лёгка трапіць на іх зноў.",
		"welcome_label": "Вызначэнне вашага выбранага",
		"time_label_less_than_minute": "<1 хв",
		"time_label_minute": "{number} хв",
		"time_label_hour": "{number} г",
		"time_label_day": "{number} д"
	},
	"bg": {
		"newtab_page_title": "Нов раздел",
		"default_label_loading": "Зареждане…",
		"header_top_sites": "Най-посещавани",
		"header_highlights": "Акценти",
		"type_label_visited": "Посетена",
		"type_label_bookmarked": "Отметната",
		"type_label_synced": "Синхронизирана от друго устройство",
		"type_label_open": "Отваряне",
		"type_label_topic": "Тема",
		"menu_action_bookmark": "Отметка",
		"menu_action_remove_bookmark": "Премахване на отметка",
		"menu_action_share": "Споделяне",
		"menu_action_copy_address": "Копиране на адрес",
		"menu_action_email_link": "Препратка по ел. поща…",
		"menu_action_open_new_window": "Отваряне в раздел",
		"menu_action_open_private_window": "Отваряне в поверителен прозорец",
		"menu_action_dismiss": "Прекратяване",
		"menu_action_delete": "Премахване от историята",
		"search_for_something_with": "Търсене на {search_term} с:",
		"search_header": "Търсене с {search_engine_name}",
		"search_web_placeholder": "Търсене в интернет",
		"search_settings": "Настройки на търсене",
		"welcome_title": "Добре дошли в нов раздел",
		"welcome_body": "Firefox ще използва това място, за да ви покаже най-подходящите отметки, статии, видео и страници, които сте посетили наскоро, така че да се върнете към тях лесно.",
		"welcome_label": "Търсене на акценти",
		"time_label_less_than_minute": "<1м",
		"time_label_minute": "{number} м",
		"time_label_hour": "{number} ч",
		"time_label_day": "{number} д"
	},
	"ca": {
		"newtab_page_title": "Pestanya nova",
		"default_label_loading": "S'està carregant…",
		"header_top_sites": "Llocs principals",
		"header_highlights": "Destacats",
		"type_label_visited": "Visitats",
		"type_label_bookmarked": "A les adreces d'interès",
		"type_label_synced": "Sincronitzat des d'un altre dispositiu",
		"type_label_open": "Obert",
		"type_label_topic": "Tema",
		"menu_action_bookmark": "Afegeix a les adreces d'interès",
		"menu_action_remove_bookmark": "Elimina l'adreça d'interès",
		"menu_action_share": "Comparteix",
		"menu_action_copy_address": "Copia l'adreça",
		"menu_action_email_link": "Envia l'enllaç per correu…",
		"menu_action_open_new_window": "Obre en una finestra nova",
		"menu_action_open_private_window": "Obre en una finestra privada nova",
		"menu_action_dismiss": "Descarta",
		"menu_action_delete": "Elimina de l'historial",
		"search_for_something_with": "Cerca {search_term} amb:",
		"search_header": "Cerca de {search_engine_name}",
		"search_web_placeholder": "Cerca al web",
		"search_settings": "Canvia els paràmetres de cerca",
		"welcome_title": "Us donem la benvinguda a la pestanya nova",
		"welcome_body": "El Firefox utilitzarà aquest espai per mostrar-vos les adreces d'interès, els articles i els vídeos més rellevants, així com les pàgines que heu visitat recentment, per tal que hi pugueu accedir fàcilment.",
		"welcome_label": "S'estan identificant els vostres llocs destacats",
		"time_label_less_than_minute": "<1 m",
		"time_label_minute": "{number} m",
		"time_label_hour": "{number} h",
		"time_label_day": "{number} d"
	},
	"cs": {
		"newtab_page_title": "Nový panel",
		"default_label_loading": "Načítání…",
		"header_top_sites": "Top stránky",
		"header_highlights": "Vybrané",
		"type_label_visited": "Navštívené",
		"type_label_bookmarked": "V záložkách",
		"type_label_synced": "Synchronizované z jiného zařízení",
		"type_label_open": "Otevřené",
		"type_label_topic": "Téma",
		"menu_action_bookmark": "Přidat do záložek",
		"menu_action_remove_bookmark": "Odebrat záložku",
		"menu_action_share": "Sdílet",
		"menu_action_copy_address": "Zkopírovat adresu",
		"menu_action_email_link": "Poslat odkaz…",
		"menu_action_open_new_window": "Otevřít v novém okně",
		"menu_action_open_private_window": "Otevřít v novém anonymním okně",
		"menu_action_dismiss": "Skrýt",
		"menu_action_delete": "Smazat z historie",
		"search_for_something_with": "Vyhledat {search_term} s:",
		"search_header": "Vyhledat pomocí {search_engine_name}",
		"search_web_placeholder": "Hledat na webu",
		"search_settings": "Změnit nastavení vyhledávání",
		"welcome_title": "Vítejte na stránce nového panelu",
		"welcome_body": "Tady Firefox zobrazí nejrelevantnější záložky, články, videa a stránky, které jste nedávno navštívili. Návrat k nim je tak velmi jednoduchý.",
		"welcome_label": "Rozpoznávání Vybraných stránek",
		"time_label_less_than_minute": "< 1 min",
		"time_label_minute": "{number} min",
		"time_label_hour": "{number} h",
		"time_label_day": "{number} d"
	},
	"de": {
		"newtab_page_title": "Neuer Tab",
		"default_label_loading": "Wird geladen…",
		"header_top_sites": "Meistbesuchte Seiten",
		"header_highlights": "Wichtige Seiten",
		"type_label_visited": "Besucht",
		"type_label_bookmarked": "Lesezeichen",
		"type_label_synced": "Von anderem Gerät synchronisiert",
		"type_label_open": "Geöffnet",
		"type_label_topic": "Thema",
		"menu_action_bookmark": "Lesezeichen",
		"menu_action_remove_bookmark": "Lesezeichen entfernen",
		"menu_action_share": "Teilen",
		"menu_action_copy_address": "Adresse kopieren",
		"menu_action_email_link": "Link per E-Mail versenden…",
		"menu_action_open_new_window": "In neuem Fenster öffnen",
		"menu_action_open_private_window": "In neuem privaten Fenster öffnen",
		"menu_action_dismiss": "Schließen",
		"menu_action_delete": "Aus Chronik löschen",
		"search_for_something_with": "Nach {search_term} suchen mit:",
		"search_header": "{search_engine_name}-Suche",
		"search_web_placeholder": "Das Web durchsuchen",
		"search_settings": "Sucheinstellungen ändern",
		"welcome_title": "Willkommen im neuen Tab",
		"welcome_body": "Firefox nutzt diesen Bereich, um Ihnen Ihre wichtigsten Lesezeichen, Artikel, Videos und kürzlich besuchte Seiten anzuzeigen, damit Sie diese einfach wiederfinden.",
		"welcome_label": "Auswahl Ihrer wichtigsten Seiten",
		"time_label_less_than_minute": "< 1 min",
		"time_label_minute": "{number} m",
		"time_label_hour": "{number} h",
		"time_label_day": "{number} t"
	},
	"dsb": {
		"newtab_page_title": "Nowy rejtark",
		"default_label_loading": "Zacytujo se…",
		"header_top_sites": "Nejcesćej woglědane sedła",
		"header_highlights": "Wjerški",
		"type_label_visited": "Woglědany",
		"type_label_bookmarked": "Ako cytańske znamje skłaźony",
		"type_label_synced": "Z drugego rěda synchronizěrowany",
		"type_label_open": "Wócynjony",
		"type_label_topic": "Tema",
		"menu_action_bookmark": "Ako cytańske znamje składowaś",
		"menu_action_remove_bookmark": "Cytańske znamje wótpóraś",
		"menu_action_share": "Źěliś",
		"menu_action_copy_address": "Adresu kopěrowaś",
		"menu_action_email_link": "Wótkaz e-mailowaś…",
		"menu_action_open_new_window": "W nowem woknje wócyniś",
		"menu_action_open_private_window": "W nowem priwatnem woknje wócyniś",
		"menu_action_dismiss": "Zachyśiś",
		"menu_action_delete": "Z historije lašowaś",
		"search_for_something_with": "Za {search_term} pytaś z:",
		"search_header": "Z {search_engine_name} pytaś",
		"search_web_placeholder": "Web pśepytaś",
		"search_settings": "Pytańske nastajenja změniś",
		"welcome_title": "Witajśo k nowemu rejtarkoju",
		"welcome_body": "Firefox buźo toś ten rum wužywaś, aby waše nejwažnjejše cytańske znamjenja, nastawki, wideo a rowno woglědane boki pokazał, aby mógł se lažko k nim wrośiś.",
		"welcome_label": "Wuběranje wašych nejwažnjejšych bokow",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number} m",
		"time_label_hour": "{number} h",
		"time_label_day": ""
	},
	"el": {
		"newtab_page_title": "Νέα καρτέλα",
		"default_label_loading": "Φόρτωση…",
		"header_top_sites": "Κορυφαίες ιστοσελίδες",
		"header_highlights": "Κορυφαίες στιγμές",
		"type_label_visited": "Από ιστορικό",
		"type_label_bookmarked": "Από σελιδοδείκτες",
		"type_label_synced": "Συγχρονισμένα από άλλη συσκευή",
		"type_label_open": "Ανοικτό",
		"type_label_topic": "Θέμα",
		"menu_action_bookmark": "Προσθήκη σελιδοδείκτη",
		"menu_action_remove_bookmark": "Αφαίρεση σελιδοδείκτη",
		"menu_action_share": "Κοινή χρήση",
		"menu_action_copy_address": "Αντιγραφή διεύθυνσης",
		"menu_action_email_link": "Αποστολή συνδέσμου…",
		"menu_action_open_new_window": "Άνοιγμα σε νέο παράθυρο",
		"menu_action_open_private_window": "Άνοιγμα σε νέο ιδιωτικό παράθυρο",
		"menu_action_dismiss": "Απόρριψη",
		"menu_action_delete": "Διαγραφή από ιστορικό",
		"search_for_something_with": "Αναζήτηση για {search_term} με:",
		"search_header": "Αναζήτηση {search_engine_name}",
		"search_web_placeholder": "Αναζήτηση στον ιστό",
		"search_settings": "Αλλαγή ρυθμίσεων αναζήτησης",
		"welcome_title": "Καλώς ορίσατε στη νέα καρτέλα",
		"welcome_body": "Το Firefox θα χρησιμοποιήσει αυτό το χώρο για να εμφανίσει τους πιο σχετικούς σελιδοδείκτες, άρθρα, βίντεο και σελίδες που επισκεφθήκατε πρόσφατα, ώστε να έχετε εύκολη πρόσβαση.",
		"welcome_label": "Αναγνώριση κορυφαίων στιγμών",
		"time_label_less_than_minute": "<1λ",
		"time_label_minute": "{number}λ",
		"time_label_hour": "{number}ώ",
		"time_label_day": "{number}η"
	},
	"en-US": {
		"newtab_page_title": "New Tab",
		"default_label_loading": "Loading…",
		"header_top_sites": "Top Sites",
		"header_highlights": "Highlights",
		"type_label_visited": "Visited",
		"type_label_bookmarked": "Bookmarked",
		"type_label_synced": "Synced from another device",
		"type_label_open": "Open",
		"type_label_topic": "Topic",
		"menu_action_bookmark": "Bookmark",
		"menu_action_remove_bookmark": "Remove Bookmark",
		"menu_action_copy_address": "Copy Address",
		"menu_action_email_link": "Email Link…",
		"menu_action_open_new_window": "Open in a New Window",
		"menu_action_open_private_window": "Open in a New Private Window",
		"menu_action_dismiss": "Dismiss",
		"menu_action_delete": "Delete from History",
		"search_for_something_with": "Search for {search_term} with:",
		"search_header": "{search_engine_name} Search",
		"search_web_placeholder": "Search the Web",
		"search_settings": "Change Search Settings",
		"welcome_title": "Welcome to new tab",
		"welcome_body": "Firefox will use this space to show your most relevant bookmarks, articles, videos, and pages you’ve recently visited, so you can get back to them easily.",
		"welcome_label": "Identifying your Highlights",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"es-AR": {
		"newtab_page_title": "Nueva pestaña",
		"default_label_loading": "Cargando…",
		"header_top_sites": "Más visitados",
		"header_highlights": "Destacados",
		"type_label_visited": "Visitados",
		"type_label_bookmarked": "Marcados",
		"type_label_synced": "Sincronizados de otro dispositivo",
		"type_label_open": "Abrir",
		"type_label_topic": "Tópico",
		"menu_action_bookmark": "Marcador",
		"menu_action_remove_bookmark": "Eliminar marcador",
		"menu_action_share": "Compartir",
		"menu_action_copy_address": "Copiar dirección",
		"menu_action_email_link": "Enlace por correo electrónico…",
		"menu_action_open_new_window": "Abrir en nueva ventana",
		"menu_action_open_private_window": "Abrir en nueva ventana privada",
		"menu_action_dismiss": "Descartar",
		"menu_action_delete": "Borrar del historial",
		"search_for_something_with": "Buscar {search_term} con:",
		"search_header": "Buscar con {search_engine_name}",
		"search_web_placeholder": "Buscar en la web",
		"search_settings": "Cambiar opciones de búsqueda",
		"welcome_title": "Bienvenido a una nueva pestaña",
		"welcome_body": "Firefox usará este espacio para mostrar sus marcadores, artículos, videos y páginas más relevantes que se hayan visitado para poder volver más fácilmente.",
		"welcome_label": "Identificar los destacados",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"es-CL": {
		"newtab_page_title": "Nueva pestaña",
		"default_label_loading": "Cargando…",
		"header_top_sites": "Sitios frecuentes",
		"header_highlights": "Destacados",
		"type_label_visited": "Visitado",
		"type_label_bookmarked": "Marcado",
		"type_label_synced": "Sacado de otro dispositivo",
		"type_label_open": "Abrir",
		"type_label_topic": "Tema",
		"menu_action_bookmark": "Marcador",
		"menu_action_remove_bookmark": "Remover marcador",
		"menu_action_share": "Compartir",
		"menu_action_copy_address": "Copiar dirección",
		"menu_action_email_link": "Enviar enlace por correo",
		"menu_action_open_new_window": "Abrir en una nueva ventana",
		"menu_action_open_private_window": "Abrir en una nueva ventana privada",
		"menu_action_dismiss": "Descartar",
		"menu_action_delete": "Eliminar del historial",
		"search_for_something_with": "Buscar {search_term} con:",
		"search_header": "Búsqueda de {search_engine_name}",
		"search_web_placeholder": "Buscar en la Web",
		"search_settings": "Cambiar ajustes de búsqueda",
		"welcome_title": "Bienvenido a la nueva pestaña",
		"welcome_body": "Firefox usará este espacio para mostrarte los marcadores, artículos, videos y páginas visitadas recientemente más relevantes, para que puedas regresar a ellos de una.",
		"welcome_label": "Identificando tus destacados",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"es-ES": {
		"newtab_page_title": "Nueva pestaña",
		"default_label_loading": "Cargando…",
		"header_top_sites": "Sitios favoritos",
		"header_highlights": "Destacados",
		"type_label_visited": "Visitados",
		"type_label_bookmarked": "En marcadores",
		"type_label_synced": "Sincronizado desde otro dispositivo",
		"type_label_open": "Abrir",
		"type_label_topic": "Tema",
		"menu_action_bookmark": "Marcador",
		"menu_action_remove_bookmark": "Eliminar marcador",
		"menu_action_share": "Compartir",
		"menu_action_copy_address": "Copiar dirección",
		"menu_action_email_link": "Enviar enlace…",
		"menu_action_open_new_window": "Abrir en una nueva ventana",
		"menu_action_open_private_window": "Abrir en una nueva ventana privada",
		"menu_action_dismiss": "Ignorar",
		"menu_action_delete": "Eliminar del historial",
		"search_for_something_with": "Buscar {search_term} con:",
		"search_header": "Búsqueda de {search_engine_name}",
		"search_web_placeholder": "Buscar en la Web",
		"search_settings": "Cambiar ajustes de búsqueda",
		"welcome_title": "Bienvenido a la nueva pestaña",
		"welcome_body": "Firefox utilizará este espacio para mostrarte los marcadores, artículos y vídeos más relevantes y las páginas que has visitado recientemente, para que puedas acceder más rápido.",
		"welcome_label": "Identificar lo más destacado para ti",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"es-MX": {
		"newtab_page_title": "Nueva pestaña",
		"default_label_loading": "Cargando…",
		"header_top_sites": "Sitios favoritos",
		"header_highlights": "Destacados",
		"type_label_visited": "Visitados",
		"type_label_bookmarked": "Marcados",
		"type_label_synced": "Sincronizado desde otro dispositivo",
		"type_label_open": "Abrir",
		"type_label_topic": "Tópico",
		"menu_action_bookmark": "Marcador",
		"menu_action_remove_bookmark": "Eliminar marcador",
		"menu_action_share": "Compartir",
		"menu_action_copy_address": "Copiar dirección",
		"menu_action_email_link": "Enlace por correo electrónico…",
		"menu_action_open_new_window": "Abrir en una Nueva Ventana",
		"menu_action_open_private_window": "Abrir en una Nueva Ventana Privada",
		"menu_action_dismiss": "Descartar",
		"menu_action_delete": "Eliminar del historial",
		"search_for_something_with": "Buscar {search_term} con:",
		"search_header": "Buscar {search_engine_name}",
		"search_web_placeholder": "Buscar en la Web",
		"search_settings": "Cambiar configuraciones de búsqueda",
		"welcome_title": "Bienvenido a una nueva pestaña",
		"welcome_body": "Firefox usará este espacio para mostrar tus marcadores, artículos, videos y páginas más relevantes que se hayan visitado para poder volver más fácilmente.",
		"welcome_label": "Identificando tus destacados",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"et": {
		"newtab_page_title": "Uus kaart",
		"default_label_loading": "Laadimine…",
		"header_top_sites": "Top saidid",
		"header_highlights": "Esiletõstetud",
		"type_label_visited": "Külastatud",
		"type_label_bookmarked": "Järjehoidjatest",
		"type_label_synced": "Sünkroniseeritud teisest seadmest",
		"type_label_open": "Avatud",
		"type_label_topic": "Teema",
		"menu_action_bookmark": "Lisa järjehoidjatesse",
		"menu_action_remove_bookmark": "Eemalda järjehoidja",
		"menu_action_share": "Jaga",
		"menu_action_copy_address": "Kopeeri aadress",
		"menu_action_email_link": "Saada link e-postiga…",
		"menu_action_open_new_window": "Ava uues aknas",
		"menu_action_open_private_window": "Ava uues privaatses aknas",
		"menu_action_dismiss": "Peida",
		"menu_action_delete": "Kustuta ajaloost",
		"search_for_something_with": "Otsi fraasi {search_term}, kasutades otsingumootorit:",
		"search_header": "{search_engine_name}",
		"search_web_placeholder": "Otsi veebist",
		"search_settings": "Muuda otsingu sätteid",
		"welcome_title": "Tere tulemast uuele kaardile",
		"welcome_body": "Firefox kasutab seda lehte, et kuvada sulle kõige olulisemaid järjehoidjaid, artikleid, videoid ja lehti, mida oled hiljuti külastanud, nii et pääseksid kergelt nende juurde tagasi.",
		"welcome_label": "Esiletõstetava sisu tuvastamine",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}t",
		"time_label_day": "{number}p"
	},
	"fi": {
		"newtab_page_title": "Uusi välilehti",
		"default_label_loading": "Ladataan…",
		"header_top_sites": "Ykkössivustot",
		"header_highlights": "Nostot",
		"type_label_visited": "Vierailtu",
		"type_label_bookmarked": "Kirjanmerkki",
		"type_label_synced": "Synkronoitu toiselta laitteelta",
		"type_label_open": "Avoin",
		"type_label_topic": "Aihe",
		"menu_action_bookmark": "Lisää kirjanmerkki",
		"menu_action_remove_bookmark": "Poista kirjanmerkki",
		"menu_action_share": "Jaa",
		"menu_action_copy_address": "Kopioi osoite",
		"menu_action_email_link": "Lähetä linkki…",
		"menu_action_open_new_window": "Avaa uuteen ikkunaan",
		"menu_action_open_private_window": "Avaa uuteen yksityiseen ikkunaan",
		"menu_action_dismiss": "Hylkää",
		"menu_action_delete": "Poista historiasta",
		"search_for_something_with": "Hae {search_term} palvelusta:",
		"search_header": "{search_engine_name}-haku",
		"search_web_placeholder": "Verkkohaku",
		"search_settings": "Muuta hakuasetuksia",
		"welcome_title": "Tervetuloa uuteen välilehteen",
		"welcome_body": "Firefox käyttää tätä tilaa näyttämään olennaisimmat kirjanmerkit, artikkelit, videot ja sivut, joita olet katsellut, jotta pääset niihin takaisin nopeasti.",
		"welcome_label": "Tunnistetaan nostojasi",
		"time_label_less_than_minute": "<1 min",
		"time_label_minute": "{number} min",
		"time_label_hour": "{number} h",
		"time_label_day": "{number} pv"
	},
	"fr": {
		"newtab_page_title": "Nouvel onglet",
		"default_label_loading": "Chargement…",
		"header_top_sites": "Sites les plus visités",
		"header_highlights": "Éléments-clés",
		"type_label_visited": "Visité",
		"type_label_bookmarked": "Ajouté aux marque-pages",
		"type_label_synced": "Synchronisé depuis un autre appareil",
		"type_label_open": "Ouvert",
		"type_label_topic": "Thème",
		"menu_action_bookmark": "Marquer cette page",
		"menu_action_remove_bookmark": "Supprimer le marque-page",
		"menu_action_share": "Partager",
		"menu_action_copy_address": "Copier l’adresse",
		"menu_action_email_link": "Envoyer un lien par courriel…",
		"menu_action_open_new_window": "Ouvrir dans une nouvelle fenêtre",
		"menu_action_open_private_window": "Ouvrir dans une nouvelle fenêtre privée",
		"menu_action_dismiss": "Retirer",
		"menu_action_delete": "Supprimer de l’historique",
		"search_for_something_with": "Recherche pour {search_term} avec :",
		"search_header": "Recherche {search_engine_name}",
		"search_web_placeholder": "Rechercher sur le Web",
		"search_settings": "Paramètres de recherche",
		"welcome_title": "Bienvenue sur la page Nouvel onglet",
		"welcome_body": "Firefox utilisera cet espace pour afficher des éléments pertinents, comme des marque-pages, des articles, des vidéos, et des pages que vous avez visitées, afin que vous les retrouviez facilement.",
		"welcome_label": "Identification des éléments-clés",
		"time_label_less_than_minute": "<1 min",
		"time_label_minute": "{number} min",
		"time_label_hour": "{number} h",
		"time_label_day": "{number} j"
	},
	"fy-NL": {
		"newtab_page_title": "Nij ljepblêd",
		"default_label_loading": "Lade…",
		"header_top_sites": "Topwebsites",
		"header_highlights": "Hichtepunten",
		"type_label_visited": "Besocht",
		"type_label_bookmarked": "Blêdwizer makke",
		"type_label_synced": "Syngronisearre fan oar apparaat ôf",
		"type_label_open": "Open",
		"type_label_topic": "Underwerp",
		"menu_action_bookmark": "Blêdwizer",
		"menu_action_remove_bookmark": "Blêdwizer fuortsmite",
		"menu_action_share": "Diele",
		"menu_action_copy_address": "Adres kopiearje",
		"menu_action_email_link": "Keppeling e-maile…",
		"menu_action_open_new_window": "Iepenje yn in nij finster",
		"menu_action_open_private_window": "Iepenje yn in nij priveefinster",
		"menu_action_dismiss": "Fuortsmite",
		"menu_action_delete": "Fuortsmite út skiednis",
		"search_for_something_with": "Sykje nei {search_term} mei:",
		"search_header": "{search_engine_name} trochsykje",
		"search_web_placeholder": "Sykje op it web",
		"search_settings": "Sykynstellingen wizigje",
		"welcome_title": "Wolkom by it nije ljepblêd",
		"welcome_body": "Firefox brûkt dizze romte om jo meast relevante blêdwizers, artikelen, fideo’s en siden dy't jo koartlyn besocht hawwe wer te jaan, sadat jo dizze ienfâldichwei weromfine kinne.",
		"welcome_label": "Jo hichtepunten oantsjutte",
		"time_label_less_than_minute": "< 1 m",
		"time_label_minute": "{number} m",
		"time_label_hour": "{number} o",
		"time_label_day": "{number} d"
	},
	"ga-IE": {
		"newtab_page_title": "Cluaisín Nua",
		"default_label_loading": "Á Luchtú…",
		"header_top_sites": "Barrshuímh",
		"header_highlights": "Buaicphointí",
		"type_label_visited": "Feicthe",
		"type_label_bookmarked": "Leabharmharcáilte",
		"type_label_synced": "Sioncronaithe ó ghléas eile",
		"type_label_open": "Oscailte",
		"type_label_topic": "Ábhar",
		"menu_action_bookmark": "Cruthaigh leabharmharc",
		"menu_action_remove_bookmark": "Scrios Leabharmharc",
		"menu_action_share": "Comhroinn",
		"menu_action_copy_address": "Cóipeáil an Seoladh",
		"menu_action_email_link": "Seol an Nasc trí Ríomhphost…",
		"menu_action_open_new_window": "Oscail i bhFuinneog Nua",
		"menu_action_open_private_window": "Oscail i bhFuinneog Nua Phríobháideach",
		"menu_action_dismiss": "Ruaig",
		"menu_action_delete": "Scrios ón Stair",
		"search_for_something_with": "Déan cuardach ar {search_term} le:",
		"search_header": "Cuardach {search_engine_name}",
		"search_web_placeholder": "Cuardaigh an Gréasán",
		"search_settings": "Socruithe Cuardaigh",
		"welcome_title": "Fáilte go dtí cluaisín nua",
		"welcome_body": "Úsáidfidh Firefox an spás seo chun na leabharmharcanna, ailt, físeáin, agus leathanaigh is tábhachtaí a thaispeáint duit, ionas go mbeidh tú in ann filleadh orthu gan stró.",
		"welcome_label": "Buaicphointí á lorg",
		"time_label_less_than_minute": "< 1 n",
		"time_label_minute": "{number}n",
		"time_label_hour": "{number}u",
		"time_label_day": "{number}l"
	},
	"gd": {
		"newtab_page_title": "Taba ùr",
		"default_label_loading": "’Ga luchdadh…",
		"header_top_sites": "Brod nan làrach",
		"header_highlights": "Highlights",
		"type_label_visited": "Na thadhail thu air",
		"type_label_bookmarked": "’Nan comharran-lìn",
		"type_label_synced": "Sioncronaichte o uidheam eile",
		"type_label_open": "Fosgailte",
		"type_label_topic": "Cuspair",
		"menu_action_bookmark": "Comharra-lìn",
		"menu_action_remove_bookmark": "Thoir an comharra-lìn air falbh",
		"menu_action_share": "Co-roinn",
		"menu_action_copy_address": "Dèan lethbhreac dhen t-seòladh",
		"menu_action_email_link": "Cuir an ceangal air a’ phost-d…",
		"menu_action_open_new_window": "Fosgail ann an uinneag ùr",
		"menu_action_open_private_window": "Fosgail ann an uinneag phrìobhaideach ùr",
		"menu_action_dismiss": "Leig seachad",
		"menu_action_delete": "Sguab às an eachdraidh",
		"search_for_something_with": "Lorg {search_term} le:",
		"search_header": "Lorg le {search_engine_name}",
		"search_web_placeholder": "Lorg air an lìon",
		"search_settings": "Atharraich roghainnean an luirg",
		"welcome_title": "Fàilte gun taba ùr",
		"welcome_body": "Seallaidh Firefox na comharran-lìn, artaigealan, videothan is duilleagan as iomchaidhe dhut, an fheadhainn air an do thadhail thu o chionn goirid, ach an ruig thu iad gu luath.",
		"welcome_label": "Ag aithneachadh nan highlights agad",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}u",
		"time_label_day": "{number}l"
	},
	"he": {
		"newtab_page_title": "לשונית חדשה",
		"default_label_loading": "בטעינה…",
		"header_top_sites": "אתרים מובילים",
		"type_label_visited": "ביקורים קודמים",
		"type_label_bookmarked": "נוצרה סימניה",
		"type_label_synced": "סונכרן מהתקן אחר",
		"type_label_open": "פתיחה",
		"type_label_topic": "נושא",
		"menu_action_bookmark": "סימניה",
		"menu_action_remove_bookmark": "הסרת סימניה",
		"menu_action_share": "שיתוף",
		"menu_action_copy_address": "העתקת כתובת",
		"menu_action_email_link": "שליחת קישור בדוא״ל…",
		"menu_action_open_new_window": "פתיחה בחלון חדש",
		"menu_action_open_private_window": "פתיחה בלשונית פרטית חדשה",
		"menu_action_dismiss": "ביטול",
		"menu_action_delete": "מחיקה מההיסטוריה",
		"search_for_something_with": "חיפוש אחר {search_term} עם:",
		"search_header": "חיפוש ב־{search_engine_name}",
		"search_web_placeholder": "חיפוש ברשת",
		"search_settings": "שינוי הגדרות חיפוש",
		"welcome_title": "ברוכים הבאים לדף הלשונית החדשה",
		"welcome_body": "Firefox ישתמש באזור זה כדי להציג את הסימניות הרלוונטיות ביותר, מאמרים, סרטוני וידאו ודפים שביקרת בהם לאחרונה, כך שניתן יהיה לגשת אליהם שוב בקלות.",
		"time_label_less_than_minute": "פחות מדקה",
		"time_label_minute": "{number} דקות",
		"time_label_hour": "{number} שעות",
		"time_label_day": "{number} ימים"
	},
	"hr": {
		"newtab_page_title": "Nova kartica",
		"default_label_loading": "Učitavanje…",
		"header_top_sites": "Najbolje stranice",
		"header_highlights": "Istaknuto",
		"type_label_visited": "Posjećeno",
		"type_label_bookmarked": "Zabilježeno",
		"type_label_synced": "Sinkronizirano s drugog uređaja",
		"type_label_open": "Otvori",
		"type_label_topic": "Tema",
		"menu_action_bookmark": "Zabilježi stranicu",
		"menu_action_remove_bookmark": "Ukloni zabilješku",
		"menu_action_share": "Podijeli",
		"menu_action_copy_address": "Kopiraj adresu",
		"menu_action_email_link": "Pošalji poveznicu e-poštom…",
		"menu_action_open_new_window": "Otvori u novom prozoru",
		"menu_action_open_private_window": "Otvori u novom privatnom prozoru",
		"menu_action_dismiss": "Odbaci",
		"menu_action_delete": "Obriši iz povijesti",
		"search_for_something_with": "Traži {search_term} s:",
		"search_header": "{search_engine_name} pretraživanje",
		"search_web_placeholder": "Pretraži web",
		"search_settings": "Promijeni postavke pretraživanja",
		"welcome_title": "Dobro došli u novu karticu",
		"welcome_body": "Firefox će koristiti ovaj prostor kako bi vam pokazao najbitnije zabilješke, članke, video uratke i stranice koje ste nedavno posjetili, tako da se možete lako vratiti na njih.",
		"welcome_label": "Identificiranje istaknutog",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"hsb": {
		"newtab_page_title": "Nowy rajtark",
		"default_label_loading": "Začituje so…",
		"header_top_sites": "Najhusćišo wopytane sydła",
		"header_highlights": "Wjerški",
		"type_label_visited": "Wopytany",
		"type_label_bookmarked": "Jako zapołožka składowany",
		"type_label_synced": "Z druheho grata synchronizowany",
		"type_label_open": "Wočinjeny",
		"type_label_topic": "Tema",
		"menu_action_bookmark": "Zapołožki składować",
		"menu_action_remove_bookmark": "Zapołožku wotstronić",
		"menu_action_share": "Dźělić",
		"menu_action_copy_address": "Adresu kopěrować",
		"menu_action_email_link": "Wotkaz e-mejlować…",
		"menu_action_open_new_window": "W nowym woknje wočinić",
		"menu_action_open_private_window": "W nowym priwatnym woknje wočinić",
		"menu_action_dismiss": "Zaćisnyć",
		"menu_action_delete": "Z historije zhašeć",
		"search_for_something_with": "Za {search_term} pytać z:",
		"search_header": "Z {search_engine_name} pytać",
		"search_web_placeholder": "Web přepytać",
		"search_settings": "Pytanske nastajenja změnić",
		"welcome_title": "Witajće k nowemu rajtarkej",
		"welcome_body": "Firefox budźe tutón rum wužiwać, zo by waše najwažniše zapołožki, nastawki, wideja a runje wopytane strony pokazał, zo byšće móhł so lochko k nim wróćić.",
		"welcome_label": "Wuběranje wašich najwažnišich stronow",
		"time_label_less_than_minute": "< 1 min",
		"time_label_minute": "{number} m",
		"time_label_hour": "{number} h",
		"time_label_day": ""
	},
	"hu": {
		"newtab_page_title": "Új lap",
		"default_label_loading": "Betöltés…",
		"header_top_sites": "Népszerű oldalak",
		"header_highlights": "Kiemelések",
		"type_label_visited": "Látogatott",
		"type_label_bookmarked": "Könyvjelzőzött",
		"type_label_synced": "Másik eszközről szinkronizálva",
		"type_label_open": "Megnyitás",
		"type_label_topic": "Téma",
		"menu_action_bookmark": "Könyvjelzőzés",
		"menu_action_remove_bookmark": "Könyvjelző eltávolítása",
		"menu_action_share": "Megosztás",
		"menu_action_copy_address": "Cím másolása",
		"menu_action_email_link": "Hivatkozás küldése e-mailben…",
		"menu_action_open_new_window": "Megnyitás új ablakban",
		"menu_action_open_private_window": "Megnyitás új privát ablakban",
		"menu_action_dismiss": "Elutasítás",
		"menu_action_delete": "Törlés az előzményekből",
		"search_for_something_with": "„{search_term}” keresése ezzel:",
		"search_header": "{search_engine_name} keresés",
		"search_web_placeholder": "Keresés a weben",
		"search_settings": "Keresési beállítások módosítása",
		"welcome_title": "Üdvözöljük az új lapon",
		"welcome_body": "A Firefox ezt a területet a leginkább releváns könyvjelzők, cikkek, videók és nemrég látogatott oldalak megjelenítésére fogja használni, így könnyedén visszatalálhat hozzájuk.",
		"welcome_label": "A kiemeléseinek azonosítása",
		"time_label_less_than_minute": "<1 p",
		"time_label_minute": "{number} p",
		"time_label_hour": "{number} ó",
		"time_label_day": "{number} n"
	},
	"hy-AM": {
		"newtab_page_title": "Նոր ներդիր",
		"default_label_loading": "Բեռնվում է...",
		"header_top_sites": "Լավագույն կայքեր",
		"header_highlights": "Գունանշում",
		"type_label_visited": "Այցելած",
		"type_label_bookmarked": "Էջանշված",
		"type_label_synced": "Համաժամեցված այլ սարքից",
		"type_label_open": "Բացել",
		"type_label_topic": "Թեմա",
		"menu_action_bookmark": "Էջանիշ",
		"menu_action_remove_bookmark": "Հեռացնել էջանիշը",
		"menu_action_share": "Համաօգտագործել",
		"menu_action_copy_address": "Պատճենել հասցեն",
		"menu_action_email_link": "Ուղարկել հղումը...",
		"menu_action_open_new_window": "Բացել Նոր Պատուհանով",
		"menu_action_open_private_window": "Բացել Նոր Գաղտնի դիտարկմամբ",
		"menu_action_dismiss": "Բաց թողնել",
		"menu_action_delete": "Ջնջել Պատմությունից",
		"search_for_something_with": "Որոնել {search_term}-ը հետևյալով՝",
		"search_header": "{search_engine_name}-ի որոնում",
		"search_web_placeholder": "Որոնել առցանց",
		"search_settings": "Փոխել որոնման կարգավորումները",
		"welcome_title": "Բարի գալուստ նոր ներդիր",
		"welcome_body": "Firefox-ը կօգտագործի այս բացատը՝ ցուցադրելու ձեզ համար առավել կարևոր էջանիշերը, հոդվածները և ձեր այցելած վերջին էջերը, որպեսզի հեշտությամբ վերադառնաք դրանց:",
		"welcome_label": "Նույնացնում է ձեր գունանշումը",
		"time_label_less_than_minute": "<1 ր",
		"time_label_minute": "{number} ր",
		"time_label_hour": "{number} ժ",
		"time_label_day": "{number} օր"
	},
	"id": {
		"newtab_page_title": "Tab Baru",
		"default_label_loading": "Memuat…",
		"header_top_sites": "Situs Teratas",
		"header_highlights": "Sorotan",
		"type_label_visited": "Dikunjungi",
		"type_label_bookmarked": "Dimarkahi",
		"type_label_synced": "Disinkronkan dari perangkat lain",
		"type_label_open": "Buka",
		"type_label_topic": "Topik",
		"menu_action_bookmark": "Markah",
		"menu_action_remove_bookmark": "Hapus Markah",
		"menu_action_share": "Bagikan",
		"menu_action_copy_address": "Salin Alamat",
		"menu_action_email_link": "Emailkan Tautan…",
		"menu_action_open_new_window": "Buka di Jendela Baru",
		"menu_action_open_private_window": "Buka di Jendela Penjelajahan Pribadi Baru",
		"menu_action_dismiss": "Tutup",
		"menu_action_delete": "Hapus dari Riwayat",
		"search_for_something_with": "Cari {search_term} lewat:",
		"search_header": "Pencarian {search_engine_name}",
		"search_web_placeholder": "Cari di Web",
		"search_settings": "Ubah Pengaturan Pencarian",
		"welcome_title": "Selamat datang di tab baru",
		"welcome_body": "Firefox akan menggunakan ruang ini untuk menampilkan markah, artikel, video, dan laman yang baru-baru ini dikunjungi, yang paling relevan agar Anda bisa kembali mengunjunginya dengan mudah.",
		"welcome_label": "Mengidentifikasi Sorotan Anda",
		"time_label_less_than_minute": "<1 mnt",
		"time_label_minute": "{number} mnt",
		"time_label_hour": "{number} jam",
		"time_label_day": "{number} hr"
	},
	"it": {
		"newtab_page_title": "Nuova scheda",
		"default_label_loading": "Caricamento…",
		"header_top_sites": "Siti principali",
		"header_highlights": "In evidenza",
		"type_label_visited": "Visitato",
		"type_label_bookmarked": "Nei segnalibri",
		"type_label_synced": "Sincronizzato da un altro dispositivo",
		"type_label_open": "Apri",
		"type_label_topic": "Argomento",
		"menu_action_bookmark": "Aggiungi ai segnalibri",
		"menu_action_remove_bookmark": "Elimina segnalibro",
		"menu_action_share": "Condividi",
		"menu_action_copy_address": "Copia indirizzo",
		"menu_action_email_link": "Invia link per email…",
		"menu_action_open_new_window": "Apri in una nuova finestra",
		"menu_action_open_private_window": "Apri in una nuova finestra anonima",
		"menu_action_dismiss": "Rimuovi",
		"menu_action_delete": "Elimina dalla cronologia",
		"search_for_something_with": "Cerca {search_term} con:",
		"search_header": "Ricerca {search_engine_name}",
		"search_web_placeholder": "Cerca sul Web",
		"search_settings": "Cambia impostazioni di ricerca",
		"welcome_title": "Benvenuto nella nuova scheda",
		"welcome_body": "Firefox utilizzerà questo spazio per visualizzare gli elementi più significativi, come segnalibri, articoli, video e pagine visitate di recente, in modo che siano sempre facili da raggiungere.",
		"welcome_label": "Identificazione elementi in evidenza…",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}g"
	},
	"ja": {
		"newtab_page_title": "新しいタブ",
		"default_label_loading": "読み込み中...",
		"header_top_sites": "トップサイト",
		"header_highlights": "ハイライト",
		"type_label_visited": "訪問済み",
		"type_label_bookmarked": "ブックマーク",
		"type_label_synced": "他の端末から同期",
		"type_label_open": "開く",
		"type_label_topic": "トピック",
		"menu_action_bookmark": "ブックマーク",
		"menu_action_remove_bookmark": "ブックマークを削除",
		"menu_action_share": "共有",
		"menu_action_copy_address": "URL をコピー",
		"menu_action_email_link": "URL をメールで送信...",
		"menu_action_open_new_window": "新しいウィンドウで開く",
		"menu_action_open_private_window": "新しいプライベートウィンドウで開く",
		"menu_action_dismiss": "閉じる",
		"menu_action_delete": "履歴から削除",
		"search_for_something_with": "{search_term} を検索:",
		"search_header": "{search_engine_name} 検索",
		"search_web_placeholder": "ウェブを検索",
		"search_settings": "検索設定を変更",
		"welcome_title": "新しいタブへようこそ",
		"welcome_body": "Firefox はこのスペースを使って、関連性の高いブックマーク、記事、動画、最近訪れたページを表示し、それらのコンテンツへ簡単に戻れるようにします。",
		"welcome_label": "あなたのハイライトを確認しています",
		"time_label_less_than_minute": "1 分以内",
		"time_label_minute": "{number} 分",
		"time_label_hour": "{number} 時間",
		"time_label_day": "{number} 日"
	},
	"kab": {
		"newtab_page_title": "Iccer amaynut",
		"default_label_loading": "Asali…",
		"header_top_sites": "Ismal ifazen",
		"header_highlights": "Iferdisen tisura",
		"type_label_visited": "Yettwarza",
		"type_label_bookmarked": "Yettwacreḍ",
		"type_label_synced": "Yemtawi seg ibenk-nniḍen",
		"type_label_open": "Yeldi",
		"type_label_topic": "Asentel",
		"menu_action_bookmark": "Creḍ asebter-agi",
		"menu_action_remove_bookmark": "Kkes tacreṭ-agi",
		"menu_action_share": "Bḍu",
		"menu_action_copy_address": "Nɣel tansa",
		"menu_action_email_link": "Azen aseɣwen s yimayl…",
		"menu_action_open_new_window": "Ldei deg usfaylu amaynut",
		"menu_action_open_private_window": "Ldi deg usfaylu uslig amaynut",
		"menu_action_dismiss": "Kkes",
		"menu_action_delete": "Kkes seg umazray",
		"search_for_something_with": "Nadi ɣef {search_term} s:",
		"search_header": "Anadi {search_engine_name}",
		"search_web_placeholder": "Nadi di Web",
		"search_settings": "Snifel iɣewwaṛen n unadi",
		"welcome_title": "Ansuf ar yiccer amaynut",
		"welcome_body": "Firefox ad iseqdec tallunt akken ad d-yesken akk ticraḍ n isebtar iwulmen, imagraden, tividyutin, akked isebtar aniɣer terziḍ melmi kan, ihi tzemreḍ ad d-uɣaleḍ ɣer-sen s wudem fessusen.",
		"welcome_label": "Asulu n iferdisen tisura",
		"time_label_less_than_minute": "<1 n tesdat",
		"time_label_minute": "{number} n tesdatin",
		"time_label_hour": "{number} n isragen",
		"time_label_day": "{number}n wussan"
	},
	"km": {
		"newtab_page_title": "ផ្ទាំង​ថ្មី",
		"default_label_loading": "កំពុង​ផ្ទុក...",
		"header_top_sites": "វិបសាយ​លើ​គេ",
		"header_highlights": "ការ​រំលេច",
		"type_label_visited": "បាន​ចូល​មើល",
		"type_label_bookmarked": "បាន​ចំណាំ",
		"type_label_synced": "បាន​ធ្វើ​សមកាលកម្ម​ពី​ឧបករណ៍​ផ្សេង​ទៀត",
		"type_label_open": "បើក",
		"type_label_topic": "ប្រធានបទ",
		"menu_action_bookmark": "ចំណាំ",
		"menu_action_remove_bookmark": "លុប​ចំណាំ​ចេញ",
		"menu_action_share": "ចែករំលែក",
		"menu_action_copy_address": "ចម្លង​អាសយដ្ឋាន",
		"menu_action_email_link": "តំណ​អ៊ីមែល...",
		"menu_action_open_new_window": "បើក​នៅ​ក្នុង​បង្អួច​ថ្មី",
		"menu_action_open_private_window": "បើក​នៅ​ក្នុង​បង្អួច​ឯកជន​ថ្មី",
		"menu_action_dismiss": "បោះបង់ចោល",
		"menu_action_delete": "លុប​ពី​ប្រវត្តិ",
		"search_for_something_with": "ស្វែងរក {search_term} ជាមួយ៖",
		"search_header": "{search_engine_name} ស្វែងរក",
		"search_web_placeholder": "ស្វែងរក​បណ្ដាញ",
		"search_settings": "ផ្លាស់ប្ដូរ​ការ​កំណត់​ស្វែងរក",
		"welcome_title": "ស្វាគមន៍​មក​កាន់​ផ្ទាំង​ថ្មី",
		"welcome_body": "Firefox នឹង​ប្រើប្រាស់​កន្លែង​ទំនេរ​នេះ ដើម្បី​បង្ហាញ​ចំណាំ អត្ថបទ វីដេអូ និង​ទំព័រ​ដែល​ទាក់ទង​អ្នក​បំផុត ដែល​អ្នក​បាន​ចូល​មើល​ថ្មីៗ​នេះ ដូច្នេះ​អ្នក​អាច​ត្រឡប់​ទៅ​​កាន់​​វា​​វិញ​បាន​យ៉ាងងាយស្រួល។",
		"welcome_label": "កំពុង​បញ្ជាក់​ការ​រំលេច​របស់​អ្នក",
		"time_label_less_than_minute": "<1 នាទី",
		"time_label_minute": "{number} នាទី",
		"time_label_hour": "{number} ម៉ោង",
		"time_label_day": "{number} ថ្ងៃ"
	},
	"ko": {
		"newtab_page_title": "새 탭",
		"default_label_loading": "읽는 중…",
		"header_top_sites": "상위 사이트",
		"header_highlights": "하이라이트",
		"type_label_visited": "방문한 사이트",
		"type_label_bookmarked": "즐겨찾기",
		"type_label_synced": "다른 기기에서 동기화",
		"type_label_open": "열기",
		"type_label_topic": "주제",
		"menu_action_bookmark": "즐겨찾기",
		"menu_action_remove_bookmark": "즐겨찾기 삭제",
		"menu_action_share": "공유",
		"menu_action_copy_address": "주소 복사",
		"menu_action_email_link": "메일로 링크 보내기…",
		"menu_action_open_new_window": "새 창에서 열기",
		"menu_action_open_private_window": "새 사생활 보호 창에서 열기",
		"menu_action_dismiss": "닫기",
		"menu_action_delete": "방문 기록에서 삭제",
		"search_for_something_with": "다음에서 {search_term} 검색:",
		"search_header": "{search_engine_name} 검색",
		"search_web_placeholder": "웹 검색",
		"search_settings": "검색 설정 바꾸기",
		"welcome_title": "새 탭을 소개합니다",
		"welcome_body": "최근에 방문한 관련있는 즐겨찾기나 글, 동영상, 페이지를 Firefox가 여기에 표시해서 쉽게 다시 찾아볼 수 있게 할 것입니다.",
		"welcome_label": "하이라이트 확인",
		"time_label_less_than_minute": "<1분",
		"time_label_minute": "{number}분",
		"time_label_hour": "{number}시",
		"time_label_day": "{number}일"
	},
	"lij": {
		"newtab_page_title": "Neuvo Feuggio",
		"default_label_loading": "Carego…",
		"header_top_sites": "I megio sciti",
		"header_highlights": "In evidensa",
		"type_label_visited": "Vixitou",
		"type_label_bookmarked": "Azonto a-i segnalibbri",
		"type_label_synced": "Scincronizou da 'n atro dispoxitivo",
		"type_label_open": "Arvi",
		"type_label_topic": "Argomento",
		"menu_action_bookmark": "Azonzi a-i segnalibbri",
		"menu_action_remove_bookmark": "Scancella segnalibbro",
		"menu_action_share": "Condividdi",
		"menu_action_copy_address": "Còpia indirisso",
		"menu_action_email_link": "Manda colegamento…",
		"menu_action_open_new_window": "Arvi in neuvo barcon",
		"menu_action_open_private_window": "Arvi in neuvo barcon privou",
		"menu_action_dismiss": "Scancella",
		"menu_action_delete": "Scancella da-a stöia",
		"search_for_something_with": "Çerca {search_term} con:",
		"search_header": "Riçerca {search_engine_name}",
		"search_web_placeholder": "Çerca inta Ræ",
		"search_settings": "Cangia inpostaçioin de riçerca",
		"welcome_title": "Benvegnuo into neuvo feuggio",
		"welcome_body": "Firefox o deuviâ sto spaçio pe mostrâ i elementi ciù scignificativi, comme segnalibbri, articoli, video e pagine vixitatæ da pöco in sa, in mòddo che segian de longo ciù façili da razonze.",
		"welcome_label": "Identificaçion elementi in evidensa",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"ms": {
		"newtab_page_title": "Tab Baru",
		"default_label_loading": "Memuatkan…",
		"header_top_sites": "Laman Teratas",
		"header_highlights": "Serlahan",
		"type_label_visited": "Dilawati",
		"type_label_bookmarked": "Ditandabuku",
		"type_label_synced": "Sync dari peranti lain",
		"type_label_open": "Buka",
		"type_label_topic": "Topik",
		"menu_action_bookmark": "Tandabuku",
		"menu_action_remove_bookmark": "Alihkeluar Tandabuku",
		"menu_action_share": "Kongsi",
		"menu_action_copy_address": "Salin Alamat",
		"menu_action_email_link": "Pautan E-mel…",
		"menu_action_open_new_window": "Buka dalam Tetingkap Baru",
		"menu_action_open_private_window": "Buka dalam Tetingkap Peribadi Baru",
		"menu_action_dismiss": "Abai",
		"menu_action_delete": "Hapuskan sejarah",
		"search_for_something_with": "Cari {search_term} dengan:",
		"search_header": "{search_engine_name} Cari",
		"search_web_placeholder": "Cari dalam Web",
		"search_settings": "Ubah Tetapan Carian",
		"welcome_title": "Selamat Datang ke tab baru",
		"welcome_body": "Firefox akan menggunakan ruang ini untuk mempamerkan tandabuku, artikel, video dan halaman yang paling berkaitan dan terkini anda lawati supaya anda boleh mendapatkannya semula dengan mudah.",
		"welcome_label": "Mengenalpasti Serlahan anda",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"nb-NO": {
		"newtab_page_title": "Ny fane",
		"default_label_loading": "Laster …",
		"header_top_sites": "Mest besøkte nettsider",
		"header_highlights": "Høydepunkter",
		"type_label_visited": "Besøkt",
		"type_label_bookmarked": "Bokmerket",
		"type_label_synced": "Synkronisert fra annen enhet",
		"type_label_open": "Åpne",
		"type_label_topic": "Emne",
		"menu_action_bookmark": "Bokmerke",
		"menu_action_remove_bookmark": "Fjern bokmerke",
		"menu_action_share": "Del",
		"menu_action_copy_address": "Kopier adresse",
		"menu_action_email_link": "Send lenke på e-post …",
		"menu_action_open_new_window": "Åpne i nytt vindu",
		"menu_action_open_private_window": "Åpne i nytt privat vindu",
		"menu_action_dismiss": "Avslå",
		"menu_action_delete": "Slett fra historikk",
		"search_for_something_with": "Søk etter {search_term} med:",
		"search_header": "{search_engine_name}-søk",
		"search_web_placeholder": "Søk på nettet",
		"search_settings": "Endre søkeinnstillinger",
		"welcome_title": "Velkommen til ny fane",
		"welcome_body": "Firefox vil bruke denne plassen til å vise deg de mest relevante bokmerkene, artiklene, videoene og sidene du nettopp har besøkt, slik at du enkelt kan finne tilbake til de.",
		"welcome_label": "Identifiserer dine høydepunkter",
		"time_label_less_than_minute": "<1 m",
		"time_label_minute": "{number} m",
		"time_label_hour": "{number} t",
		"time_label_day": "{number} d"
	},
	"ne-NP": {
		"newtab_page_title": "नयाँ ट्याब",
		"default_label_loading": "लोड हुदैँछ...",
		"header_top_sites": "शीर्ष साइटहरु",
		"header_highlights": "विशेषताहरू",
		"type_label_visited": "भ्रमण गरिएको",
		"type_label_bookmarked": "पुस्तकचिनो लागाइएको",
		"type_label_synced": "अर्को यण्त्रबाट समक्रमण गरिएको",
		"type_label_open": "खोल्नुहोस्",
		"type_label_topic": "शीर्षक",
		"menu_action_bookmark": "पुस्तकचिनो",
		"menu_action_remove_bookmark": "पुस्तकचिनो हटाउनुहोस्",
		"menu_action_share": "साझेदारी गर्नुहोस्",
		"menu_action_copy_address": "ठेगाना प्रतिलिपि गर्नुहोस्",
		"menu_action_email_link": "लिङ्कलाई इमेल गर्नुहोस्...",
		"menu_action_open_new_window": "नयाँ सञ्झ्यालमा खोल्नुहोस्",
		"menu_action_open_private_window": "नयाँ निजी सञ्झ्यालमा खोल्नुहोस्",
		"menu_action_dismiss": "खारेज गर्नुहोस्",
		"menu_action_delete": "इतिहासबाट मेट्नुहोस्",
		"search_for_something_with": "{search_term} खोज्न प्रयोग गर्नुहोस्:",
		"search_header": "{search_engine_name} खोजी",
		"search_web_placeholder": "वेबमा खोज्नुहोस्",
		"search_settings": "खोजी सेटिङ परिवर्तन गर्नुहोस्",
		"welcome_title": "नयाँ ट्याबमा स्वागत छ",
		"welcome_label": "तपाईँका विशेषताहरु पत्ता लगाउँदै",
		"time_label_less_than_minute": "< १ मिनेट",
		"time_label_minute": "{number} मिनेट",
		"time_label_hour": "{number} घण्टा",
		"time_label_day": "{number} दिन"
	},
	"nl": {
		"newtab_page_title": "Nieuw tabblad",
		"default_label_loading": "Laden…",
		"header_top_sites": "Topwebsites",
		"header_highlights": "Highlights",
		"type_label_visited": "Bezocht",
		"type_label_bookmarked": "Bladwijzer gemaakt",
		"type_label_synced": "Gesynchroniseerd vanaf ander apparaat",
		"type_label_open": "Open",
		"type_label_topic": "Onderwerp",
		"menu_action_bookmark": "Bladwijzer maken",
		"menu_action_remove_bookmark": "Bladwijzer verwijderen",
		"menu_action_share": "Delen",
		"menu_action_copy_address": "Adres kopiëren",
		"menu_action_email_link": "Koppeling e-mailen…",
		"menu_action_open_new_window": "Openen in een nieuw venster",
		"menu_action_open_private_window": "Openen in een nieuw privévenster",
		"menu_action_dismiss": "Verwijderen",
		"menu_action_delete": "Verwijderen uit geschiedenis",
		"search_for_something_with": "Zoeken naar {search_term} met:",
		"search_header": "{search_engine_name} doorzoeken",
		"search_web_placeholder": "Zoeken op het web",
		"search_settings": "Zoekinstellingen wijzigen",
		"welcome_title": "Welkom bij het nieuwe tabblad",
		"welcome_body": "Firefox gebruikt deze ruimte om uw meest relevante bladwijzers, artikelen, video’s en pagina’s die u onlangs hebt bezocht weer te geven, zodat u deze eenvoudig kunt terugvinden.",
		"welcome_label": "Uw highlights aanduiden",
		"time_label_less_than_minute": "< 1 m",
		"time_label_minute": "{number} m",
		"time_label_hour": "{number} u",
		"time_label_day": "{number} d"
	},
	"nn-NO": {
		"newtab_page_title": "Ny flik",
		"default_label_loading": "Lastar…",
		"header_top_sites": "Mest vitja",
		"header_highlights": "Høgdepunkt",
		"type_label_visited": "Vitja",
		"type_label_bookmarked": "Bokmerkte",
		"type_label_synced": "Synkronisert frå ei anna eining",
		"type_label_open": "Opna",
		"type_label_topic": "Emne",
		"menu_action_bookmark": "Bokmerke",
		"menu_action_remove_bookmark": "Fjern bokmerke",
		"menu_action_share": "Del",
		"menu_action_copy_address": "Kopier adresse",
		"menu_action_email_link": "E-postlenke…",
		"menu_action_open_new_window": "Opna i nytt vindauge",
		"menu_action_open_private_window": "Opna i eit nytt privat vindauge",
		"menu_action_dismiss": "Avslå",
		"menu_action_delete": "Slett frå historikk",
		"search_for_something_with": "Søk etter {search_term} med:",
		"search_header": "{search_engine_name}",
		"search_web_placeholder": "Søk på nettet",
		"search_settings": "Endra søkjeinnstillingar",
		"welcome_title": "Velkomen til ny fane",
		"welcome_body": "Firefox vil bruka denne plassen til å visa deg dei mest relevante bokmerka, artiklane, videoane og sidene du nettopp har vitja, slik at du enkelt kan finna tilbake til dei.",
		"welcome_label": "Identifiserer høgdepunkta dine",
		"time_label_less_than_minute": "<1 min.",
		"time_label_minute": "{number} m",
		"time_label_hour": "{number} t",
		"time_label_day": "{number} d"
	},
	"pt-BR": {
		"newtab_page_title": "Nova aba",
		"default_label_loading": "Carregando…",
		"header_top_sites": "Sites principais",
		"header_highlights": "Destaques",
		"type_label_visited": "Visitado",
		"type_label_bookmarked": "Favorito",
		"type_label_synced": "Sincronizadas com outro dispositivo",
		"type_label_open": "Abrir",
		"type_label_topic": "Tópico",
		"menu_action_bookmark": "Favoritos",
		"menu_action_remove_bookmark": "Remover favorito",
		"menu_action_share": "Compartilhar",
		"menu_action_copy_address": "Copiar endereço",
		"menu_action_email_link": "Enviar link por e-mail…",
		"menu_action_open_new_window": "Abrir em uma nova janela",
		"menu_action_open_private_window": "Abrir em uma nova janela privativa",
		"menu_action_dismiss": "Dispensar",
		"menu_action_delete": "Remover do histórico",
		"search_for_something_with": "Pesquisar por {search_term} com:",
		"search_header": "Pesquisa {search_engine_name}",
		"search_web_placeholder": "Pesquisar na Web",
		"search_settings": "Alterar configurações de pesquisa",
		"welcome_title": "Bem-vindo a nova aba",
		"welcome_body": "O Firefox utilizará este espaço para mostrar os seus favoritos, vídeos e páginas mais relevantes que você visitou recentemente, assim você poderá voltar para eles facilmente.",
		"welcome_label": "Em destaque",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"pt-PT": {
		"newtab_page_title": "Novo separador",
		"default_label_loading": "A carregar…",
		"header_top_sites": "Sites mais visitados",
		"header_highlights": "Destaques",
		"type_label_visited": "Visitados",
		"type_label_bookmarked": "Guardados nos marcadores",
		"type_label_synced": "Sincronizado a partir de outro dispositivo",
		"type_label_open": "Abertos",
		"type_label_topic": "Tópico",
		"menu_action_bookmark": "Adicionar aos marcadores",
		"menu_action_remove_bookmark": "Remover marcador",
		"menu_action_share": "Partilhar",
		"menu_action_copy_address": "Copiar endereço",
		"menu_action_email_link": "Enviar ligação por email…",
		"menu_action_open_new_window": "Abrir em nova janela",
		"menu_action_open_private_window": "Abrir em nova janela privada",
		"menu_action_dismiss": "Dispensar",
		"menu_action_delete": "Eliminar do histórico",
		"search_for_something_with": "Pesquisar por {search_term} com:",
		"search_header": "Pesquisa {search_engine_name}",
		"search_web_placeholder": "Pesquisar na Web",
		"search_settings": "Alterar definições de pesquisa",
		"welcome_title": "Bem-vindo ao novo separador",
		"welcome_body": "O Firefox irá utilizar este espaço para lhe mostrar os seus marcadores, artigos, vídeos, e páginas mais relevantes que visitou recentemente, para que possa regressar a estes mais facilmente.",
		"welcome_label": "A identificar os seus destaques",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"rm": {
		"newtab_page_title": "Nov tab",
		"default_label_loading": "Chargiar…",
		"header_top_sites": "Paginas preferidas",
		"header_highlights": "Accents",
		"type_label_visited": "Visità",
		"type_label_bookmarked": "Cun segnapagina",
		"type_label_synced": "Sincronisà dad auters apparats",
		"type_label_open": "Avert",
		"type_label_topic": "Tema",
		"menu_action_bookmark": "Marcar sco segnapagina",
		"menu_action_remove_bookmark": "Allontanar il segnapagina",
		"menu_action_share": "Cundivider",
		"menu_action_copy_address": "Copiar l'adressa",
		"menu_action_email_link": "Trametter la colliaziun per e-mail…",
		"menu_action_open_new_window": "Avrir en ina nova fanestra",
		"menu_action_open_private_window": "Avrir en ina nova fanestra privata",
		"menu_action_dismiss": "Serrar",
		"menu_action_delete": "Stizzar da la cronologia",
		"search_for_something_with": "Tschertgar {search_term} cun:",
		"search_header": "Tschertga da {search_engine_name}",
		"search_web_placeholder": "Tschertgar en il Web",
		"search_settings": "Midar las preferenzas per tschertgar",
		"welcome_title": "Bainvegni sin in nov tab",
		"welcome_body": "Firefox utilisescha quest plaz per ta mussar ils segnapaginas, ils artitgels, ils videos e las paginas las pli relevantas che ti has visità dacurt, uschè che ti pos turnar a moda simpla tar quellas.",
		"welcome_label": "Identifitgar tes accents",
		"time_label_less_than_minute": "< 1 min",
		"time_label_minute": "{number} min",
		"time_label_hour": "{number} uras",
		"time_label_day": "{number} dis"
	},
	"ru": {
		"newtab_page_title": "Новая вкладка",
		"default_label_loading": "Загрузка…",
		"header_top_sites": "Топ сайтов",
		"header_highlights": "Избранные",
		"type_label_visited": "Посещено",
		"type_label_bookmarked": "В закладках",
		"type_label_synced": "Синхронизировано с другого устройства",
		"type_label_open": "Открыта",
		"type_label_topic": "Тема",
		"menu_action_bookmark": "Добавить в закладки",
		"menu_action_remove_bookmark": "Удалить закладку",
		"menu_action_share": "Поделиться",
		"menu_action_copy_address": "Скопировать ссылку",
		"menu_action_email_link": "Отправить ссылку…",
		"menu_action_open_new_window": "Открыть в новом окне",
		"menu_action_open_private_window": "Открыть в новом приватном окне",
		"menu_action_dismiss": "Скрыть",
		"menu_action_delete": "Удалить из истории",
		"search_for_something_with": "Искать {search_term} в:",
		"search_header": "Искать в {search_engine_name}",
		"search_web_placeholder": "Искать в Интернете",
		"search_settings": "Изменить настройки поиска",
		"welcome_title": "Добро пожаловать на новую вкладку",
		"welcome_body": "Firefox будет использовать это место, чтобы отображать самые актуальные закладки, статьи, видео и страницы, которые вы недавно посетили, чтобы вы смогли легко попасть на них снова.",
		"welcome_label": "Определение вашего избранного",
		"time_label_less_than_minute": "<1 мин.",
		"time_label_minute": "{number} мин.",
		"time_label_hour": "{number} ч.",
		"time_label_day": "{number} д."
	},
	"sk": {
		"newtab_page_title": "Nová karta",
		"default_label_loading": "Načítava sa…",
		"header_top_sites": "Top stránky",
		"header_highlights": "Vybrané stránky",
		"type_label_visited": "Navštívené",
		"type_label_bookmarked": "V záložkách",
		"type_label_synced": "Synchronizované z ďalšieho zariadenia",
		"type_label_open": "Otvorené",
		"type_label_topic": "Téma",
		"menu_action_bookmark": "Pridať medzi záložky",
		"menu_action_remove_bookmark": "Odstrániť záložku",
		"menu_action_share": "Zdieľať",
		"menu_action_copy_address": "Kopírovať adresu",
		"menu_action_email_link": "Odoslať odkaz e-mailom…",
		"menu_action_open_new_window": "Otvoriť v novom okne",
		"menu_action_open_private_window": "Otvoriť v novom okne režimu Súkromné prehliadanie",
		"menu_action_dismiss": "Skryť",
		"menu_action_delete": "Odstrániť z histórie",
		"search_for_something_with": "Hľadať {search_term} pomocou:",
		"search_header": "Vyhľadávanie pomocou {search_engine_name}",
		"search_web_placeholder": "Vyhľadávanie na webe",
		"search_settings": "Zmeniť nastavenia vyhľadávania",
		"welcome_title": "Vitajte na stránke novej karty",
		"welcome_body": "Firefox bude na tomto mieste zobrazovať často zobrazované záložky, články, videá a stránky, ktoré ste nedávno navštívili. Váš prístup k nim je tak omnoho ľahší.",
		"welcome_label": "Identifikácia vybraných stránok",
		"time_label_less_than_minute": "< 1 min",
		"time_label_minute": "{number} min",
		"time_label_hour": "{number} hod",
		"time_label_day": "{number} d"
	},
	"sl": {
		"newtab_page_title": "Nov zavihek",
		"default_label_loading": "Nalaganje …",
		"header_top_sites": "Glavne strani",
		"header_highlights": "Poudarki",
		"type_label_visited": "Obiskano",
		"type_label_bookmarked": "Med zaznamki",
		"type_label_synced": "Sinhronizirano z druge naprave",
		"type_label_open": "Odpri",
		"type_label_topic": "Tema",
		"menu_action_bookmark": "Dodaj med zaznamke",
		"menu_action_remove_bookmark": "Odstrani zaznamek",
		"menu_action_share": "Deli",
		"menu_action_copy_address": "Kopiraj naslov",
		"menu_action_email_link": "Pošlji povezavo po e-pošti …",
		"menu_action_open_new_window": "Odpri v novem oknu",
		"menu_action_open_private_window": "Odpri v novem zasebnem oknu",
		"menu_action_dismiss": "Opusti",
		"menu_action_delete": "Izbriši iz zgodovine",
		"search_for_something_with": "Išči \"{search_term}\" z iskalnikom:",
		"search_header": "Iskanje {search_engine_name}",
		"search_web_placeholder": "Iskanje po spletu",
		"search_settings": "Spremeni nastavitve iskanja",
		"welcome_title": "Dobrodošli v novem zavihku",
		"welcome_body": "Na tem prostoru bo Firefox prikazoval najustreznejše zaznamke, članke, videoposnetke in nedavno obiskane strani, tako da jih lahko pozneje znova hitro najdete.",
		"welcome_label": "Zbiranje poudarkov",
		"time_label_less_than_minute": "<1 min",
		"time_label_minute": "{number} min",
		"time_label_hour": "{number} ur",
		"time_label_day": "{number} dni"
	},
	"sq": {
		"newtab_page_title": "Skedë e Re",
		"default_label_loading": "Po ngarkohet…",
		"header_top_sites": "Sajte Kryesues",
		"header_highlights": "Highlights",
		"type_label_visited": "Të vizituara",
		"type_label_bookmarked": "Të faqeruajtura",
		"type_label_synced": "Njëkohësuar prej pajisjeje tjetër",
		"type_label_open": "Hape",
		"type_label_topic": "Temë",
		"menu_action_bookmark": "Faqerojtës",
		"menu_action_remove_bookmark": "Hiqe Faqerojtësin",
		"menu_action_share": "Ndajeni me të tjerët",
		"menu_action_copy_address": "Kopjoje Adresën",
		"menu_action_email_link": "Dërgoni Lidhje me Email…",
		"menu_action_open_new_window": "Hape në Dritare të Re",
		"menu_action_open_private_window": "Hape në Dritare të Re Private",
		"menu_action_dismiss": "Hidhe tej",
		"menu_action_delete": "Fshije prej Historiku",
		"search_for_something_with": "Kërko për {search_term} me:",
		"search_header": "Kërkim me {search_engine_name}",
		"search_web_placeholder": "Kërkoni në Web",
		"search_settings": "Ndryshoji Rregullimet e Kërkimit",
		"welcome_title": "Mirë se vini te skedë e re",
		"welcome_body": "Firefox-i do ta përdorë këtë hapësirë për t’ju shfaqur faqerojtësit, artikujt, videot dhe faqet më me peshë që keni vizituar së fundi, që kështu të mund të ktheheni lehtë në to.",
		"welcome_label": "Po identifikohen Highlights tuaj",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"sr": {
		"newtab_page_title": "Нови језичак",
		"default_label_loading": "Учитавање…",
		"header_top_sites": "Популарни сајтови",
		"header_highlights": "Истакнути",
		"type_label_visited": "Посећене",
		"type_label_bookmarked": "Забележено",
		"type_label_open": "Отвори",
		"type_label_topic": "Тема",
		"menu_action_bookmark": "Забележи",
		"menu_action_remove_bookmark": "Уклони забелешку",
		"menu_action_share": "Подели",
		"menu_action_copy_address": "Копирај адресу",
		"menu_action_open_new_window": "Отвори у новом прозору",
		"menu_action_open_private_window": "Отвори у новом приватном прозору",
		"menu_action_dismiss": "Занемари",
		"menu_action_delete": "Уклони из историјата",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"sv-SE": {
		"newtab_page_title": "Ny flik",
		"default_label_loading": "Laddar…",
		"header_top_sites": "Mest besökta",
		"header_highlights": "Höjdpunkter",
		"type_label_visited": "Besökta",
		"type_label_bookmarked": "Bokmärkta",
		"type_label_synced": "Synkroniserade från en annan enhet",
		"type_label_open": "Öppna",
		"type_label_topic": "Ämne",
		"menu_action_bookmark": "Bokmärke",
		"menu_action_remove_bookmark": "Ta bort bokmärke",
		"menu_action_share": "Dela",
		"menu_action_copy_address": "Kopiera adress",
		"menu_action_email_link": "E-posta länk…",
		"menu_action_open_new_window": "Öppna i nytt fönster",
		"menu_action_open_private_window": "Öppna i nytt privat fönster",
		"menu_action_dismiss": "Avfärda",
		"menu_action_delete": "Ta bort från historik",
		"search_for_something_with": "Sök efter {search_term} med:",
		"search_header": "{search_engine_name}",
		"search_web_placeholder": "Sök på webben",
		"search_settings": "Ändra sökinställningar",
		"welcome_title": "Välkommen till ny flik",
		"welcome_body": "Firefox kommer att använda detta utrymme för att visa dina mest relevanta bokmärken, artiklar, videor och sidor du nyligen besökt, så du kan hitta dem lätt.",
		"welcome_label": "Identifierar dina höjdpunkter",
		"time_label_less_than_minute": "<1 min",
		"time_label_minute": "{number} min",
		"time_label_hour": "{number} h",
		"time_label_day": "{number} d"
	},
	"te": {
		"newtab_page_title": "కొత్త ట్యాబ్"
	},
	"th": {
		"newtab_page_title": "แท็บใหม่",
		"default_label_loading": "กำลังโหลด…",
		"header_top_sites": "ไซต์เด่น",
		"header_highlights": "รายการเด่น",
		"type_label_visited": "เยี่ยมชมแล้ว",
		"type_label_bookmarked": "คั่นหน้าแล้ว",
		"type_label_synced": "ซิงค์จากอุปกรณ์อื่น",
		"type_label_open": "เปิด",
		"type_label_topic": "หัวข้อ",
		"menu_action_bookmark": "ที่คั่นหน้า",
		"menu_action_remove_bookmark": "เอาที่คั่นหน้าออก",
		"menu_action_share": "แบ่งปัน",
		"menu_action_copy_address": "คัดลอกที่อยู่",
		"menu_action_email_link": "ส่งอีเมลลิงก์…",
		"menu_action_open_new_window": "เปิดในหน้าต่างใหม่",
		"menu_action_open_private_window": "เปิดในหน้าต่างส่วนตัวใหม่",
		"menu_action_dismiss": "ยกเลิก",
		"menu_action_delete": "ลบออกจากประวัติ",
		"search_for_something_with": "ค้นหาสำหรับ {search_term} ด้วย:",
		"search_header": "ค้นหา {search_engine_name}",
		"search_web_placeholder": "ค้นหาเว็บ",
		"search_settings": "เปลี่ยนการตั้งค่าการค้นหา",
		"welcome_title": "ยินดีต้อนรับสู่แท็บใหม่",
		"welcome_body": "Firefox จะใช้พื้นที่นี้เพื่อแสดงที่คั่นหน้า, บทความ, วิดีโอ และหน้าที่คุณเพิ่งเยี่ยมชมที่เกี่ยวข้องกับคุณมากที่สุด เพื่อให้คุณสามารถกลับมาชมได้อย่างง่ายดาย",
		"welcome_label": "กำลังระบุรายการเด่นของคุณ",
		"time_label_less_than_minute": "<1 นาที",
		"time_label_minute": "{number} นาที",
		"time_label_hour": "{number} ชั่วโมง",
		"time_label_day": "{number} วัน"
	},
	"tl": {
		"newtab_page_title": "Bagong Tab",
		"default_label_loading": "Pagkarga…",
		"header_top_sites": "Tuktok na mga Site",
		"header_highlights": "Highlights",
		"type_label_visited": "Binisita",
		"type_label_bookmarked": "Bookmarked",
		"type_label_synced": "Naka-sync mula sa ibang kagamitan",
		"type_label_open": "Bukas",
		"type_label_topic": "Topiko",
		"menu_action_bookmark": "Bookmark",
		"menu_action_remove_bookmark": "Alisin ang Bookmark",
		"menu_action_share": "Ibahagi",
		"menu_action_copy_address": "Kopyahin ang Address",
		"menu_action_email_link": "Email Link…",
		"menu_action_open_new_window": "Buksan sa isang Bagong Window",
		"menu_action_open_private_window": "Buksan sa isang Pribadong Bago na Window",
		"menu_action_dismiss": "Paalisin",
		"menu_action_delete": "Tanggalin mula History",
		"search_for_something_with": "Maghanap ng mga {search_term} na may:",
		"search_header": "{search_engine_name} Hanapin",
		"search_web_placeholder": "Hanapin sa Web",
		"search_settings": "Baguhin ang mga Setting ng Paghahanap",
		"welcome_title": "Maligayang pagdating sa bagong tab",
		"welcome_body": "Firefox ay gagamit ng puwang upang ipakita ang iyong mga pinaka-kaugnay na bookmark, artikulo, video, at mga pahina ng kamakailan na iyong binisita, kaya maaari kang bumalik sa mga ito ng madali.",
		"welcome_label": "Ang pagkilala sa iyong Highlights",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"tr": {
		"newtab_page_title": "Yeni Sekme",
		"default_label_loading": "Yükleniyor…",
		"header_top_sites": "En Sık Kullanılan Siteler",
		"header_highlights": "Öne Çıkanlar",
		"type_label_visited": "Ziyaret edildi",
		"type_label_bookmarked": "Yer imlerine eklendi",
		"type_label_synced": "Başka bir cihazdan eşitlendi",
		"type_label_open": "Açık",
		"type_label_topic": "Konu",
		"menu_action_bookmark": "Yer imlerine ekle",
		"menu_action_remove_bookmark": "Yer imini sil",
		"menu_action_share": "Paylaş",
		"menu_action_copy_address": "Adresi kopyala",
		"menu_action_email_link": "Bağlantıyı e-postayla gönder…",
		"menu_action_open_new_window": "Yeni pencerede aç",
		"menu_action_open_private_window": "Yeni gizli pencerede aç",
		"menu_action_dismiss": "Kapat",
		"menu_action_delete": "Geçmişten sil",
		"search_for_something_with": "{search_term} terimini şununla ara:",
		"search_header": "{search_engine_name} Araması",
		"search_web_placeholder": "Web'de ara",
		"search_settings": "Arama ayarlarını değiştir",
		"welcome_title": "Yeni sekmeye hoş geldiniz",
		"welcome_body": "Firefox son zamanlarda ziyaret ettiğiniz ve sık kullandığınız yer imlerini, makaleleri, videoları ve sayfaları onlara tekrar kolayca geri dönebilmeniz için bu alanda gösterecektir.",
		"welcome_label": "Öne Çıkanlar'ınızı tanıyın",
		"time_label_less_than_minute": "<1 dk",
		"time_label_minute": "{number} dk",
		"time_label_hour": "{number} sa",
		"time_label_day": "{number} g"
	},
	"uk": {
		"newtab_page_title": "Нова вкладка",
		"default_label_loading": "Завантаження…",
		"header_top_sites": "Популярні сайти",
		"header_highlights": "Основні",
		"type_label_visited": "Відвідано",
		"type_label_bookmarked": "Закладено",
		"type_label_synced": "Синхронізовано з іншого пристрою",
		"type_label_open": "Відкрито",
		"type_label_topic": "Тема",
		"menu_action_bookmark": "Закласти",
		"menu_action_remove_bookmark": "Вилучити закладку",
		"menu_action_share": "Поділитися",
		"menu_action_copy_address": "Копіювати адресу",
		"menu_action_email_link": "Надіслати посилання…",
		"menu_action_open_new_window": "Відкрити у новому вікні",
		"menu_action_open_private_window": "Відкрити у новому приватному вікні",
		"menu_action_dismiss": "Відхилити",
		"menu_action_delete": "Видалити з історії",
		"search_for_something_with": "Шукати {search_term} з:",
		"search_header": "Шукати з {search_engine_name}",
		"search_web_placeholder": "Шукати в Інтернеті",
		"search_settings": "Змінити налаштування пошуку",
		"welcome_title": "Вітаємо на новій вкладці",
		"welcome_body": "Firefox буде використовувати її для показу найважливіших закладок, статей, відео, а також нещодавно відвіданих сторінок, щоб ви могли з легкістю повернутися до них.",
		"welcome_label": "Визначення основного вмісту",
		"time_label_less_than_minute": "<1 хв",
		"time_label_minute": "{number} хв",
		"time_label_hour": "{number} г",
		"time_label_day": "{number} д"
	},
	"ur": {
		"newtab_page_title": "نیا ٹیب",
		"default_label_loading": "لوڈ کر رہا ہے…",
		"header_top_sites": "بہترین سائٹیں",
		"header_highlights": "شہ سرخياں",
		"type_label_bookmarked": "نشان شدہ",
		"type_label_synced": "کسی دوسرے آلے سے ہمہ وقت ساز کیا گیا ہے",
		"type_label_open": "کھولیں",
		"type_label_topic": "عنوان",
		"menu_action_bookmark": "نشانی",
		"menu_action_remove_bookmark": "نشانى ہٹائيں",
		"menu_action_share": "شیئر کریں",
		"menu_action_copy_address": "پتہ نقل کریں",
		"menu_action_email_link": "ربط ای میل کریں…",
		"menu_action_open_new_window": "نئے دریچے میں کھولیں",
		"menu_action_open_private_window": "نئی نجی دریچے میں کھولیں",
		"menu_action_dismiss": "برخاست کریں",
		"menu_action_delete": "تاریخ سے حذف کریں",
		"search_web_placeholder": "ويب پر تلاش کريں",
		"search_settings": "تلاش  کی سیٹکگیں تبدیل کریں",
		"welcome_title": "نئے ٹیب میں خوش آمدید",
		"time_label_less_than_minute": "<1m",
		"time_label_minute": "{number}m",
		"time_label_hour": "{number}h",
		"time_label_day": "{number}d"
	},
	"zh-CN": {
		"newtab_page_title": "新标签页",
		"default_label_loading": "载入中…",
		"header_top_sites": "常用网站",
		"header_highlights": "集锦",
		"type_label_visited": "访问过",
		"type_label_bookmarked": "加了书签",
		"type_label_synced": "从其他设备同步",
		"type_label_open": "打开",
		"type_label_topic": "主题",
		"menu_action_bookmark": "添加书签",
		"menu_action_remove_bookmark": "移除书签",
		"menu_action_share": "分享",
		"menu_action_copy_address": "复制地址",
		"menu_action_email_link": "用邮件发送链接…",
		"menu_action_open_new_window": "在新窗口中打开",
		"menu_action_open_private_window": "在新的隐私浏览窗口中打开",
		"menu_action_dismiss": "去除",
		"menu_action_delete": "从历史记录中删除",
		"search_for_something_with": "搜索 {search_term}，使用：",
		"search_header": "{search_engine_name} 搜索",
		"search_web_placeholder": "在网络上搜索",
		"search_settings": "更改搜索设置",
		"welcome_title": "欢迎使用新标签页",
		"welcome_body": "Firefox 会在这里显示对您最有用的书签、文章、视频和访问过的页面，便于您打开这些网站。",
		"welcome_label": "正在为您准备集锦",
		"time_label_less_than_minute": "<1分钟",
		"time_label_minute": "{number}分钟",
		"time_label_hour": "{number}小时",
		"time_label_day": "{number}天"
	},
	"zh-TW": {
		"newtab_page_title": "新分頁",
		"default_label_loading": "載入中…",
		"header_top_sites": "熱門網站",
		"header_highlights": "精選網站",
		"type_label_visited": "造訪過的網站",
		"type_label_bookmarked": "已加入書籤",
		"type_label_synced": "從其他裝置同步過來",
		"type_label_open": "開啟",
		"type_label_topic": "主題",
		"menu_action_bookmark": "書籤",
		"menu_action_remove_bookmark": "移除書籤",
		"menu_action_share": "分享",
		"menu_action_copy_address": "複製網址",
		"menu_action_email_link": "郵寄鏈結…",
		"menu_action_open_new_window": "用新視窗開啟",
		"menu_action_open_private_window": "用新隱私視窗開啟",
		"menu_action_dismiss": "知道了",
		"menu_action_delete": "從瀏覽紀錄刪除",
		"search_for_something_with": "搜尋 {search_term} 使用:",
		"search_header": "{search_engine_name} 搜尋",
		"search_web_placeholder": "搜尋 Web",
		"search_settings": "變更搜尋選項",
		"welcome_title": "歡迎來到新分頁",
		"welcome_body": "Firefox 會使用此空間來顯示與您最相關的書籤、文章、影片以及您最近造訪的頁面，這樣您就可以快速回到這些網站。",
		"welcome_label": "找出您的精選網站",
		"time_label_less_than_minute": "不到 1 分鐘內",
		"time_label_minute": "{number} 分鐘",
		"time_label_hour": "{number} 小時",
		"time_label_day": "{number} 天"
	}
};

/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = {
	"sample": {
		"name": "Sample Experiment",
		"active": false,
		"description": "This is just a sample experiment. It will not be included since active is false",
		"control": {
			"value": "#000",
			"description": "This is black"
		},
		"variant": {
			"id": "do-not-delete-this-is-a-sample",
			"value": "#FFF",
			"threshold": 0.5,
			"description": "This is white"
		}
	},
	"recommendedHighlight": {
		"name": "Recommended Highlights",
		"active": false,
		"description": "Show a recommendation from Pocket to the user",
		"control": {
			"value": false,
			"description": "Do not show a recommendation"
		},
		"variant": {
			"id": "exp-002-recommended-highlights",
			"value": true,
			"threshold": 0.3,
			"description": "Show a recommendation in the third highlights spot"
		}
	},
	"weightedHighlights": {
		"name": "Weighted Highlights",
		"active": false,
		"description": "Use weighted highlights instead of the query based ones.",
		"control": {
			"value": false,
			"description": "Use the query based system."
		},
		"variant": {
			"id": "exp-003-weighted-highlights",
			"value": true,
			"threshold": 0.4,
			"description": "Use the score based highlights."
		}
	},
	"localMetadata": {
		"name": "Local Page Scraper",
		"active": false,
		"description": "Locally compute metadata for pages",
		"control": {
			"value": false,
			"description": "Do not compute metadata locally"
		},
		"variant": {
			"id": "exp-004-local-metadata",
			"value": true,
			"threshold": 0.2,
			"description": "Locally compute metadata"
		}
	},
	"metadataService": {
		"name": "Use Mozilla MetadataService",
		"active": false,
		"description": "Compute metadata using MetadataService",
		"control": {
			"value": false,
			"description": "Use Embedly"
		},
		"variant": {
			"id": "exp-005-metadata-service",
			"value": true,
			"threshold": 0.2,
			"description": "Use MetadataService"
		}
	},
	"dedupedCombinedFrecency": {
		"name": "Combine score of deduped sites",
		"active": false,
		"description": "Add frecencies of deduped top sites for ranking",
		"control": {
			"value": false,
			"description": "Use last frecency"
		},
		"variant": {
			"id": "exp-006-deduped-combined-frecency",
			"value": true,
			"threshold": 0.2,
			"description": "Use combined frecency"
		}
	},
	"locallyFetchMetadata": {
		"name": "Fetch Page Content Locally",
		"active": false,
		"description": "Make a network request for content of a URL",
		"control": {
			"value": false,
			"description": "Use remote service for metadata"
		},
		"variant": {
			"id": "exp-007-locally-fetch-metadata",
			"value": true,
			"threshold": 0.1,
			"description": "Fetch page content locally"
		}
	},
	"originalNewTabSites": {
		"name": "Original about:newtab top sites",
		"active": false,
		"description": "Use the sites from the original about:newtab",
		"control": {
			"value": false,
			"description": "Use sites from tiles"
		},
		"variant": {
			"id": "exp-008-original-newtab-sites",
			"value": true,
			"threshold": 0.2,
			"description": "Use sites from activity stream"
		}
	},
	"screenshots": {
		"name": "Screenshots for Top Sites",
		"active": true,
		"description": "Add screenshots for some Top Sites",
		"control": {
			"value": false,
			"description": "Don't show screenshots"
		},
		"variant": {
			"id": "exp-009-screenshots",
			"value": true,
			"threshold": 0.3,
			"description": "Show screenshots"
		}
	},
	"locallyFetchMetadata20": {
		"name": "Fetch Page Content Locally",
		"active": true,
		"description": "Make a network request for content of a URL",
		"control": {
			"value": false,
			"description": "Use remote service for metadata"
		},
		"variant": {
			"id": "exp-010-locally-fetch-metadata",
			"value": true,
			"threshold": 0.2,
			"description": "Fetch page content locally"
		}
	}
};

/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__root_js__ = __webpack_require__(84);


/** Built-in value references. */
var Symbol = __WEBPACK_IMPORTED_MODULE_0__root_js__["a" /* default */].Symbol;

/* harmony default export */ __webpack_exports__["a"] = Symbol;


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(78);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getPrototype_js__ = __webpack_require__(80);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__ = __webpack_require__(85);




/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__["a" /* default */])(value) || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value) != objectTag) {
    return false;
  }
  var proto = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__getPrototype_js__["a" /* default */])(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

/* harmony default export */ __webpack_exports__["a"] = isPlainObject;


/***/ }),
/* 18 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = compose;
/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  var last = funcs[funcs.length - 1];
  var rest = funcs.slice(0, -1);
  return function () {
    return rest.reduceRight(function (composed, f) {
      return f(composed);
    }, last.apply(undefined, arguments));
  };
}

/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_lodash_es_isPlainObject__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_symbol_observable__ = __webpack_require__(101);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_symbol_observable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_symbol_observable__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return ActionTypes; });
/* harmony export (immutable) */ __webpack_exports__["a"] = createStore;



/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var ActionTypes = {
  INIT: '@@redux/INIT'
};

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} enhancer The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */
function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.');
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    var isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action) {
    if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_lodash_es_isPlainObject__["a" /* default */])(action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i]();
    }

    return action;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }

    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/zenparsing/es-observable
   */
  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object') {
          throw new TypeError('Expected the observer to be an object.');
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return { unsubscribe: unsubscribe };
      }
    }, _ref[__WEBPACK_IMPORTED_MODULE_1_symbol_observable___default.a] = function () {
      return this;
    }, _ref;
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT });

  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[__WEBPACK_IMPORTED_MODULE_1_symbol_observable___default.a] = observable, _ref2;
}

/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = warning;
/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
    /* eslint-disable no-empty */
  } catch (e) {}
  /* eslint-enable no-empty */
}

/***/ }),
/* 22 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

(function webpackUniversalModuleDefinition(root, factory) {
	if(true)
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["wu"] = factory();
	else
		root["wu"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _toConsumableArray = __webpack_require__(1)["default"];

	var _slicedToArray = __webpack_require__(39)["default"];

	var _Symbol$iterator = __webpack_require__(52)["default"];

	var _getIterator = __webpack_require__(40)["default"];

	var _regeneratorRuntime = __webpack_require__(54)["default"];

	var _Object$keys = __webpack_require__(80)["default"];

	var _Set = __webpack_require__(84)["default"];

	var _Promise = __webpack_require__(65)["default"];

	var wu = module.exports = function wu(iterable) {
	  if (!isIterable(iterable)) {
	    throw new Error("wu: `" + iterable + "` is not iterable!");
	  }
	  return new Wu(iterable);
	};

	function Wu(iterable) {
	  var iterator = getIterator(iterable);
	  this.next = iterator.next.bind(iterator);
	}
	wu.prototype = Wu.prototype;

	wu.prototype[_Symbol$iterator] = function () {
	  return this;
	};

	/*
	 * Internal utilities
	 */

	// An internal placeholder value.
	var MISSING = {};

	// Return whether a thing is iterable.
	var isIterable = function isIterable(thing) {
	  return thing && typeof thing[_Symbol$iterator] === "function";
	};

	// Get the iterator for the thing or throw an error.
	var getIterator = function getIterator(thing) {
	  if (isIterable(thing)) {
	    return _getIterator(thing);
	  }
	  throw new TypeError("Not iterable: " + thing);
	};

	// Define a static method on `wu` and set its prototype to the shared
	// `Wu.prototype`.
	var staticMethod = function staticMethod(name, fn) {
	  fn.prototype = Wu.prototype;
	  wu[name] = fn;
	};

	// Define a function that is attached as both a `Wu.prototype` method and a
	// curryable static method on `wu` directly that takes an iterable as its last
	// parameter.
	var prototypeAndStatic = function prototypeAndStatic(name, fn) {
	  var expectedArgs = arguments.length <= 2 || arguments[2] === undefined ? fn.length : arguments[2];
	  return (function () {
	    fn.prototype = Wu.prototype;
	    Wu.prototype[name] = fn;

	    // +1 for the iterable, which is the `this` value of the function so it
	    // isn't reflected by the length property.
	    expectedArgs += 1;

	    wu[name] = wu.curryable(function () {
	      var _wu;

	      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	      }

	      var iterable = args.pop();
	      return (_wu = wu(iterable))[name].apply(_wu, args);
	    }, expectedArgs);
	  })();
	};

	// A decorator for rewrapping a method's returned iterable in wu to maintain
	// chainability.
	var rewrap = function rewrap(fn) {
	  return function () {
	    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      args[_key2] = arguments[_key2];
	    }

	    return wu(fn.call.apply(fn, [this].concat(args)));
	  };
	};

	var rewrapStaticMethod = function rewrapStaticMethod(name, fn) {
	  return staticMethod(name, rewrap(fn));
	};
	var rewrapPrototypeAndStatic = function rewrapPrototypeAndStatic(name, fn, expectedArgs) {
	  return prototypeAndStatic(name, rewrap(fn), expectedArgs);
	};

	// Return a wrapped version of `fn` bound with the initial arguments
	// `...args`.
	function curry(fn, args) {
	  return function () {
	    for (var _len3 = arguments.length, moreArgs = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	      moreArgs[_key3] = arguments[_key3];
	    }

	    return fn.call.apply(fn, [this].concat(_toConsumableArray(args), moreArgs));
	  };
	}

	/*
	 * Public utilities
	 */

	staticMethod("curryable", function (fn) {
	  var expected = arguments.length <= 1 || arguments[1] === undefined ? fn.length : arguments[1];
	  return (function () {
	    return function f() {
	      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	        args[_key4] = arguments[_key4];
	      }

	      return args.length >= expected ? fn.apply(this, args) : curry(f, args);
	    };
	  })();
	});

	rewrapStaticMethod("entries", _regeneratorRuntime.mark(function callee$0$0(obj) {
	  var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, k;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion = true;
	        _didIteratorError = false;
	        _iteratorError = undefined;
	        context$1$0.prev = 3;
	        _iterator = _getIterator(_Object$keys(obj));

	      case 5:
	        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        k = _step.value;
	        context$1$0.next = 9;
	        return [k, obj[k]];

	      case 9:
	        _iteratorNormalCompletion = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError = true;
	        _iteratorError = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion && _iterator["return"]) {
	          _iterator["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapStaticMethod("keys", _regeneratorRuntime.mark(function callee$0$0(obj) {
	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_Object$keys(obj), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapStaticMethod("values", _regeneratorRuntime.mark(function callee$0$0(obj) {
	  var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, k;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion2 = true;
	        _didIteratorError2 = false;
	        _iteratorError2 = undefined;
	        context$1$0.prev = 3;
	        _iterator2 = _getIterator(_Object$keys(obj));

	      case 5:
	        if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        k = _step2.value;
	        context$1$0.next = 9;
	        return obj[k];

	      case 9:
	        _iteratorNormalCompletion2 = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError2 = true;
	        _iteratorError2 = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
	          _iterator2["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError2) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError2;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	/*
	 * Infinite iterators
	 */

	rewrapPrototypeAndStatic("cycle", _regeneratorRuntime.mark(function callee$0$0() {
	  var saved, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        saved = [];
	        _iteratorNormalCompletion3 = true;
	        _didIteratorError3 = false;
	        _iteratorError3 = undefined;
	        context$1$0.prev = 4;
	        _iterator3 = _getIterator(this);

	      case 6:
	        if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
	          context$1$0.next = 14;
	          break;
	        }

	        x = _step3.value;
	        context$1$0.next = 10;
	        return x;

	      case 10:
	        saved.push(x);

	      case 11:
	        _iteratorNormalCompletion3 = true;
	        context$1$0.next = 6;
	        break;

	      case 14:
	        context$1$0.next = 20;
	        break;

	      case 16:
	        context$1$0.prev = 16;
	        context$1$0.t0 = context$1$0["catch"](4);
	        _didIteratorError3 = true;
	        _iteratorError3 = context$1$0.t0;

	      case 20:
	        context$1$0.prev = 20;
	        context$1$0.prev = 21;

	        if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
	          _iterator3["return"]();
	        }

	      case 23:
	        context$1$0.prev = 23;

	        if (!_didIteratorError3) {
	          context$1$0.next = 26;
	          break;
	        }

	        throw _iteratorError3;

	      case 26:
	        return context$1$0.finish(23);

	      case 27:
	        return context$1$0.finish(20);

	      case 28:
	        if (!saved) {
	          context$1$0.next = 32;
	          break;
	        }

	        return context$1$0.delegateYield(saved, "t1", 30);

	      case 30:
	        context$1$0.next = 28;
	        break;

	      case 32:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[4, 16, 20, 28], [21,, 23, 27]]);
	}));

	rewrapStaticMethod("count", _regeneratorRuntime.mark(function callee$0$0() {
	  var start = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
	  var step = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
	  var n;
	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        n = start;

	      case 1:
	        if (false) {
	          context$1$0.next = 7;
	          break;
	        }

	        context$1$0.next = 4;
	        return n;

	      case 4:
	        n += step;
	        context$1$0.next = 1;
	        break;

	      case 7:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapStaticMethod("repeat", _regeneratorRuntime.mark(function callee$0$0(thing) {
	  var times = arguments.length <= 1 || arguments[1] === undefined ? Infinity : arguments[1];
	  var i;
	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        if (!(times === Infinity)) {
	          context$1$0.next = 8;
	          break;
	        }

	      case 1:
	        if (false) {
	          context$1$0.next = 6;
	          break;
	        }

	        context$1$0.next = 4;
	        return thing;

	      case 4:
	        context$1$0.next = 1;
	        break;

	      case 6:
	        context$1$0.next = 15;
	        break;

	      case 8:
	        i = 0;

	      case 9:
	        if (!(i < times)) {
	          context$1$0.next = 15;
	          break;
	        }

	        context$1$0.next = 12;
	        return thing;

	      case 12:
	        i++;
	        context$1$0.next = 9;
	        break;

	      case 15:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	/*
	 * Iterators that terminate once the input sequence has been exhausted
	 */

	rewrapStaticMethod("chain", _regeneratorRuntime.mark(function callee$0$0() {
	  var _iteratorNormalCompletion4,
	      _didIteratorError4,
	      _iteratorError4,
	      _len5,
	      iterables,
	      _key5,
	      _iterator4,
	      _step4,
	      it,
	      args$1$0 = arguments;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion4 = true;
	        _didIteratorError4 = false;
	        _iteratorError4 = undefined;
	        context$1$0.prev = 3;

	        for (_len5 = args$1$0.length, iterables = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
	          iterables[_key5] = args$1$0[_key5];
	        }

	        _iterator4 = _getIterator(iterables);

	      case 6:
	        if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        it = _step4.value;
	        return context$1$0.delegateYield(it, "t0", 9);

	      case 9:
	        _iteratorNormalCompletion4 = true;
	        context$1$0.next = 6;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t1 = context$1$0["catch"](3);
	        _didIteratorError4 = true;
	        _iteratorError4 = context$1$0.t1;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion4 && _iterator4["return"]) {
	          _iterator4["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError4) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError4;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapPrototypeAndStatic("chunk", _regeneratorRuntime.mark(function callee$0$0() {
	  var n = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];

	  var items, index, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, item;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        items = [];
	        index = 0;
	        _iteratorNormalCompletion5 = true;
	        _didIteratorError5 = false;
	        _iteratorError5 = undefined;
	        context$1$0.prev = 5;
	        _iterator5 = _getIterator(this);

	      case 7:
	        if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
	          context$1$0.next = 18;
	          break;
	        }

	        item = _step5.value;

	        items[index++] = item;

	        if (!(index === n)) {
	          context$1$0.next = 15;
	          break;
	        }

	        context$1$0.next = 13;
	        return items;

	      case 13:
	        items = [];
	        index = 0;

	      case 15:
	        _iteratorNormalCompletion5 = true;
	        context$1$0.next = 7;
	        break;

	      case 18:
	        context$1$0.next = 24;
	        break;

	      case 20:
	        context$1$0.prev = 20;
	        context$1$0.t0 = context$1$0["catch"](5);
	        _didIteratorError5 = true;
	        _iteratorError5 = context$1$0.t0;

	      case 24:
	        context$1$0.prev = 24;
	        context$1$0.prev = 25;

	        if (!_iteratorNormalCompletion5 && _iterator5["return"]) {
	          _iterator5["return"]();
	        }

	      case 27:
	        context$1$0.prev = 27;

	        if (!_didIteratorError5) {
	          context$1$0.next = 30;
	          break;
	        }

	        throw _iteratorError5;

	      case 30:
	        return context$1$0.finish(27);

	      case 31:
	        return context$1$0.finish(24);

	      case 32:
	        if (!index) {
	          context$1$0.next = 35;
	          break;
	        }

	        context$1$0.next = 35;
	        return items;

	      case 35:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[5, 20, 24, 32], [25,, 27, 31]]);
	}), 1);

	rewrapPrototypeAndStatic("concatMap", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  var _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion6 = true;
	        _didIteratorError6 = false;
	        _iteratorError6 = undefined;
	        context$1$0.prev = 3;
	        _iterator6 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
	          context$1$0.next = 11;
	          break;
	        }

	        x = _step6.value;
	        return context$1$0.delegateYield(fn(x), "t0", 8);

	      case 8:
	        _iteratorNormalCompletion6 = true;
	        context$1$0.next = 5;
	        break;

	      case 11:
	        context$1$0.next = 17;
	        break;

	      case 13:
	        context$1$0.prev = 13;
	        context$1$0.t1 = context$1$0["catch"](3);
	        _didIteratorError6 = true;
	        _iteratorError6 = context$1$0.t1;

	      case 17:
	        context$1$0.prev = 17;
	        context$1$0.prev = 18;

	        if (!_iteratorNormalCompletion6 && _iterator6["return"]) {
	          _iterator6["return"]();
	        }

	      case 20:
	        context$1$0.prev = 20;

	        if (!_didIteratorError6) {
	          context$1$0.next = 23;
	          break;
	        }

	        throw _iteratorError6;

	      case 23:
	        return context$1$0.finish(20);

	      case 24:
	        return context$1$0.finish(17);

	      case 25:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 13, 17, 25], [18,, 20, 24]]);
	}));

	rewrapPrototypeAndStatic("drop", _regeneratorRuntime.mark(function callee$0$0(n) {
	  var i, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        i = 0;
	        _iteratorNormalCompletion7 = true;
	        _didIteratorError7 = false;
	        _iteratorError7 = undefined;
	        context$1$0.prev = 4;
	        _iterator7 = _getIterator(this);

	      case 6:
	        if (_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done) {
	          context$1$0.next = 16;
	          break;
	        }

	        x = _step7.value;

	        if (!(i++ < n)) {
	          context$1$0.next = 10;
	          break;
	        }

	        return context$1$0.abrupt("continue", 13);

	      case 10:
	        context$1$0.next = 12;
	        return x;

	      case 12:
	        return context$1$0.abrupt("break", 16);

	      case 13:
	        _iteratorNormalCompletion7 = true;
	        context$1$0.next = 6;
	        break;

	      case 16:
	        context$1$0.next = 22;
	        break;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.t0 = context$1$0["catch"](4);
	        _didIteratorError7 = true;
	        _iteratorError7 = context$1$0.t0;

	      case 22:
	        context$1$0.prev = 22;
	        context$1$0.prev = 23;

	        if (!_iteratorNormalCompletion7 && _iterator7["return"]) {
	          _iterator7["return"]();
	        }

	      case 25:
	        context$1$0.prev = 25;

	        if (!_didIteratorError7) {
	          context$1$0.next = 28;
	          break;
	        }

	        throw _iteratorError7;

	      case 28:
	        return context$1$0.finish(25);

	      case 29:
	        return context$1$0.finish(22);

	      case 30:
	        return context$1$0.delegateYield(this, "t1", 31);

	      case 31:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[4, 18, 22, 30], [23,, 25, 29]]);
	}));

	rewrapPrototypeAndStatic("dropWhile", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];

	  var _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion8 = true;
	        _didIteratorError8 = false;
	        _iteratorError8 = undefined;
	        context$1$0.prev = 3;
	        _iterator8 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done) {
	          context$1$0.next = 15;
	          break;
	        }

	        x = _step8.value;

	        if (!fn(x)) {
	          context$1$0.next = 9;
	          break;
	        }

	        return context$1$0.abrupt("continue", 12);

	      case 9:
	        context$1$0.next = 11;
	        return x;

	      case 11:
	        return context$1$0.abrupt("break", 15);

	      case 12:
	        _iteratorNormalCompletion8 = true;
	        context$1$0.next = 5;
	        break;

	      case 15:
	        context$1$0.next = 21;
	        break;

	      case 17:
	        context$1$0.prev = 17;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError8 = true;
	        _iteratorError8 = context$1$0.t0;

	      case 21:
	        context$1$0.prev = 21;
	        context$1$0.prev = 22;

	        if (!_iteratorNormalCompletion8 && _iterator8["return"]) {
	          _iterator8["return"]();
	        }

	      case 24:
	        context$1$0.prev = 24;

	        if (!_didIteratorError8) {
	          context$1$0.next = 27;
	          break;
	        }

	        throw _iteratorError8;

	      case 27:
	        return context$1$0.finish(24);

	      case 28:
	        return context$1$0.finish(21);

	      case 29:
	        return context$1$0.delegateYield(this, "t1", 30);

	      case 30:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 17, 21, 29], [22,, 24, 28]]);
	}), 1);

	rewrapPrototypeAndStatic("enumerate", _regeneratorRuntime.mark(function callee$0$0() {
	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_zip([this, wu.count()]), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapPrototypeAndStatic("filter", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];

	  var _iteratorNormalCompletion9, _didIteratorError9, _iteratorError9, _iterator9, _step9, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion9 = true;
	        _didIteratorError9 = false;
	        _iteratorError9 = undefined;
	        context$1$0.prev = 3;
	        _iterator9 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done) {
	          context$1$0.next = 13;
	          break;
	        }

	        x = _step9.value;

	        if (!fn(x)) {
	          context$1$0.next = 10;
	          break;
	        }

	        context$1$0.next = 10;
	        return x;

	      case 10:
	        _iteratorNormalCompletion9 = true;
	        context$1$0.next = 5;
	        break;

	      case 13:
	        context$1$0.next = 19;
	        break;

	      case 15:
	        context$1$0.prev = 15;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError9 = true;
	        _iteratorError9 = context$1$0.t0;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.prev = 20;

	        if (!_iteratorNormalCompletion9 && _iterator9["return"]) {
	          _iterator9["return"]();
	        }

	      case 22:
	        context$1$0.prev = 22;

	        if (!_didIteratorError9) {
	          context$1$0.next = 25;
	          break;
	        }

	        throw _iteratorError9;

	      case 25:
	        return context$1$0.finish(22);

	      case 26:
	        return context$1$0.finish(19);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
	}), 1);

	rewrapPrototypeAndStatic("flatten", _regeneratorRuntime.mark(function callee$0$0() {
	  var shallow = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

	  var _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion10 = true;
	        _didIteratorError10 = false;
	        _iteratorError10 = undefined;
	        context$1$0.prev = 3;
	        _iterator10 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done) {
	          context$1$0.next = 16;
	          break;
	        }

	        x = _step10.value;

	        if (!(typeof x !== "string" && isIterable(x))) {
	          context$1$0.next = 11;
	          break;
	        }

	        return context$1$0.delegateYield(shallow ? x : wu(x).flatten(), "t0", 9);

	      case 9:
	        context$1$0.next = 13;
	        break;

	      case 11:
	        context$1$0.next = 13;
	        return x;

	      case 13:
	        _iteratorNormalCompletion10 = true;
	        context$1$0.next = 5;
	        break;

	      case 16:
	        context$1$0.next = 22;
	        break;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.t1 = context$1$0["catch"](3);
	        _didIteratorError10 = true;
	        _iteratorError10 = context$1$0.t1;

	      case 22:
	        context$1$0.prev = 22;
	        context$1$0.prev = 23;

	        if (!_iteratorNormalCompletion10 && _iterator10["return"]) {
	          _iterator10["return"]();
	        }

	      case 25:
	        context$1$0.prev = 25;

	        if (!_didIteratorError10) {
	          context$1$0.next = 28;
	          break;
	        }

	        throw _iteratorError10;

	      case 28:
	        return context$1$0.finish(25);

	      case 29:
	        return context$1$0.finish(22);

	      case 30:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 18, 22, 30], [23,, 25, 29]]);
	}), 1);

	rewrapPrototypeAndStatic("invoke", _regeneratorRuntime.mark(function callee$0$0(name) {
	  var _iteratorNormalCompletion11,
	      _didIteratorError11,
	      _iteratorError11,
	      _len6,
	      args,
	      _key6,
	      _iterator11,
	      _step11,
	      x,
	      args$1$0 = arguments;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion11 = true;
	        _didIteratorError11 = false;
	        _iteratorError11 = undefined;
	        context$1$0.prev = 3;

	        for (_len6 = args$1$0.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
	          args[_key6 - 1] = args$1$0[_key6];
	        }

	        _iterator11 = _getIterator(this);

	      case 6:
	        if (_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done) {
	          context$1$0.next = 13;
	          break;
	        }

	        x = _step11.value;
	        context$1$0.next = 10;
	        return x[name].apply(x, args);

	      case 10:
	        _iteratorNormalCompletion11 = true;
	        context$1$0.next = 6;
	        break;

	      case 13:
	        context$1$0.next = 19;
	        break;

	      case 15:
	        context$1$0.prev = 15;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError11 = true;
	        _iteratorError11 = context$1$0.t0;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.prev = 20;

	        if (!_iteratorNormalCompletion11 && _iterator11["return"]) {
	          _iterator11["return"]();
	        }

	      case 22:
	        context$1$0.prev = 22;

	        if (!_didIteratorError11) {
	          context$1$0.next = 25;
	          break;
	        }

	        throw _iteratorError11;

	      case 25:
	        return context$1$0.finish(22);

	      case 26:
	        return context$1$0.finish(19);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
	}));

	rewrapPrototypeAndStatic("map", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  var _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion12 = true;
	        _didIteratorError12 = false;
	        _iteratorError12 = undefined;
	        context$1$0.prev = 3;
	        _iterator12 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        x = _step12.value;
	        context$1$0.next = 9;
	        return fn(x);

	      case 9:
	        _iteratorNormalCompletion12 = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError12 = true;
	        _iteratorError12 = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion12 && _iterator12["return"]) {
	          _iterator12["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError12) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError12;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapPrototypeAndStatic("pluck", _regeneratorRuntime.mark(function callee$0$0(name) {
	  var _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion13 = true;
	        _didIteratorError13 = false;
	        _iteratorError13 = undefined;
	        context$1$0.prev = 3;
	        _iterator13 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        x = _step13.value;
	        context$1$0.next = 9;
	        return x[name];

	      case 9:
	        _iteratorNormalCompletion13 = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError13 = true;
	        _iteratorError13 = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion13 && _iterator13["return"]) {
	          _iterator13["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError13) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError13;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapPrototypeAndStatic("reductions", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  var initial = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

	  var val, _iteratorNormalCompletion14, _didIteratorError14, _iteratorError14, _iterator14, _step14, x, _iteratorNormalCompletion15, _didIteratorError15, _iteratorError15, _iterator15, _step15;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        val = initial;

	        if (!(val === undefined)) {
	          context$1$0.next = 28;
	          break;
	        }

	        _iteratorNormalCompletion14 = true;
	        _didIteratorError14 = false;
	        _iteratorError14 = undefined;
	        context$1$0.prev = 5;
	        _iterator14 = _getIterator(this);

	      case 7:
	        if (_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done) {
	          context$1$0.next = 14;
	          break;
	        }

	        x = _step14.value;

	        val = x;
	        return context$1$0.abrupt("break", 14);

	      case 11:
	        _iteratorNormalCompletion14 = true;
	        context$1$0.next = 7;
	        break;

	      case 14:
	        context$1$0.next = 20;
	        break;

	      case 16:
	        context$1$0.prev = 16;
	        context$1$0.t0 = context$1$0["catch"](5);
	        _didIteratorError14 = true;
	        _iteratorError14 = context$1$0.t0;

	      case 20:
	        context$1$0.prev = 20;
	        context$1$0.prev = 21;

	        if (!_iteratorNormalCompletion14 && _iterator14["return"]) {
	          _iterator14["return"]();
	        }

	      case 23:
	        context$1$0.prev = 23;

	        if (!_didIteratorError14) {
	          context$1$0.next = 26;
	          break;
	        }

	        throw _iteratorError14;

	      case 26:
	        return context$1$0.finish(23);

	      case 27:
	        return context$1$0.finish(20);

	      case 28:
	        context$1$0.next = 30;
	        return val;

	      case 30:
	        _iteratorNormalCompletion15 = true;
	        _didIteratorError15 = false;
	        _iteratorError15 = undefined;
	        context$1$0.prev = 33;
	        _iterator15 = _getIterator(this);

	      case 35:
	        if (_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done) {
	          context$1$0.next = 42;
	          break;
	        }

	        x = _step15.value;
	        context$1$0.next = 39;
	        return val = fn(val, x);

	      case 39:
	        _iteratorNormalCompletion15 = true;
	        context$1$0.next = 35;
	        break;

	      case 42:
	        context$1$0.next = 48;
	        break;

	      case 44:
	        context$1$0.prev = 44;
	        context$1$0.t1 = context$1$0["catch"](33);
	        _didIteratorError15 = true;
	        _iteratorError15 = context$1$0.t1;

	      case 48:
	        context$1$0.prev = 48;
	        context$1$0.prev = 49;

	        if (!_iteratorNormalCompletion15 && _iterator15["return"]) {
	          _iterator15["return"]();
	        }

	      case 51:
	        context$1$0.prev = 51;

	        if (!_didIteratorError15) {
	          context$1$0.next = 54;
	          break;
	        }

	        throw _iteratorError15;

	      case 54:
	        return context$1$0.finish(51);

	      case 55:
	        return context$1$0.finish(48);

	      case 56:
	        return context$1$0.abrupt("return", val);

	      case 57:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[5, 16, 20, 28], [21,, 23, 27], [33, 44, 48, 56], [49,, 51, 55]]);
	}), 2);

	rewrapPrototypeAndStatic("reject", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];

	  var _iteratorNormalCompletion16, _didIteratorError16, _iteratorError16, _iterator16, _step16, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion16 = true;
	        _didIteratorError16 = false;
	        _iteratorError16 = undefined;
	        context$1$0.prev = 3;
	        _iterator16 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done) {
	          context$1$0.next = 13;
	          break;
	        }

	        x = _step16.value;

	        if (fn(x)) {
	          context$1$0.next = 10;
	          break;
	        }

	        context$1$0.next = 10;
	        return x;

	      case 10:
	        _iteratorNormalCompletion16 = true;
	        context$1$0.next = 5;
	        break;

	      case 13:
	        context$1$0.next = 19;
	        break;

	      case 15:
	        context$1$0.prev = 15;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError16 = true;
	        _iteratorError16 = context$1$0.t0;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.prev = 20;

	        if (!_iteratorNormalCompletion16 && _iterator16["return"]) {
	          _iterator16["return"]();
	        }

	      case 22:
	        context$1$0.prev = 22;

	        if (!_didIteratorError16) {
	          context$1$0.next = 25;
	          break;
	        }

	        throw _iteratorError16;

	      case 25:
	        return context$1$0.finish(22);

	      case 26:
	        return context$1$0.finish(19);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
	}), 1);

	rewrapPrototypeAndStatic("slice", _regeneratorRuntime.mark(function callee$0$0() {
	  var start = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
	  var stop = arguments.length <= 1 || arguments[1] === undefined ? Infinity : arguments[1];

	  var _iteratorNormalCompletion17, _didIteratorError17, _iteratorError17, _iterator17, _step17, _step17$value, x, i;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        if (!(stop < start)) {
	          context$1$0.next = 2;
	          break;
	        }

	        throw new RangeError("parameter `stop` (= " + stop + ") must be >= `start` (= " + start + ")");

	      case 2:
	        _iteratorNormalCompletion17 = true;
	        _didIteratorError17 = false;
	        _iteratorError17 = undefined;
	        context$1$0.prev = 5;
	        _iterator17 = _getIterator(this.enumerate());

	      case 7:
	        if (_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done) {
	          context$1$0.next = 20;
	          break;
	        }

	        _step17$value = _slicedToArray(_step17.value, 2);
	        x = _step17$value[0];
	        i = _step17$value[1];

	        if (!(i < start)) {
	          context$1$0.next = 13;
	          break;
	        }

	        return context$1$0.abrupt("continue", 17);

	      case 13:
	        if (!(i >= stop)) {
	          context$1$0.next = 15;
	          break;
	        }

	        return context$1$0.abrupt("break", 20);

	      case 15:
	        context$1$0.next = 17;
	        return x;

	      case 17:
	        _iteratorNormalCompletion17 = true;
	        context$1$0.next = 7;
	        break;

	      case 20:
	        context$1$0.next = 26;
	        break;

	      case 22:
	        context$1$0.prev = 22;
	        context$1$0.t0 = context$1$0["catch"](5);
	        _didIteratorError17 = true;
	        _iteratorError17 = context$1$0.t0;

	      case 26:
	        context$1$0.prev = 26;
	        context$1$0.prev = 27;

	        if (!_iteratorNormalCompletion17 && _iterator17["return"]) {
	          _iterator17["return"]();
	        }

	      case 29:
	        context$1$0.prev = 29;

	        if (!_didIteratorError17) {
	          context$1$0.next = 32;
	          break;
	        }

	        throw _iteratorError17;

	      case 32:
	        return context$1$0.finish(29);

	      case 33:
	        return context$1$0.finish(26);

	      case 34:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[5, 22, 26, 34], [27,, 29, 33]]);
	}), 2);

	rewrapPrototypeAndStatic("spreadMap", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  var _iteratorNormalCompletion18, _didIteratorError18, _iteratorError18, _iterator18, _step18, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion18 = true;
	        _didIteratorError18 = false;
	        _iteratorError18 = undefined;
	        context$1$0.prev = 3;
	        _iterator18 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        x = _step18.value;
	        context$1$0.next = 9;
	        return fn.apply(undefined, _toConsumableArray(x));

	      case 9:
	        _iteratorNormalCompletion18 = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError18 = true;
	        _iteratorError18 = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion18 && _iterator18["return"]) {
	          _iterator18["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError18) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError18;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapPrototypeAndStatic("take", _regeneratorRuntime.mark(function callee$0$0(n) {
	  var i, _iteratorNormalCompletion19, _didIteratorError19, _iteratorError19, _iterator19, _step19, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        if (!(n < 1)) {
	          context$1$0.next = 2;
	          break;
	        }

	        return context$1$0.abrupt("return");

	      case 2:
	        i = 0;
	        _iteratorNormalCompletion19 = true;
	        _didIteratorError19 = false;
	        _iteratorError19 = undefined;
	        context$1$0.prev = 6;
	        _iterator19 = _getIterator(this);

	      case 8:
	        if (_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done) {
	          context$1$0.next = 17;
	          break;
	        }

	        x = _step19.value;
	        context$1$0.next = 12;
	        return x;

	      case 12:
	        if (!(++i >= n)) {
	          context$1$0.next = 14;
	          break;
	        }

	        return context$1$0.abrupt("break", 17);

	      case 14:
	        _iteratorNormalCompletion19 = true;
	        context$1$0.next = 8;
	        break;

	      case 17:
	        context$1$0.next = 23;
	        break;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.t0 = context$1$0["catch"](6);
	        _didIteratorError19 = true;
	        _iteratorError19 = context$1$0.t0;

	      case 23:
	        context$1$0.prev = 23;
	        context$1$0.prev = 24;

	        if (!_iteratorNormalCompletion19 && _iterator19["return"]) {
	          _iterator19["return"]();
	        }

	      case 26:
	        context$1$0.prev = 26;

	        if (!_didIteratorError19) {
	          context$1$0.next = 29;
	          break;
	        }

	        throw _iteratorError19;

	      case 29:
	        return context$1$0.finish(26);

	      case 30:
	        return context$1$0.finish(23);

	      case 31:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[6, 19, 23, 31], [24,, 26, 30]]);
	}));

	rewrapPrototypeAndStatic("takeWhile", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];

	  var _iteratorNormalCompletion20, _didIteratorError20, _iteratorError20, _iterator20, _step20, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion20 = true;
	        _didIteratorError20 = false;
	        _iteratorError20 = undefined;
	        context$1$0.prev = 3;
	        _iterator20 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done) {
	          context$1$0.next = 14;
	          break;
	        }

	        x = _step20.value;

	        if (fn(x)) {
	          context$1$0.next = 9;
	          break;
	        }

	        return context$1$0.abrupt("break", 14);

	      case 9:
	        context$1$0.next = 11;
	        return x;

	      case 11:
	        _iteratorNormalCompletion20 = true;
	        context$1$0.next = 5;
	        break;

	      case 14:
	        context$1$0.next = 20;
	        break;

	      case 16:
	        context$1$0.prev = 16;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError20 = true;
	        _iteratorError20 = context$1$0.t0;

	      case 20:
	        context$1$0.prev = 20;
	        context$1$0.prev = 21;

	        if (!_iteratorNormalCompletion20 && _iterator20["return"]) {
	          _iterator20["return"]();
	        }

	      case 23:
	        context$1$0.prev = 23;

	        if (!_didIteratorError20) {
	          context$1$0.next = 26;
	          break;
	        }

	        throw _iteratorError20;

	      case 26:
	        return context$1$0.finish(23);

	      case 27:
	        return context$1$0.finish(20);

	      case 28:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 16, 20, 28], [21,, 23, 27]]);
	}), 1);

	rewrapPrototypeAndStatic("tap", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? console.log.bind(console) : arguments[0];

	  var _iteratorNormalCompletion21, _didIteratorError21, _iteratorError21, _iterator21, _step21, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion21 = true;
	        _didIteratorError21 = false;
	        _iteratorError21 = undefined;
	        context$1$0.prev = 3;
	        _iterator21 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done) {
	          context$1$0.next = 13;
	          break;
	        }

	        x = _step21.value;

	        fn(x);
	        context$1$0.next = 10;
	        return x;

	      case 10:
	        _iteratorNormalCompletion21 = true;
	        context$1$0.next = 5;
	        break;

	      case 13:
	        context$1$0.next = 19;
	        break;

	      case 15:
	        context$1$0.prev = 15;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError21 = true;
	        _iteratorError21 = context$1$0.t0;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.prev = 20;

	        if (!_iteratorNormalCompletion21 && _iterator21["return"]) {
	          _iterator21["return"]();
	        }

	      case 22:
	        context$1$0.prev = 22;

	        if (!_didIteratorError21) {
	          context$1$0.next = 25;
	          break;
	        }

	        throw _iteratorError21;

	      case 25:
	        return context$1$0.finish(22);

	      case 26:
	        return context$1$0.finish(19);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
	}), 1);

	rewrapPrototypeAndStatic("unique", _regeneratorRuntime.mark(function callee$0$0() {
	  var seen, _iteratorNormalCompletion22, _didIteratorError22, _iteratorError22, _iterator22, _step22, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        seen = new _Set();
	        _iteratorNormalCompletion22 = true;
	        _didIteratorError22 = false;
	        _iteratorError22 = undefined;
	        context$1$0.prev = 4;
	        _iterator22 = _getIterator(this);

	      case 6:
	        if (_iteratorNormalCompletion22 = (_step22 = _iterator22.next()).done) {
	          context$1$0.next = 15;
	          break;
	        }

	        x = _step22.value;

	        if (seen.has(x)) {
	          context$1$0.next = 12;
	          break;
	        }

	        context$1$0.next = 11;
	        return x;

	      case 11:
	        seen.add(x);

	      case 12:
	        _iteratorNormalCompletion22 = true;
	        context$1$0.next = 6;
	        break;

	      case 15:
	        context$1$0.next = 21;
	        break;

	      case 17:
	        context$1$0.prev = 17;
	        context$1$0.t0 = context$1$0["catch"](4);
	        _didIteratorError22 = true;
	        _iteratorError22 = context$1$0.t0;

	      case 21:
	        context$1$0.prev = 21;
	        context$1$0.prev = 22;

	        if (!_iteratorNormalCompletion22 && _iterator22["return"]) {
	          _iterator22["return"]();
	        }

	      case 24:
	        context$1$0.prev = 24;

	        if (!_didIteratorError22) {
	          context$1$0.next = 27;
	          break;
	        }

	        throw _iteratorError22;

	      case 27:
	        return context$1$0.finish(24);

	      case 28:
	        return context$1$0.finish(21);

	      case 29:
	        seen.clear();

	      case 30:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[4, 17, 21, 29], [22,, 24, 28]]);
	}));

	var _zip = rewrap(_regeneratorRuntime.mark(function callee$0$0(iterables) {
	  var longest = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

	  var iters, numIters, numFinished, finished, zipped, _iteratorNormalCompletion23, _didIteratorError23, _iteratorError23, _iterator23, _step23, it, _it$next, value, done;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        if (iterables.length) {
	          context$1$0.next = 2;
	          break;
	        }

	        return context$1$0.abrupt("return");

	      case 2:
	        iters = iterables.map(getIterator);
	        numIters = iterables.length;
	        numFinished = 0;
	        finished = false;

	      case 6:
	        if (finished) {
	          context$1$0.next = 44;
	          break;
	        }

	        zipped = [];
	        _iteratorNormalCompletion23 = true;
	        _didIteratorError23 = false;
	        _iteratorError23 = undefined;
	        context$1$0.prev = 11;
	        _iterator23 = _getIterator(iters);

	      case 13:
	        if (_iteratorNormalCompletion23 = (_step23 = _iterator23.next()).done) {
	          context$1$0.next = 26;
	          break;
	        }

	        it = _step23.value;
	        _it$next = it.next();
	        value = _it$next.value;
	        done = _it$next.done;

	        if (!done) {
	          context$1$0.next = 22;
	          break;
	        }

	        if (longest) {
	          context$1$0.next = 21;
	          break;
	        }

	        return context$1$0.abrupt("return");

	      case 21:
	        if (++numFinished == numIters) {
	          finished = true;
	        }

	      case 22:
	        if (value === undefined) {
	          // Leave a hole in the array so that you can distinguish an iterable
	          // that's done (via `index in array == false`) from an iterable
	          // yielding `undefined`.
	          zipped.length++;
	        } else {
	          zipped.push(value);
	        }

	      case 23:
	        _iteratorNormalCompletion23 = true;
	        context$1$0.next = 13;
	        break;

	      case 26:
	        context$1$0.next = 32;
	        break;

	      case 28:
	        context$1$0.prev = 28;
	        context$1$0.t0 = context$1$0["catch"](11);
	        _didIteratorError23 = true;
	        _iteratorError23 = context$1$0.t0;

	      case 32:
	        context$1$0.prev = 32;
	        context$1$0.prev = 33;

	        if (!_iteratorNormalCompletion23 && _iterator23["return"]) {
	          _iterator23["return"]();
	        }

	      case 35:
	        context$1$0.prev = 35;

	        if (!_didIteratorError23) {
	          context$1$0.next = 38;
	          break;
	        }

	        throw _iteratorError23;

	      case 38:
	        return context$1$0.finish(35);

	      case 39:
	        return context$1$0.finish(32);

	      case 40:
	        context$1$0.next = 42;
	        return zipped;

	      case 42:
	        context$1$0.next = 6;
	        break;

	      case 44:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[11, 28, 32, 40], [33,, 35, 39]]);
	}));

	rewrapStaticMethod("zip", _regeneratorRuntime.mark(function callee$0$0() {
	  for (var _len7 = arguments.length, iterables = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
	    iterables[_key7] = arguments[_key7];
	  }

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_zip(iterables), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapStaticMethod("zipLongest", _regeneratorRuntime.mark(function callee$0$0() {
	  for (var _len8 = arguments.length, iterables = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
	    iterables[_key8] = arguments[_key8];
	  }

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_zip(iterables, true), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapStaticMethod("zipWith", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  for (var _len9 = arguments.length, iterables = Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
	    iterables[_key9 - 1] = arguments[_key9];
	  }

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_zip(iterables).spreadMap(fn), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	/*
	 * Functions that force iteration to completion and return a value.
	 */

	// The maximum number of milliseconds we will block the main thread at a time
	// while in `asyncEach`.
	wu.MAX_BLOCK = 15;
	// The number of milliseconds to yield to the main thread between bursts of
	// work.
	wu.TIMEOUT = 1;

	prototypeAndStatic("asyncEach", function (fn) {
	  var maxBlock = arguments.length <= 1 || arguments[1] === undefined ? wu.MAX_BLOCK : arguments[1];
	  var timeout = arguments.length <= 2 || arguments[2] === undefined ? wu.TIMEOUT : arguments[2];

	  var iter = getIterator(this);

	  return new _Promise(function (resolve, reject) {
	    (function loop() {
	      var start = Date.now();

	      var _iteratorNormalCompletion24 = true;
	      var _didIteratorError24 = false;
	      var _iteratorError24 = undefined;

	      try {
	        for (var _iterator24 = _getIterator(iter), _step24; !(_iteratorNormalCompletion24 = (_step24 = _iterator24.next()).done); _iteratorNormalCompletion24 = true) {
	          var x = _step24.value;

	          try {
	            fn(x);
	          } catch (e) {
	            reject(e);
	            return;
	          }

	          if (Date.now() - start > maxBlock) {
	            setTimeout(loop, timeout);
	            return;
	          }
	        }
	      } catch (err) {
	        _didIteratorError24 = true;
	        _iteratorError24 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion24 && _iterator24["return"]) {
	            _iterator24["return"]();
	          }
	        } finally {
	          if (_didIteratorError24) {
	            throw _iteratorError24;
	          }
	        }
	      }

	      resolve();
	    })();
	  });
	}, 3);

	prototypeAndStatic("every", function () {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
	  var _iteratorNormalCompletion25 = true;
	  var _didIteratorError25 = false;
	  var _iteratorError25 = undefined;

	  try {
	    for (var _iterator25 = _getIterator(this), _step25; !(_iteratorNormalCompletion25 = (_step25 = _iterator25.next()).done); _iteratorNormalCompletion25 = true) {
	      var x = _step25.value;

	      if (!fn(x)) {
	        return false;
	      }
	    }
	  } catch (err) {
	    _didIteratorError25 = true;
	    _iteratorError25 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion25 && _iterator25["return"]) {
	        _iterator25["return"]();
	      }
	    } finally {
	      if (_didIteratorError25) {
	        throw _iteratorError25;
	      }
	    }
	  }

	  return true;
	}, 1);

	prototypeAndStatic("find", function (fn) {
	  var _iteratorNormalCompletion26 = true;
	  var _didIteratorError26 = false;
	  var _iteratorError26 = undefined;

	  try {
	    for (var _iterator26 = _getIterator(this), _step26; !(_iteratorNormalCompletion26 = (_step26 = _iterator26.next()).done); _iteratorNormalCompletion26 = true) {
	      var x = _step26.value;

	      if (fn(x)) {
	        return x;
	      }
	    }
	  } catch (err) {
	    _didIteratorError26 = true;
	    _iteratorError26 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion26 && _iterator26["return"]) {
	        _iterator26["return"]();
	      }
	    } finally {
	      if (_didIteratorError26) {
	        throw _iteratorError26;
	      }
	    }
	  }
	});

	prototypeAndStatic("forEach", function (fn) {
	  var _iteratorNormalCompletion27 = true;
	  var _didIteratorError27 = false;
	  var _iteratorError27 = undefined;

	  try {
	    for (var _iterator27 = _getIterator(this), _step27; !(_iteratorNormalCompletion27 = (_step27 = _iterator27.next()).done); _iteratorNormalCompletion27 = true) {
	      var x = _step27.value;

	      fn(x);
	    }
	  } catch (err) {
	    _didIteratorError27 = true;
	    _iteratorError27 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion27 && _iterator27["return"]) {
	        _iterator27["return"]();
	      }
	    } finally {
	      if (_didIteratorError27) {
	        throw _iteratorError27;
	      }
	    }
	  }
	});

	prototypeAndStatic("has", function (thing) {
	  return this.some(function (x) {
	    return x === thing;
	  });
	});

	prototypeAndStatic("reduce", function (fn) {
	  var initial = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

	  var val = initial;
	  if (val === undefined) {
	    var _iteratorNormalCompletion28 = true;
	    var _didIteratorError28 = false;
	    var _iteratorError28 = undefined;

	    try {
	      for (var _iterator28 = _getIterator(this), _step28; !(_iteratorNormalCompletion28 = (_step28 = _iterator28.next()).done); _iteratorNormalCompletion28 = true) {
	        var x = _step28.value;

	        val = x;
	        break;
	      }
	    } catch (err) {
	      _didIteratorError28 = true;
	      _iteratorError28 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion28 && _iterator28["return"]) {
	          _iterator28["return"]();
	        }
	      } finally {
	        if (_didIteratorError28) {
	          throw _iteratorError28;
	        }
	      }
	    }
	  }

	  var _iteratorNormalCompletion29 = true;
	  var _didIteratorError29 = false;
	  var _iteratorError29 = undefined;

	  try {
	    for (var _iterator29 = _getIterator(this), _step29; !(_iteratorNormalCompletion29 = (_step29 = _iterator29.next()).done); _iteratorNormalCompletion29 = true) {
	      var x = _step29.value;

	      val = fn(val, x);
	    }
	  } catch (err) {
	    _didIteratorError29 = true;
	    _iteratorError29 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion29 && _iterator29["return"]) {
	        _iterator29["return"]();
	      }
	    } finally {
	      if (_didIteratorError29) {
	        throw _iteratorError29;
	      }
	    }
	  }

	  return val;
	}, 2);

	prototypeAndStatic("some", function () {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
	  var _iteratorNormalCompletion30 = true;
	  var _didIteratorError30 = false;
	  var _iteratorError30 = undefined;

	  try {
	    for (var _iterator30 = _getIterator(this), _step30; !(_iteratorNormalCompletion30 = (_step30 = _iterator30.next()).done); _iteratorNormalCompletion30 = true) {
	      var x = _step30.value;

	      if (fn(x)) {
	        return true;
	      }
	    }
	  } catch (err) {
	    _didIteratorError30 = true;
	    _iteratorError30 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion30 && _iterator30["return"]) {
	        _iterator30["return"]();
	      }
	    } finally {
	      if (_didIteratorError30) {
	        throw _iteratorError30;
	      }
	    }
	  }

	  return false;
	}, 1);

	prototypeAndStatic("toArray", function () {
	  return [].concat(_toConsumableArray(this));
	});

	/*
	 * Methods that return an array of iterables.
	 */

	var MAX_CACHE = 500;

	var _tee = rewrap(_regeneratorRuntime.mark(function callee$0$0(iterator, cache) {
	  var items, index, _iterator$next, done, value;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        items = cache.items;
	        index = 0;

	      case 2:
	        if (false) {
	          context$1$0.next = 25;
	          break;
	        }

	        if (!(index === items.length)) {
	          context$1$0.next = 14;
	          break;
	        }

	        _iterator$next = iterator.next();
	        done = _iterator$next.done;
	        value = _iterator$next.value;

	        if (!done) {
	          context$1$0.next = 10;
	          break;
	        }

	        if (cache.returned === MISSING) {
	          cache.returned = value;
	        }
	        return context$1$0.abrupt("break", 25);

	      case 10:
	        context$1$0.next = 12;
	        return items[index++] = value;

	      case 12:
	        context$1$0.next = 23;
	        break;

	      case 14:
	        if (!(index === cache.tail)) {
	          context$1$0.next = 21;
	          break;
	        }

	        value = items[index];

	        if (index === MAX_CACHE) {
	          items = cache.items = items.slice(index);
	          index = 0;
	          cache.tail = 0;
	        } else {
	          items[index] = undefined;
	          cache.tail = ++index;
	        }
	        context$1$0.next = 19;
	        return value;

	      case 19:
	        context$1$0.next = 23;
	        break;

	      case 21:
	        context$1$0.next = 23;
	        return items[index++];

	      case 23:
	        context$1$0.next = 2;
	        break;

	      case 25:

	        if (cache.tail === index) {
	          items.length = 0;
	        }

	        return context$1$0.abrupt("return", cache.returned);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));
	_tee.prototype = Wu.prototype;

	prototypeAndStatic("tee", function () {
	  var n = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];

	  var iterables = new Array(n);
	  var cache = { tail: 0, items: [], returned: MISSING };

	  while (n--) {
	    iterables[n] = _tee(this, cache);
	  }

	  return iterables;
	}, 1);

	prototypeAndStatic("unzip", function () {
	  var n = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];

	  return this.tee(n).map(function (iter, i) {
	    return iter.pluck(i);
	  });
	}, 1);

	/*
	 * Number of chambers.
	 */

	wu.tang = { clan: 36 };

	// We don't have a cached item for this index, we need to force its
	// evaluation.

	// If we are the last iterator to use a cached value, clean up after
	// ourselves.

	// We have an item in the cache for this index, so yield it.

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _Array$from = __webpack_require__(2)["default"];

	exports["default"] = function (arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

	    return arr2;
	  } else {
	    return _Array$from(arr);
	  }
	};

	exports.__esModule = true;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(3), __esModule: true };

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(4);
	__webpack_require__(26);
	module.exports = __webpack_require__(12).Array.from;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $at  = __webpack_require__(5)(true);

	// 21.1.3.27 String.prototype[@@iterator]()
	__webpack_require__(8)(String, 'String', function(iterated){
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , index = this._i
	    , point;
	  if(index >= O.length)return {value: undefined, done: true};
	  point = $at(O, index);
	  this._i += point.length;
	  return {value: point, done: false};
	});

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// true  -> String#at
	// false -> String#codePointAt
	var toInteger = __webpack_require__(6)
	  , defined   = __webpack_require__(7);
	module.exports = function(TO_STRING){
	  return function(that, pos){
	    var s = String(defined(that))
	      , i = toInteger(pos)
	      , l = s.length
	      , a, b;
	    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l
	      || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	        ? TO_STRING ? s.charAt(i) : a
	        : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

/***/ },
/* 6 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 7 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY         = __webpack_require__(9)
	  , $def            = __webpack_require__(10)
	  , $redef          = __webpack_require__(13)
	  , hide            = __webpack_require__(14)
	  , has             = __webpack_require__(19)
	  , SYMBOL_ITERATOR = __webpack_require__(20)('iterator')
	  , Iterators       = __webpack_require__(23)
	  , BUGGY           = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR     = '@@iterator'
	  , KEYS            = 'keys'
	  , VALUES          = 'values';
	var returnThis = function(){ return this; };
	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE){
	  __webpack_require__(24)(Constructor, NAME, next);
	  var createMethod = function(kind){
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG      = NAME + ' Iterator'
	    , proto    = Base.prototype
	    , _native  = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , _default = _native || createMethod(DEFAULT)
	    , methods, key;
	  // Fix native
	  if(_native){
	    var IteratorPrototype = __webpack_require__(15).getProto(_default.call(new Base));
	    // Set @@toStringTag to native iterators
	    __webpack_require__(25)(IteratorPrototype, TAG, true);
	    // FF fix
	    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, SYMBOL_ITERATOR, returnThis);
	  }
	  // Define iterator
	  if(!LIBRARY || FORCE)hide(proto, SYMBOL_ITERATOR, _default);
	  // Plug for library
	  Iterators[NAME] = _default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      keys:    IS_SET            ? _default : createMethod(KEYS),
	      values:  DEFAULT == VALUES ? _default : createMethod(VALUES),
	      entries: DEFAULT != VALUES ? _default : createMethod('entries')
	    };
	    if(FORCE)for(key in methods){
	      if(!(key in proto))$redef(proto, key, methods[key]);
	    } else $def($def.P + $def.F * BUGGY, NAME, methods);
	  }
	};

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = true;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(11)
	  , core      = __webpack_require__(12)
	  , PROTOTYPE = 'prototype';
	var ctx = function(fn, that){
	  return function(){
	    return fn.apply(that, arguments);
	  };
	};
	var $def = function(type, name, source){
	  var key, own, out, exp
	    , isGlobal = type & $def.G
	    , isProto  = type & $def.P
	    , target   = isGlobal ? global : type & $def.S
	        ? global[name] : (global[name] || {})[PROTOTYPE]
	    , exports  = isGlobal ? core : core[name] || (core[name] = {});
	  if(isGlobal)source = name;
	  for(key in source){
	    // contains in native
	    own = !(type & $def.F) && target && key in target;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    if(isGlobal && typeof target[key] != 'function')exp = source[key];
	    // bind timers to global for call from export context
	    else if(type & $def.B && own)exp = ctx(out, global);
	    // wrap global constructors for prevent change them in library
	    else if(type & $def.W && target[key] == out)!function(C){
	      exp = function(param){
	        return this instanceof C ? new C(param) : C(param);
	      };
	      exp[PROTOTYPE] = C[PROTOTYPE];
	    }(out);
	    else exp = isProto && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // export
	    exports[key] = exp;
	    if(isProto)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
	  }
	};
	// type bitmap
	$def.F = 1;  // forced
	$def.G = 2;  // global
	$def.S = 4;  // static
	$def.P = 8;  // proto
	$def.B = 16; // bind
	$def.W = 32; // wrap
	module.exports = $def;

/***/ },
/* 11 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var UNDEFINED = 'undefined';
	var global = module.exports = typeof window != UNDEFINED && window.Math == Math
	  ? window : typeof self != UNDEFINED && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 12 */
/***/ function(module, exports) {

	var core = module.exports = {version: '1.2.0'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(14);

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var $          = __webpack_require__(15)
	  , createDesc = __webpack_require__(16);
	module.exports = __webpack_require__(17) ? function(object, key, value){
	  return $.setDesc(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 15 */
/***/ function(module, exports) {

	var $Object = Object;
	module.exports = {
	  create:     $Object.create,
	  getProto:   $Object.getPrototypeOf,
	  isEnum:     {}.propertyIsEnumerable,
	  getDesc:    $Object.getOwnPropertyDescriptor,
	  setDesc:    $Object.defineProperty,
	  setDescs:   $Object.defineProperties,
	  getKeys:    $Object.keys,
	  getNames:   $Object.getOwnPropertyNames,
	  getSymbols: $Object.getOwnPropertySymbols,
	  each:       [].forEach
	};

/***/ },
/* 16 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(18)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 18 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 19 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var store  = __webpack_require__(21)('wks')
	  , Symbol = __webpack_require__(11).Symbol;
	module.exports = function(name){
	  return store[name] || (store[name] =
	    Symbol && Symbol[name] || (Symbol || __webpack_require__(22))('Symbol.' + name));
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(11)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 22 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 23 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $ = __webpack_require__(15)
	  , IteratorPrototype = {};

	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(14)(IteratorPrototype, __webpack_require__(20)('iterator'), function(){ return this; });

	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = $.create(IteratorPrototype, {next: __webpack_require__(16)(1,next)});
	  __webpack_require__(25)(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var has  = __webpack_require__(19)
	  , hide = __webpack_require__(14)
	  , TAG  = __webpack_require__(20)('toStringTag');

	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))hide(it, TAG, tag);
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx         = __webpack_require__(27)
	  , $def        = __webpack_require__(10)
	  , toObject    = __webpack_require__(29)
	  , call        = __webpack_require__(30)
	  , isArrayIter = __webpack_require__(33)
	  , toLength    = __webpack_require__(34)
	  , getIterFn   = __webpack_require__(35);
	$def($def.S + $def.F * !__webpack_require__(38)(function(iter){ Array.from(iter); }), 'Array', {
	  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
	  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
	    var O       = toObject(arrayLike)
	      , C       = typeof this == 'function' ? this : Array
	      , mapfn   = arguments[1]
	      , mapping = mapfn !== undefined
	      , index   = 0
	      , iterFn  = getIterFn(O)
	      , length, result, step, iterator;
	    if(mapping)mapfn = ctx(mapfn, arguments[2], 2);
	    // if object isn't iterable or it's array with default iterator - use simple case
	    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
	      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
	        result[index] = mapping ? call(iterator, mapfn, [step.value, index], true) : step.value;
	      }
	    } else {
	      length = toLength(O.length);
	      for(result = new C(length); length > index; index++){
	        result[index] = mapping ? mapfn(O[index], index) : O[index];
	      }
	    }
	    result.length = index;
	    return result;
	  }
	});


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(28);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 28 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(7);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(31);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(32);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 32 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators = __webpack_require__(23)
	  , ITERATOR  = __webpack_require__(20)('iterator');
	module.exports = function(it){
	  return (Iterators.Array || Array.prototype[ITERATOR]) === it;
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(6)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(36)
	  , ITERATOR  = __webpack_require__(20)('iterator')
	  , Iterators = __webpack_require__(23);
	module.exports = __webpack_require__(12).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
	};

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(37)
	  , TAG = __webpack_require__(20)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 37 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var SYMBOL_ITERATOR = __webpack_require__(20)('iterator')
	  , SAFE_CLOSING    = false;
	try {
	  var riter = [7][SYMBOL_ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }
	module.exports = function(exec){
	  if(!SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[SYMBOL_ITERATOR]();
	    iter.next = function(){ safe = true; };
	    arr[SYMBOL_ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _getIterator = __webpack_require__(40)["default"];

	var _isIterable = __webpack_require__(49)["default"];

	exports["default"] = (function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;

	    try {
	      for (var _i = _getIterator(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);

	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }

	    return _arr;
	  }

	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (_isIterable(Object(arr))) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	})();

	exports.__esModule = true;

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(41), __esModule: true };

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(42);
	__webpack_require__(4);
	module.exports = __webpack_require__(48);

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(43);
	var Iterators = __webpack_require__(23);
	Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var setUnscope = __webpack_require__(44)
	  , step       = __webpack_require__(45)
	  , Iterators  = __webpack_require__(23)
	  , toIObject  = __webpack_require__(46);

	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	__webpack_require__(8)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');

	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;

	setUnscope('keys');
	setUnscope('values');
	setUnscope('entries');

/***/ },
/* 44 */
/***/ function(module, exports) {

	module.exports = function(){ /* empty */ };

/***/ },
/* 45 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(47)
	  , defined = __webpack_require__(7);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	// indexed object, fallback for non-array-like ES3 strings
	var cof = __webpack_require__(37);
	module.exports = 0 in Object('z') ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(31)
	  , get      = __webpack_require__(35);
	module.exports = __webpack_require__(12).getIterator = function(it){
	  var iterFn = get(it);
	  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
	  return anObject(iterFn.call(it));
	};

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(50), __esModule: true };

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(42);
	__webpack_require__(4);
	module.exports = __webpack_require__(51);

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(36)
	  , ITERATOR  = __webpack_require__(20)('iterator')
	  , Iterators = __webpack_require__(23);
	module.exports = __webpack_require__(12).isIterable = function(it){
	  var O = Object(it);
	  return ITERATOR in O || '@@iterator' in O || Iterators.hasOwnProperty(classof(O));
	};

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(53), __esModule: true };

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(4);
	__webpack_require__(42);
	module.exports = __webpack_require__(20)('iterator');

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {// This method of obtaining a reference to the global object needs to be
	// kept identical to the way it is obtained in runtime.js
	var g =
	  typeof global === "object" ? global :
	  typeof window === "object" ? window :
	  typeof self === "object" ? self : this;

	// Use `getOwnPropertyNames` because not all browsers support calling
	// `hasOwnProperty` on the global `self` object in a worker. See #183.
	var hadRuntime = g.regeneratorRuntime &&
	  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

	// Save the old regeneratorRuntime in case it needs to be restored later.
	var oldRuntime = hadRuntime && g.regeneratorRuntime;

	// Force reevalutation of runtime.js.
	g.regeneratorRuntime = undefined;

	module.exports = __webpack_require__(55);

	if (hadRuntime) {
	  // Restore the original runtime.
	  g.regeneratorRuntime = oldRuntime;
	} else {
	  // Remove the global property added by runtime.js.
	  try {
	    delete g.regeneratorRuntime;
	  } catch(e) {
	    g.regeneratorRuntime = undefined;
	  }
	}

	module.exports = { "default": module.exports, __esModule: true };

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {/**
	 * Copyright (c) 2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
	 * additional grant of patent rights can be found in the PATENTS file in
	 * the same directory.
	 */

	"use strict";

	var _Symbol = __webpack_require__(57)["default"];

	var _Symbol$iterator = __webpack_require__(52)["default"];

	var _Object$create = __webpack_require__(63)["default"];

	var _Promise = __webpack_require__(65)["default"];

	!(function (global) {
	  "use strict";

	  var hasOwn = Object.prototype.hasOwnProperty;
	  var undefined; // More compressible than void 0.
	  var iteratorSymbol = typeof _Symbol === "function" && _Symbol$iterator || "@@iterator";

	  var inModule = typeof module === "object";
	  var runtime = global.regeneratorRuntime;
	  if (runtime) {
	    if (inModule) {
	      // If regeneratorRuntime is defined globally and we're in a module,
	      // make the exports object identical to regeneratorRuntime.
	      module.exports = runtime;
	    }
	    // Don't bother evaluating the rest of this file if the runtime was
	    // already defined globally.
	    return;
	  }

	  // Define the runtime globally (as expected by generated code) as either
	  // module.exports (if we're in a module) or a new, empty object.
	  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

	  function wrap(innerFn, outerFn, self, tryLocsList) {
	    // If outerFn provided, then outerFn.prototype instanceof Generator.
	    var generator = _Object$create((outerFn || Generator).prototype);

	    generator._invoke = makeInvokeMethod(innerFn, self || null, new Context(tryLocsList || []));

	    return generator;
	  }
	  runtime.wrap = wrap;

	  // Try/catch helper to minimize deoptimizations. Returns a completion
	  // record like context.tryEntries[i].completion. This interface could
	  // have been (and was previously) designed to take a closure to be
	  // invoked without arguments, but in all the cases we care about we
	  // already have an existing method we want to call, so there's no need
	  // to create a new function object. We can even get away with assuming
	  // the method takes exactly one argument, since that happens to be true
	  // in every case, so we don't have to touch the arguments object. The
	  // only additional allocation required is the completion record, which
	  // has a stable shape and so hopefully should be cheap to allocate.
	  function tryCatch(fn, obj, arg) {
	    try {
	      return { type: "normal", arg: fn.call(obj, arg) };
	    } catch (err) {
	      return { type: "throw", arg: err };
	    }
	  }

	  var GenStateSuspendedStart = "suspendedStart";
	  var GenStateSuspendedYield = "suspendedYield";
	  var GenStateExecuting = "executing";
	  var GenStateCompleted = "completed";

	  // Returning this object from the innerFn has the same effect as
	  // breaking out of the dispatch switch statement.
	  var ContinueSentinel = {};

	  // Dummy constructor functions that we use as the .constructor and
	  // .constructor.prototype properties for functions that return Generator
	  // objects. For full spec compliance, you may wish to configure your
	  // minifier not to mangle the names of these two functions.
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}

	  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
	  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	  GeneratorFunctionPrototype.constructor = GeneratorFunction;
	  GeneratorFunction.displayName = "GeneratorFunction";

	  // Helper for defining the .next, .throw, and .return methods of the
	  // Iterator interface in terms of a single ._invoke method.
	  function defineIteratorMethods(prototype) {
	    ["next", "throw", "return"].forEach(function (method) {
	      prototype[method] = function (arg) {
	        return this._invoke(method, arg);
	      };
	    });
	  }

	  runtime.isGeneratorFunction = function (genFun) {
	    var ctor = typeof genFun === "function" && genFun.constructor;
	    return ctor ? ctor === GeneratorFunction ||
	    // For the native GeneratorFunction constructor, the best we can
	    // do is to check its .name property.
	    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
	  };

	  runtime.mark = function (genFun) {
	    genFun.__proto__ = GeneratorFunctionPrototype;
	    genFun.prototype = _Object$create(Gp);
	    return genFun;
	  };

	  // Within the body of any async function, `await x` is transformed to
	  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	  // `value instanceof AwaitArgument` to determine if the yielded value is
	  // meant to be awaited. Some may consider the name of this method too
	  // cutesy, but they are curmudgeons.
	  runtime.awrap = function (arg) {
	    return new AwaitArgument(arg);
	  };

	  function AwaitArgument(arg) {
	    this.arg = arg;
	  }

	  function AsyncIterator(generator) {
	    // This invoke function is written in a style that assumes some
	    // calling function (or Promise) will handle exceptions.
	    function invoke(method, arg) {
	      var result = generator[method](arg);
	      var value = result.value;
	      return value instanceof AwaitArgument ? _Promise.resolve(value.arg).then(invokeNext, invokeThrow) : _Promise.resolve(value).then(function (unwrapped) {
	        // When a yielded Promise is resolved, its final value becomes
	        // the .value of the Promise<{value,done}> result for the
	        // current iteration. If the Promise is rejected, however, the
	        // result for this iteration will be rejected with the same
	        // reason. Note that rejections of yielded Promises are not
	        // thrown back into the generator function, as is the case
	        // when an awaited Promise is rejected. This difference in
	        // behavior between yield and await is important, because it
	        // allows the consumer to decide what to do with the yielded
	        // rejection (swallow it and continue, manually .throw it back
	        // into the generator, abandon iteration, whatever). With
	        // await, by contrast, there is no opportunity to examine the
	        // rejection reason outside the generator function, so the
	        // only option is to throw it from the await expression, and
	        // let the generator function handle the exception.
	        result.value = unwrapped;
	        return result;
	      });
	    }

	    if (typeof process === "object" && process.domain) {
	      invoke = process.domain.bind(invoke);
	    }

	    var invokeNext = invoke.bind(generator, "next");
	    var invokeThrow = invoke.bind(generator, "throw");
	    var invokeReturn = invoke.bind(generator, "return");
	    var previousPromise;

	    function enqueue(method, arg) {
	      var enqueueResult =
	      // If enqueue has been called before, then we want to wait until
	      // all previous Promises have been resolved before calling invoke,
	      // so that results are always delivered in the correct order. If
	      // enqueue has not been called before, then it is important to
	      // call invoke immediately, without waiting on a callback to fire,
	      // so that the async generator function has the opportunity to do
	      // any necessary setup in a predictable way. This predictability
	      // is why the Promise constructor synchronously invokes its
	      // executor callback, and why async functions synchronously
	      // execute code before the first await. Since we implement simple
	      // async functions in terms of async generators, it is especially
	      // important to get this right, even though it requires care.
	      previousPromise ? previousPromise.then(function () {
	        return invoke(method, arg);
	      }) : new _Promise(function (resolve) {
	        resolve(invoke(method, arg));
	      });

	      // Avoid propagating enqueueResult failures to Promises returned by
	      // later invocations of the iterator.
	      previousPromise = enqueueResult["catch"](function (ignored) {});

	      return enqueueResult;
	    }

	    // Define the unified helper method that is used to implement .next,
	    // .throw, and .return (see defineIteratorMethods).
	    this._invoke = enqueue;
	  }

	  defineIteratorMethods(AsyncIterator.prototype);

	  // Note that simple async functions are implemented on top of
	  // AsyncIterator objects; they just return a Promise for the value of
	  // the final result produced by the iterator.
	  runtime.async = function (innerFn, outerFn, self, tryLocsList) {
	    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));

	    return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
	    : iter.next().then(function (result) {
	      return result.done ? result.value : iter.next();
	    });
	  };

	  function makeInvokeMethod(innerFn, self, context) {
	    var state = GenStateSuspendedStart;

	    return function invoke(method, arg) {
	      if (state === GenStateExecuting) {
	        throw new Error("Generator is already running");
	      }

	      if (state === GenStateCompleted) {
	        if (method === "throw") {
	          throw arg;
	        }

	        // Be forgiving, per 25.3.3.3.3 of the spec:
	        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
	        return doneResult();
	      }

	      while (true) {
	        var delegate = context.delegate;
	        if (delegate) {
	          if (method === "return" || method === "throw" && delegate.iterator[method] === undefined) {
	            // A return or throw (when the delegate iterator has no throw
	            // method) always terminates the yield* loop.
	            context.delegate = null;

	            // If the delegate iterator has a return method, give it a
	            // chance to clean up.
	            var returnMethod = delegate.iterator["return"];
	            if (returnMethod) {
	              var record = tryCatch(returnMethod, delegate.iterator, arg);
	              if (record.type === "throw") {
	                // If the return method threw an exception, let that
	                // exception prevail over the original return or throw.
	                method = "throw";
	                arg = record.arg;
	                continue;
	              }
	            }

	            if (method === "return") {
	              // Continue with the outer return, now that the delegate
	              // iterator has been terminated.
	              continue;
	            }
	          }

	          var record = tryCatch(delegate.iterator[method], delegate.iterator, arg);

	          if (record.type === "throw") {
	            context.delegate = null;

	            // Like returning generator.throw(uncaught), but without the
	            // overhead of an extra function call.
	            method = "throw";
	            arg = record.arg;
	            continue;
	          }

	          // Delegate generator ran and handled its own exceptions so
	          // regardless of what the method was, we continue as if it is
	          // "next" with an undefined arg.
	          method = "next";
	          arg = undefined;

	          var info = record.arg;
	          if (info.done) {
	            context[delegate.resultName] = info.value;
	            context.next = delegate.nextLoc;
	          } else {
	            state = GenStateSuspendedYield;
	            return info;
	          }

	          context.delegate = null;
	        }

	        if (method === "next") {
	          if (state === GenStateSuspendedYield) {
	            context.sent = arg;
	          } else {
	            context.sent = undefined;
	          }
	        } else if (method === "throw") {
	          if (state === GenStateSuspendedStart) {
	            state = GenStateCompleted;
	            throw arg;
	          }

	          if (context.dispatchException(arg)) {
	            // If the dispatched exception was caught by a catch block,
	            // then let that catch block handle the exception normally.
	            method = "next";
	            arg = undefined;
	          }
	        } else if (method === "return") {
	          context.abrupt("return", arg);
	        }

	        state = GenStateExecuting;

	        var record = tryCatch(innerFn, self, context);
	        if (record.type === "normal") {
	          // If an exception is thrown from innerFn, we leave state ===
	          // GenStateExecuting and loop back for another invocation.
	          state = context.done ? GenStateCompleted : GenStateSuspendedYield;

	          var info = {
	            value: record.arg,
	            done: context.done
	          };

	          if (record.arg === ContinueSentinel) {
	            if (context.delegate && method === "next") {
	              // Deliberately forget the last sent value so that we don't
	              // accidentally pass it on to the delegate.
	              arg = undefined;
	            }
	          } else {
	            return info;
	          }
	        } else if (record.type === "throw") {
	          state = GenStateCompleted;
	          // Dispatch the exception by looping back around to the
	          // context.dispatchException(arg) call above.
	          method = "throw";
	          arg = record.arg;
	        }
	      }
	    };
	  }

	  // Define Generator.prototype.{next,throw,return} in terms of the
	  // unified ._invoke helper method.
	  defineIteratorMethods(Gp);

	  Gp[iteratorSymbol] = function () {
	    return this;
	  };

	  Gp.toString = function () {
	    return "[object Generator]";
	  };

	  function pushTryEntry(locs) {
	    var entry = { tryLoc: locs[0] };

	    if (1 in locs) {
	      entry.catchLoc = locs[1];
	    }

	    if (2 in locs) {
	      entry.finallyLoc = locs[2];
	      entry.afterLoc = locs[3];
	    }

	    this.tryEntries.push(entry);
	  }

	  function resetTryEntry(entry) {
	    var record = entry.completion || {};
	    record.type = "normal";
	    delete record.arg;
	    entry.completion = record;
	  }

	  function Context(tryLocsList) {
	    // The root entry object (effectively a try statement without a catch
	    // or a finally block) gives us a place to store values thrown from
	    // locations where there is no enclosing try statement.
	    this.tryEntries = [{ tryLoc: "root" }];
	    tryLocsList.forEach(pushTryEntry, this);
	    this.reset(true);
	  }

	  runtime.keys = function (object) {
	    var keys = [];
	    for (var key in object) {
	      keys.push(key);
	    }
	    keys.reverse();

	    // Rather than returning an object with a next method, we keep
	    // things simple and return the next function itself.
	    return function next() {
	      while (keys.length) {
	        var key = keys.pop();
	        if (key in object) {
	          next.value = key;
	          next.done = false;
	          return next;
	        }
	      }

	      // To avoid creating an additional object, we just hang the .value
	      // and .done properties off the next function object itself. This
	      // also ensures that the minifier will not anonymize the function.
	      next.done = true;
	      return next;
	    };
	  };

	  function values(iterable) {
	    if (iterable) {
	      var iteratorMethod = iterable[iteratorSymbol];
	      if (iteratorMethod) {
	        return iteratorMethod.call(iterable);
	      }

	      if (typeof iterable.next === "function") {
	        return iterable;
	      }

	      if (!isNaN(iterable.length)) {
	        var i = -1,
	            next = function next() {
	          while (++i < iterable.length) {
	            if (hasOwn.call(iterable, i)) {
	              next.value = iterable[i];
	              next.done = false;
	              return next;
	            }
	          }

	          next.value = undefined;
	          next.done = true;

	          return next;
	        };

	        return next.next = next;
	      }
	    }

	    // Return an iterator with no values.
	    return { next: doneResult };
	  }
	  runtime.values = values;

	  function doneResult() {
	    return { value: undefined, done: true };
	  }

	  Context.prototype = {
	    constructor: Context,

	    reset: function reset(skipTempReset) {
	      this.prev = 0;
	      this.next = 0;
	      this.sent = undefined;
	      this.done = false;
	      this.delegate = null;

	      this.tryEntries.forEach(resetTryEntry);

	      if (!skipTempReset) {
	        for (var name in this) {
	          // Not sure about the optimal order of these conditions:
	          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
	            this[name] = undefined;
	          }
	        }
	      }
	    },

	    stop: function stop() {
	      this.done = true;

	      var rootEntry = this.tryEntries[0];
	      var rootRecord = rootEntry.completion;
	      if (rootRecord.type === "throw") {
	        throw rootRecord.arg;
	      }

	      return this.rval;
	    },

	    dispatchException: function dispatchException(exception) {
	      if (this.done) {
	        throw exception;
	      }

	      var context = this;
	      function handle(loc, caught) {
	        record.type = "throw";
	        record.arg = exception;
	        context.next = loc;
	        return !!caught;
	      }

	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        var record = entry.completion;

	        if (entry.tryLoc === "root") {
	          // Exception thrown outside of any try block that could handle
	          // it, so set the completion value of the entire function to
	          // throw the exception.
	          return handle("end");
	        }

	        if (entry.tryLoc <= this.prev) {
	          var hasCatch = hasOwn.call(entry, "catchLoc");
	          var hasFinally = hasOwn.call(entry, "finallyLoc");

	          if (hasCatch && hasFinally) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            } else if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }
	          } else if (hasCatch) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            }
	          } else if (hasFinally) {
	            if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }
	          } else {
	            throw new Error("try statement without catch or finally");
	          }
	        }
	      }
	    },

	    abrupt: function abrupt(type, arg) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
	          var finallyEntry = entry;
	          break;
	        }
	      }

	      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
	        // Ignore the finally entry if control is not jumping to a
	        // location outside the try/catch block.
	        finallyEntry = null;
	      }

	      var record = finallyEntry ? finallyEntry.completion : {};
	      record.type = type;
	      record.arg = arg;

	      if (finallyEntry) {
	        this.next = finallyEntry.finallyLoc;
	      } else {
	        this.complete(record);
	      }

	      return ContinueSentinel;
	    },

	    complete: function complete(record, afterLoc) {
	      if (record.type === "throw") {
	        throw record.arg;
	      }

	      if (record.type === "break" || record.type === "continue") {
	        this.next = record.arg;
	      } else if (record.type === "return") {
	        this.rval = record.arg;
	        this.next = "end";
	      } else if (record.type === "normal" && afterLoc) {
	        this.next = afterLoc;
	      }
	    },

	    finish: function finish(finallyLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.finallyLoc === finallyLoc) {
	          this.complete(entry.completion, entry.afterLoc);
	          resetTryEntry(entry);
	          return ContinueSentinel;
	        }
	      }
	    },

	    "catch": function _catch(tryLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc === tryLoc) {
	          var record = entry.completion;
	          if (record.type === "throw") {
	            var thrown = record.arg;
	            resetTryEntry(entry);
	          }
	          return thrown;
	        }
	      }

	      // The context.catch method must only be called with a location
	      // argument that corresponds to a known catch block.
	      throw new Error("illegal catch attempt");
	    },

	    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
	      this.delegate = {
	        iterator: values(iterable),
	        resultName: resultName,
	        nextLoc: nextLoc
	      };

	      return ContinueSentinel;
	    }
	  };
	})(
	// Among the various tricks for obtaining a reference to the global
	// object, this seems to be the most reliable technique that does not
	// use indirect eval (which violates Content Security Policy).
	typeof global === "object" ? global : typeof window === "object" ? window : typeof self === "object" ? self : undefined);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(56)))

/***/ },
/* 56 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(58), __esModule: true };

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(59);
	module.exports = __webpack_require__(12).Symbol;

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// ECMAScript 6 symbols shim
	var $              = __webpack_require__(15)
	  , global         = __webpack_require__(11)
	  , has            = __webpack_require__(19)
	  , SUPPORT_DESC   = __webpack_require__(17)
	  , $def           = __webpack_require__(10)
	  , $redef         = __webpack_require__(13)
	  , $fails         = __webpack_require__(18)
	  , shared         = __webpack_require__(21)
	  , setTag         = __webpack_require__(25)
	  , uid            = __webpack_require__(22)
	  , wks            = __webpack_require__(20)
	  , keyOf          = __webpack_require__(60)
	  , $names         = __webpack_require__(61)
	  , enumKeys       = __webpack_require__(62)
	  , isObject       = __webpack_require__(32)
	  , anObject       = __webpack_require__(31)
	  , toIObject      = __webpack_require__(46)
	  , createDesc     = __webpack_require__(16)
	  , getDesc        = $.getDesc
	  , setDesc        = $.setDesc
	  , _create        = $.create
	  , getNames       = $names.get
	  , $Symbol        = global.Symbol
	  , setter         = false
	  , HIDDEN         = wks('_hidden')
	  , isEnum         = $.isEnum
	  , SymbolRegistry = shared('symbol-registry')
	  , AllSymbols     = shared('symbols')
	  , useNative      = typeof $Symbol == 'function'
	  , ObjectProto    = Object.prototype;

	// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
	var setSymbolDesc = SUPPORT_DESC && $fails(function(){
	  return _create(setDesc({}, 'a', {
	    get: function(){ return setDesc(this, 'a', {value: 7}).a; }
	  })).a != 7;
	}) ? function(it, key, D){
	  var protoDesc = getDesc(ObjectProto, key);
	  if(protoDesc)delete ObjectProto[key];
	  setDesc(it, key, D);
	  if(protoDesc && it !== ObjectProto)setDesc(ObjectProto, key, protoDesc);
	} : setDesc;

	var wrap = function(tag){
	  var sym = AllSymbols[tag] = _create($Symbol.prototype);
	  sym._k = tag;
	  SUPPORT_DESC && setter && setSymbolDesc(ObjectProto, tag, {
	    configurable: true,
	    set: function(value){
	      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
	      setSymbolDesc(this, tag, createDesc(1, value));
	    }
	  });
	  return sym;
	};

	var $defineProperty = function defineProperty(it, key, D){
	  if(D && has(AllSymbols, key)){
	    if(!D.enumerable){
	      if(!has(it, HIDDEN))setDesc(it, HIDDEN, createDesc(1, {}));
	      it[HIDDEN][key] = true;
	    } else {
	      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
	      D = _create(D, {enumerable: createDesc(0, false)});
	    } return setSymbolDesc(it, key, D);
	  } return setDesc(it, key, D);
	};
	var $defineProperties = function defineProperties(it, P){
	  anObject(it);
	  var keys = enumKeys(P = toIObject(P))
	    , i    = 0
	    , l = keys.length
	    , key;
	  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
	  return it;
	};
	var $create = function create(it, P){
	  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
	};
	var $propertyIsEnumerable = function propertyIsEnumerable(key){
	  var E = isEnum.call(this, key);
	  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key]
	    ? E : true;
	};
	var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
	  var D = getDesc(it = toIObject(it), key);
	  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
	  return D;
	};
	var $getOwnPropertyNames = function getOwnPropertyNames(it){
	  var names  = getNames(toIObject(it))
	    , result = []
	    , i      = 0
	    , key;
	  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN)result.push(key);
	  return result;
	};
	var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
	  var names  = getNames(toIObject(it))
	    , result = []
	    , i      = 0
	    , key;
	  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
	  return result;
	};

	// 19.4.1.1 Symbol([description])
	if(!useNative){
	  $Symbol = function Symbol(){
	    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor');
	    return wrap(uid(arguments[0]));
	  };
	  $redef($Symbol.prototype, 'toString', function toString(){
	    return this._k;
	  });

	  $.create     = $create;
	  $.isEnum     = $propertyIsEnumerable;
	  $.getDesc    = $getOwnPropertyDescriptor;
	  $.setDesc    = $defineProperty;
	  $.setDescs   = $defineProperties;
	  $.getNames   = $names.get = $getOwnPropertyNames;
	  $.getSymbols = $getOwnPropertySymbols;

	  if(SUPPORT_DESC && !__webpack_require__(9)){
	    $redef(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
	  }
	}

	// MS Edge converts symbol values to JSON as {}
	if(!useNative || $fails(function(){
	  return JSON.stringify([$Symbol()]) != '[null]';
	}))$redef($Symbol.prototype, 'toJSON', function toJSON(){
	  if(useNative && isObject(this))return this;
	});

	var symbolStatics = {
	  // 19.4.2.1 Symbol.for(key)
	  'for': function(key){
	    return has(SymbolRegistry, key += '')
	      ? SymbolRegistry[key]
	      : SymbolRegistry[key] = $Symbol(key);
	  },
	  // 19.4.2.5 Symbol.keyFor(sym)
	  keyFor: function keyFor(key){
	    return keyOf(SymbolRegistry, key);
	  },
	  useSetter: function(){ setter = true; },
	  useSimple: function(){ setter = false; }
	};
	// 19.4.2.2 Symbol.hasInstance
	// 19.4.2.3 Symbol.isConcatSpreadable
	// 19.4.2.4 Symbol.iterator
	// 19.4.2.6 Symbol.match
	// 19.4.2.8 Symbol.replace
	// 19.4.2.9 Symbol.search
	// 19.4.2.10 Symbol.species
	// 19.4.2.11 Symbol.split
	// 19.4.2.12 Symbol.toPrimitive
	// 19.4.2.13 Symbol.toStringTag
	// 19.4.2.14 Symbol.unscopables
	$.each.call((
	    'hasInstance,isConcatSpreadable,iterator,match,replace,search,' +
	    'species,split,toPrimitive,toStringTag,unscopables'
	  ).split(','), function(it){
	    var sym = wks(it);
	    symbolStatics[it] = useNative ? sym : wrap(sym);
	  }
	);

	setter = true;

	$def($def.G + $def.W, {Symbol: $Symbol});

	$def($def.S, 'Symbol', symbolStatics);

	$def($def.S + $def.F * !useNative, 'Object', {
	  // 19.1.2.2 Object.create(O [, Properties])
	  create: $create,
	  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
	  defineProperty: $defineProperty,
	  // 19.1.2.3 Object.defineProperties(O, Properties)
	  defineProperties: $defineProperties,
	  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
	  // 19.1.2.7 Object.getOwnPropertyNames(O)
	  getOwnPropertyNames: $getOwnPropertyNames,
	  // 19.1.2.8 Object.getOwnPropertySymbols(O)
	  getOwnPropertySymbols: $getOwnPropertySymbols
	});

	// 19.4.3.5 Symbol.prototype[@@toStringTag]
	setTag($Symbol, 'Symbol');
	// 20.2.1.9 Math[@@toStringTag]
	setTag(Math, 'Math', true);
	// 24.3.3 JSON[@@toStringTag]
	setTag(global.JSON, 'JSON', true);

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var $         = __webpack_require__(15)
	  , toIObject = __webpack_require__(46);
	module.exports = function(object, el){
	  var O      = toIObject(object)
	    , keys   = $.getKeys(O)
	    , length = keys.length
	    , index  = 0
	    , key;
	  while(length > index)if(O[key = keys[index++]] === el)return key;
	};

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
	var toString  = {}.toString
	  , toIObject = __webpack_require__(46)
	  , getNames  = __webpack_require__(15).getNames;

	var windowNames = typeof window == 'object' && Object.getOwnPropertyNames
	  ? Object.getOwnPropertyNames(window) : [];

	var getWindowNames = function(it){
	  try {
	    return getNames(it);
	  } catch(e){
	    return windowNames.slice();
	  }
	};

	module.exports.get = function getOwnPropertyNames(it){
	  if(windowNames && toString.call(it) == '[object Window]')return getWindowNames(it);
	  return getNames(toIObject(it));
	};

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	// all enumerable object keys, includes symbols
	var $ = __webpack_require__(15);
	module.exports = function(it){
	  var keys       = $.getKeys(it)
	    , getSymbols = $.getSymbols;
	  if(getSymbols){
	    var symbols = getSymbols(it)
	      , isEnum  = $.isEnum
	      , i       = 0
	      , key;
	    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))keys.push(key);
	  }
	  return keys;
	};

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(64), __esModule: true };

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(15);
	module.exports = function create(P, D){
	  return $.create(P, D);
	};

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(66), __esModule: true };

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(67);
	__webpack_require__(4);
	__webpack_require__(42);
	__webpack_require__(68);
	module.exports = __webpack_require__(12).Promise;

/***/ },
/* 67 */
/***/ function(module, exports) {

	

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $          = __webpack_require__(15)
	  , LIBRARY    = __webpack_require__(9)
	  , global     = __webpack_require__(11)
	  , ctx        = __webpack_require__(27)
	  , classof    = __webpack_require__(36)
	  , $def       = __webpack_require__(10)
	  , isObject   = __webpack_require__(32)
	  , anObject   = __webpack_require__(31)
	  , aFunction  = __webpack_require__(28)
	  , strictNew  = __webpack_require__(69)
	  , forOf      = __webpack_require__(70)
	  , setProto   = __webpack_require__(71).set
	  , same       = __webpack_require__(72)
	  , species    = __webpack_require__(73)
	  , SPECIES    = __webpack_require__(20)('species')
	  , RECORD     = __webpack_require__(22)('record')
	  , asap       = __webpack_require__(74)
	  , PROMISE    = 'Promise'
	  , process    = global.process
	  , isNode     = classof(process) == 'process'
	  , P          = global[PROMISE]
	  , Wrapper;

	var testResolve = function(sub){
	  var test = new P(function(){});
	  if(sub)test.constructor = Object;
	  return P.resolve(test) === test;
	};

	var useNative = function(){
	  var works = false;
	  function P2(x){
	    var self = new P(x);
	    setProto(self, P2.prototype);
	    return self;
	  }
	  try {
	    works = P && P.resolve && testResolve();
	    setProto(P2, P);
	    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
	    // actual Firefox has broken subclass support, test that
	    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
	      works = false;
	    }
	    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
	    if(works && __webpack_require__(17)){
	      var thenableThenGotten = false;
	      P.resolve($.setDesc({}, 'then', {
	        get: function(){ thenableThenGotten = true; }
	      }));
	      works = thenableThenGotten;
	    }
	  } catch(e){ works = false; }
	  return works;
	}();

	// helpers
	var isPromise = function(it){
	  return isObject(it) && (useNative ? classof(it) == 'Promise' : RECORD in it);
	};
	var sameConstructor = function(a, b){
	  // library wrapper special case
	  if(LIBRARY && a === P && b === Wrapper)return true;
	  return same(a, b);
	};
	var getConstructor = function(C){
	  var S = anObject(C)[SPECIES];
	  return S != undefined ? S : C;
	};
	var isThenable = function(it){
	  var then;
	  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
	};
	var notify = function(record, isReject){
	  if(record.n)return;
	  record.n = true;
	  var chain = record.c;
	  asap(function(){
	    var value = record.v
	      , ok    = record.s == 1
	      , i     = 0;
	    var run = function(react){
	      var cb = ok ? react.ok : react.fail
	        , ret, then;
	      try {
	        if(cb){
	          if(!ok)record.h = true;
	          ret = cb === true ? value : cb(value);
	          if(ret === react.P){
	            react.rej(TypeError('Promise-chain cycle'));
	          } else if(then = isThenable(ret)){
	            then.call(ret, react.res, react.rej);
	          } else react.res(ret);
	        } else react.rej(value);
	      } catch(err){
	        react.rej(err);
	      }
	    };
	    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
	    chain.length = 0;
	    record.n = false;
	    if(isReject)setTimeout(function(){
	      var promise = record.p
	        , handler, console;
	      if(isUnhandled(promise)){
	        if(isNode){
	          process.emit('unhandledRejection', value, promise);
	        } else if(handler = global.onunhandledrejection){
	          handler({promise: promise, reason: value});
	        } else if((console = global.console) && console.error){
	          console.error('Unhandled promise rejection', value);
	        }
	      } record.a = undefined;
	    }, 1);
	  });
	};
	var isUnhandled = function(promise){
	  var record = promise[RECORD]
	    , chain  = record.a || record.c
	    , i      = 0
	    , react;
	  if(record.h)return false;
	  while(chain.length > i){
	    react = chain[i++];
	    if(react.fail || !isUnhandled(react.P))return false;
	  } return true;
	};
	var $reject = function(value){
	  var record = this;
	  if(record.d)return;
	  record.d = true;
	  record = record.r || record; // unwrap
	  record.v = value;
	  record.s = 2;
	  record.a = record.c.slice();
	  notify(record, true);
	};
	var $resolve = function(value){
	  var record = this
	    , then;
	  if(record.d)return;
	  record.d = true;
	  record = record.r || record; // unwrap
	  try {
	    if(then = isThenable(value)){
	      asap(function(){
	        var wrapper = {r: record, d: false}; // wrap
	        try {
	          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
	        } catch(e){
	          $reject.call(wrapper, e);
	        }
	      });
	    } else {
	      record.v = value;
	      record.s = 1;
	      notify(record, false);
	    }
	  } catch(e){
	    $reject.call({r: record, d: false}, e); // wrap
	  }
	};

	// constructor polyfill
	if(!useNative){
	  // 25.4.3.1 Promise(executor)
	  P = function Promise(executor){
	    aFunction(executor);
	    var record = {
	      p: strictNew(this, P, PROMISE),         // <- promise
	      c: [],                                  // <- awaiting reactions
	      a: undefined,                           // <- checked in isUnhandled reactions
	      s: 0,                                   // <- state
	      d: false,                               // <- done
	      v: undefined,                           // <- value
	      h: false,                               // <- handled rejection
	      n: false                                // <- notify
	    };
	    this[RECORD] = record;
	    try {
	      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
	    } catch(err){
	      $reject.call(record, err);
	    }
	  };
	  __webpack_require__(79)(P.prototype, {
	    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
	    then: function then(onFulfilled, onRejected){
	      var S = anObject(anObject(this).constructor)[SPECIES];
	      var react = {
	        ok:   typeof onFulfilled == 'function' ? onFulfilled : true,
	        fail: typeof onRejected == 'function'  ? onRejected  : false
	      };
	      var promise = react.P = new (S != undefined ? S : P)(function(res, rej){
	        react.res = res;
	        react.rej = rej;
	      });
	      aFunction(react.res);
	      aFunction(react.rej);
	      var record = this[RECORD];
	      record.c.push(react);
	      if(record.a)record.a.push(react);
	      if(record.s)notify(record, false);
	      return promise;
	    },
	    // 25.4.5.1 Promise.prototype.catch(onRejected)
	    'catch': function(onRejected){
	      return this.then(undefined, onRejected);
	    }
	  });
	}

	// export
	$def($def.G + $def.W + $def.F * !useNative, {Promise: P});
	__webpack_require__(25)(P, PROMISE);
	species(P);
	species(Wrapper = __webpack_require__(12)[PROMISE]);

	// statics
	$def($def.S + $def.F * !useNative, PROMISE, {
	  // 25.4.4.5 Promise.reject(r)
	  reject: function reject(r){
	    return new this(function(res, rej){ rej(r); });
	  }
	});
	$def($def.S + $def.F * (!useNative || testResolve(true)), PROMISE, {
	  // 25.4.4.6 Promise.resolve(x)
	  resolve: function resolve(x){
	    return isPromise(x) && sameConstructor(x.constructor, this)
	      ? x : new this(function(res){ res(x); });
	  }
	});
	$def($def.S + $def.F * !(useNative && __webpack_require__(38)(function(iter){
	  P.all(iter)['catch'](function(){});
	})), PROMISE, {
	  // 25.4.4.1 Promise.all(iterable)
	  all: function all(iterable){
	    var C      = getConstructor(this)
	      , values = [];
	    return new C(function(res, rej){
	      forOf(iterable, false, values.push, values);
	      var remaining = values.length
	        , results   = Array(remaining);
	      if(remaining)$.each.call(values, function(promise, index){
	        C.resolve(promise).then(function(value){
	          results[index] = value;
	          --remaining || res(results);
	        }, rej);
	      });
	      else res(results);
	    });
	  },
	  // 25.4.4.4 Promise.race(iterable)
	  race: function race(iterable){
	    var C = getConstructor(this);
	    return new C(function(res, rej){
	      forOf(iterable, false, function(promise){
	        C.resolve(promise).then(res, rej);
	      });
	    });
	  }
	});

/***/ },
/* 69 */
/***/ function(module, exports) {

	module.exports = function(it, Constructor, name){
	  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
	  return it;
	};

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var ctx         = __webpack_require__(27)
	  , call        = __webpack_require__(30)
	  , isArrayIter = __webpack_require__(33)
	  , anObject    = __webpack_require__(31)
	  , toLength    = __webpack_require__(34)
	  , getIterFn   = __webpack_require__(35);
	module.exports = function(iterable, entries, fn, that){
	  var iterFn = getIterFn(iterable)
	    , f      = ctx(fn, that, entries ? 2 : 1)
	    , index  = 0
	    , length, step, iterator;
	  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
	    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
	    call(iterator, f, step.value, entries);
	  }
	};

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	// Works with __proto__ only. Old v8 can't work with null proto objects.
	/* eslint-disable no-proto */
	var getDesc  = __webpack_require__(15).getDesc
	  , isObject = __webpack_require__(32)
	  , anObject = __webpack_require__(31);
	var check = function(O, proto){
	  anObject(O);
	  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
	};
	module.exports = {
	  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line no-proto
	    function(test, buggy, set){
	      try {
	        set = __webpack_require__(27)(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
	        set(test, []);
	        buggy = !(test instanceof Array);
	      } catch(e){ buggy = true; }
	      return function setPrototypeOf(O, proto){
	        check(O, proto);
	        if(buggy)O.__proto__ = proto;
	        else set(O, proto);
	        return O;
	      };
	    }({}, false) : undefined),
	  check: check
	};

/***/ },
/* 72 */
/***/ function(module, exports) {

	module.exports = Object.is || function is(x, y){
	  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
	};

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $       = __webpack_require__(15)
	  , SPECIES = __webpack_require__(20)('species');
	module.exports = function(C){
	  if(__webpack_require__(17) && !(SPECIES in C))$.setDesc(C, SPECIES, {
	    configurable: true,
	    get: function(){ return this; }
	  });
	};

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(11)
	  , macrotask = __webpack_require__(75).set
	  , Observer  = global.MutationObserver || global.WebKitMutationObserver
	  , process   = global.process
	  , isNode    = __webpack_require__(37)(process) == 'process'
	  , head, last, notify;

	var flush = function(){
	  var parent, domain;
	  if(isNode && (parent = process.domain)){
	    process.domain = null;
	    parent.exit();
	  }
	  while(head){
	    domain = head.domain;
	    if(domain)domain.enter();
	    head.fn.call(); // <- currently we use it only for Promise - try / catch not required
	    if(domain)domain.exit();
	    head = head.next;
	  } last = undefined;
	  if(parent)parent.enter();
	}

	// Node.js
	if(isNode){
	  notify = function(){
	    process.nextTick(flush);
	  };
	// browsers with MutationObserver
	} else if(Observer){
	  var toggle = 1
	    , node   = document.createTextNode('');
	  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
	  notify = function(){
	    node.data = toggle = -toggle;
	  };
	// for other environments - macrotask based on:
	// - setImmediate
	// - MessageChannel
	// - window.postMessag
	// - onreadystatechange
	// - setTimeout
	} else {
	  notify = function(){
	    // strange IE + webpack dev server bug - use .call(global)
	    macrotask.call(global, flush);
	  };
	}

	module.exports = function asap(fn){
	  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
	  if(last)last.next = task;
	  if(!head){
	    head = task;
	    notify();
	  } last = task;
	};

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx                = __webpack_require__(27)
	  , invoke             = __webpack_require__(76)
	  , html               = __webpack_require__(77)
	  , cel                = __webpack_require__(78)
	  , global             = __webpack_require__(11)
	  , process            = global.process
	  , setTask            = global.setImmediate
	  , clearTask          = global.clearImmediate
	  , MessageChannel     = global.MessageChannel
	  , counter            = 0
	  , queue              = {}
	  , ONREADYSTATECHANGE = 'onreadystatechange'
	  , defer, channel, port;
	var run = function(){
	  var id = +this;
	  if(queue.hasOwnProperty(id)){
	    var fn = queue[id];
	    delete queue[id];
	    fn();
	  }
	};
	var listner = function(event){
	  run.call(event.data);
	};
	// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
	if(!setTask || !clearTask){
	  setTask = function setImmediate(fn){
	    var args = [], i = 1;
	    while(arguments.length > i)args.push(arguments[i++]);
	    queue[++counter] = function(){
	      invoke(typeof fn == 'function' ? fn : Function(fn), args);
	    };
	    defer(counter);
	    return counter;
	  };
	  clearTask = function clearImmediate(id){
	    delete queue[id];
	  };
	  // Node.js 0.8-
	  if(__webpack_require__(37)(process) == 'process'){
	    defer = function(id){
	      process.nextTick(ctx(run, id, 1));
	    };
	  // Browsers with MessageChannel, includes WebWorkers
	  } else if(MessageChannel){
	    channel = new MessageChannel;
	    port    = channel.port2;
	    channel.port1.onmessage = listner;
	    defer = ctx(port.postMessage, port, 1);
	  // Browsers with postMessage, skip WebWorkers
	  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
	  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScript){
	    defer = function(id){
	      global.postMessage(id + '', '*');
	    };
	    global.addEventListener('message', listner, false);
	  // IE8-
	  } else if(ONREADYSTATECHANGE in cel('script')){
	    defer = function(id){
	      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
	        html.removeChild(this);
	        run.call(id);
	      };
	    };
	  // Rest old browsers
	  } else {
	    defer = function(id){
	      setTimeout(ctx(run, id, 1), 0);
	    };
	  }
	}
	module.exports = {
	  set:   setTask,
	  clear: clearTask
	};

/***/ },
/* 76 */
/***/ function(module, exports) {

	// fast apply, http://jsperf.lnkit.com/fast-apply/5
	module.exports = function(fn, args, that){
	  var un = that === undefined;
	  switch(args.length){
	    case 0: return un ? fn()
	                      : fn.call(that);
	    case 1: return un ? fn(args[0])
	                      : fn.call(that, args[0]);
	    case 2: return un ? fn(args[0], args[1])
	                      : fn.call(that, args[0], args[1]);
	    case 3: return un ? fn(args[0], args[1], args[2])
	                      : fn.call(that, args[0], args[1], args[2]);
	    case 4: return un ? fn(args[0], args[1], args[2], args[3])
	                      : fn.call(that, args[0], args[1], args[2], args[3]);
	  } return              fn.apply(that, args);
	};

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(11).document && document.documentElement;

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(32)
	  , document = __webpack_require__(11).document
	  // in old IE typeof document.createElement is 'object'
	  , is = isObject(document) && isObject(document.createElement);
	module.exports = function(it){
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var $redef = __webpack_require__(13);
	module.exports = function(target, src){
	  for(var key in src)$redef(target, key, src[key]);
	  return target;
	};

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(81), __esModule: true };

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(82);
	module.exports = __webpack_require__(12).Object.keys;

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 Object.keys(O)
	var toObject = __webpack_require__(29);

	__webpack_require__(83)('keys', function($keys){
	  return function keys(it){
	    return $keys(toObject(it));
	  };
	});

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	// most Object methods by ES6 should accept primitives
	module.exports = function(KEY, exec){
	  var $def = __webpack_require__(10)
	    , fn   = (__webpack_require__(12).Object || {})[KEY] || Object[KEY]
	    , exp  = {};
	  exp[KEY] = exec(fn);
	  $def($def.S + $def.F * __webpack_require__(18)(function(){ fn(1); }), 'Object', exp);
	};

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(85), __esModule: true };

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(67);
	__webpack_require__(4);
	__webpack_require__(42);
	__webpack_require__(86);
	__webpack_require__(89);
	module.exports = __webpack_require__(12).Set;

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var strong = __webpack_require__(87);

	// 23.2 Set Objects
	__webpack_require__(88)('Set', function(get){
	  return function Set(){ return get(this, arguments[0]); };
	}, {
	  // 23.2.3.1 Set.prototype.add(value)
	  add: function add(value){
	    return strong.def(this, value = value === 0 ? 0 : value, value);
	  }
	}, strong);

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $            = __webpack_require__(15)
	  , hide         = __webpack_require__(14)
	  , ctx          = __webpack_require__(27)
	  , species      = __webpack_require__(73)
	  , strictNew    = __webpack_require__(69)
	  , defined      = __webpack_require__(7)
	  , forOf        = __webpack_require__(70)
	  , step         = __webpack_require__(45)
	  , ID           = __webpack_require__(22)('id')
	  , $has         = __webpack_require__(19)
	  , isObject     = __webpack_require__(32)
	  , isExtensible = Object.isExtensible || isObject
	  , SUPPORT_DESC = __webpack_require__(17)
	  , SIZE         = SUPPORT_DESC ? '_s' : 'size'
	  , id           = 0;

	var fastKey = function(it, create){
	  // return primitive with prefix
	  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
	  if(!$has(it, ID)){
	    // can't set id to frozen object
	    if(!isExtensible(it))return 'F';
	    // not necessary to add id
	    if(!create)return 'E';
	    // add missing object id
	    hide(it, ID, ++id);
	  // return object id with prefix
	  } return 'O' + it[ID];
	};

	var getEntry = function(that, key){
	  // fast case
	  var index = fastKey(key), entry;
	  if(index !== 'F')return that._i[index];
	  // frozen object case
	  for(entry = that._f; entry; entry = entry.n){
	    if(entry.k == key)return entry;
	  }
	};

	module.exports = {
	  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
	    var C = wrapper(function(that, iterable){
	      strictNew(that, C, NAME);
	      that._i = $.create(null); // index
	      that._f = undefined;      // first entry
	      that._l = undefined;      // last entry
	      that[SIZE] = 0;           // size
	      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
	    });
	    __webpack_require__(79)(C.prototype, {
	      // 23.1.3.1 Map.prototype.clear()
	      // 23.2.3.2 Set.prototype.clear()
	      clear: function clear(){
	        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
	          entry.r = true;
	          if(entry.p)entry.p = entry.p.n = undefined;
	          delete data[entry.i];
	        }
	        that._f = that._l = undefined;
	        that[SIZE] = 0;
	      },
	      // 23.1.3.3 Map.prototype.delete(key)
	      // 23.2.3.4 Set.prototype.delete(value)
	      'delete': function(key){
	        var that  = this
	          , entry = getEntry(that, key);
	        if(entry){
	          var next = entry.n
	            , prev = entry.p;
	          delete that._i[entry.i];
	          entry.r = true;
	          if(prev)prev.n = next;
	          if(next)next.p = prev;
	          if(that._f == entry)that._f = next;
	          if(that._l == entry)that._l = prev;
	          that[SIZE]--;
	        } return !!entry;
	      },
	      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
	      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
	      forEach: function forEach(callbackfn /*, that = undefined */){
	        var f = ctx(callbackfn, arguments[1], 3)
	          , entry;
	        while(entry = entry ? entry.n : this._f){
	          f(entry.v, entry.k, this);
	          // revert to the last existing entry
	          while(entry && entry.r)entry = entry.p;
	        }
	      },
	      // 23.1.3.7 Map.prototype.has(key)
	      // 23.2.3.7 Set.prototype.has(value)
	      has: function has(key){
	        return !!getEntry(this, key);
	      }
	    });
	    if(SUPPORT_DESC)$.setDesc(C.prototype, 'size', {
	      get: function(){
	        return defined(this[SIZE]);
	      }
	    });
	    return C;
	  },
	  def: function(that, key, value){
	    var entry = getEntry(that, key)
	      , prev, index;
	    // change existing entry
	    if(entry){
	      entry.v = value;
	    // create new entry
	    } else {
	      that._l = entry = {
	        i: index = fastKey(key, true), // <- index
	        k: key,                        // <- key
	        v: value,                      // <- value
	        p: prev = that._l,             // <- previous entry
	        n: undefined,                  // <- next entry
	        r: false                       // <- removed
	      };
	      if(!that._f)that._f = entry;
	      if(prev)prev.n = entry;
	      that[SIZE]++;
	      // add to index
	      if(index !== 'F')that._i[index] = entry;
	    } return that;
	  },
	  getEntry: getEntry,
	  setStrong: function(C, NAME, IS_MAP){
	    // add .keys, .values, .entries, [@@iterator]
	    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
	    __webpack_require__(8)(C, NAME, function(iterated, kind){
	      this._t = iterated;  // target
	      this._k = kind;      // kind
	      this._l = undefined; // previous
	    }, function(){
	      var that  = this
	        , kind  = that._k
	        , entry = that._l;
	      // revert to the last existing entry
	      while(entry && entry.r)entry = entry.p;
	      // get next entry
	      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
	        // or finish the iteration
	        that._t = undefined;
	        return step(1);
	      }
	      // return step by kind
	      if(kind == 'keys'  )return step(0, entry.k);
	      if(kind == 'values')return step(0, entry.v);
	      return step(0, [entry.k, entry.v]);
	    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);

	    // add [@@species], 23.1.2.2, 23.2.2.2
	    species(C);
	    species(__webpack_require__(12)[NAME]); // for wrapper
	  }
	};

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $          = __webpack_require__(15)
	  , $def       = __webpack_require__(10)
	  , hide       = __webpack_require__(14)
	  , forOf      = __webpack_require__(70)
	  , strictNew  = __webpack_require__(69);

	module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
	  var Base  = __webpack_require__(11)[NAME]
	    , C     = Base
	    , ADDER = IS_MAP ? 'set' : 'add'
	    , proto = C && C.prototype
	    , O     = {};
	  if(!__webpack_require__(17) || typeof C != 'function'
	    || !(IS_WEAK || proto.forEach && !__webpack_require__(18)(function(){ new C().entries().next(); }))
	  ){
	    // create collection constructor
	    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
	    __webpack_require__(79)(C.prototype, methods);
	  } else {
	    C = wrapper(function(target, iterable){
	      strictNew(target, C, NAME);
	      target._c = new Base;
	      if(iterable != undefined)forOf(iterable, IS_MAP, target[ADDER], target);
	    });
	    $.each.call('add,clear,delete,forEach,get,has,set,keys,values,entries'.split(','),function(KEY){
	      var chain = KEY == 'add' || KEY == 'set';
	      if(KEY in proto && !(IS_WEAK && KEY == 'clear'))hide(C.prototype, KEY, function(a, b){
	        var result = this._c[KEY](a === 0 ? 0 : a, b);
	        return chain ? this : result;
	      });
	    });
	    if('size' in proto)$.setDesc(C.prototype, 'size', {
	      get: function(){
	        return this._c.size;
	      }
	    });
	  }

	  __webpack_require__(25)(C, NAME);

	  O[NAME] = C;
	  $def($def.G + $def.W + $def.F, O);

	  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);

	  return C;
	};

/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var $def  = __webpack_require__(10);

	$def($def.P, 'Set', {toJSON: __webpack_require__(90)('Set')});

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var forOf   = __webpack_require__(70)
	  , classof = __webpack_require__(36);
	module.exports = function(NAME){
	  return function toJSON(){
	    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
	    var arr = [];
	    forOf(this, false, arr.push, arr);
	    return arr;
	  };
	};

/***/ }
/******/ ])
});
;

/***/ }),
/* 24 */
/***/ (function(module, exports) {

module.exports = require("sdk/preferences/service");

/***/ }),
/* 25 */
/***/ (function(module, exports) {

module.exports = require("sdk/simple-storage");

/***/ }),
/* 26 */
/***/ (function(module, exports) {

module.exports = require("sdk/timers");

/***/ }),
/* 27 */
/***/ (function(module, exports) {

module.exports = require("sdk/util/uuid");

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/* globals NewTabURL, EventEmitter, XPCOMUtils, Services */



const {Cu} = __webpack_require__(0);
const {data} = __webpack_require__(5);
const tabs = __webpack_require__(12);
const simplePrefs = __webpack_require__(4);
const windows = __webpack_require__(115).browserWindows;
const prefService = __webpack_require__(24);
const ss = __webpack_require__(25);
const PageModProvider = __webpack_require__(45);
const {PlacesProvider} = __webpack_require__(6);
const {SearchProvider} = __webpack_require__(51);
const {PreviewProvider} = __webpack_require__(50);
const {PerfMeter} = __webpack_require__(48);
const {AppURLHider} = __webpack_require__(32);
const am = __webpack_require__(1);
const {CONTENT_TO_ADDON, ADDON_TO_CONTENT} = __webpack_require__(8);
const {ExperimentProvider} = __webpack_require__(35);
const {PrefsProvider} = __webpack_require__(49);
const createStore = __webpack_require__(58);
const PageWorker = __webpack_require__(47);
const {PageScraper} = __webpack_require__(46);

const FeedController = __webpack_require__(53);
const feeds = __webpack_require__(42);

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/NewTabURL.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyGetter(global, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

const DEFAULT_OPTIONS = {
  pageURL: data.url("content/activity-streams.html"),
  onAddWorker: null,
  onRemoveWorker: null,
  pageScraper: null,
  pageWorker: null,
  searchProvider: null
};

const PLACES_CHANGES_EVENTS = [
  "deleteURI",
  "linkChanged",
  "manyLinksChanged",
  "bookmarkAdded",
  "bookmarkRemoved",
  "bookmarkChanged",
  "clearHistory"
];

const HOME_PAGE_PREF = "browser.startup.homepage";

const TOPIC_SYNC_COMPLETE = "services.sync.tabs.changed";

function ActivityStreams(metadataStore, tabTracker, telemetrySender, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  EventEmitter.decorate(this);
  this._pagemod = new PageModProvider({
    pageURL: this.options.pageURL,
    onAddWorker: this.options.onAddWorker,
    onRemoveWorker: this.options.onRemoveWorker
  });
  this._metadataStore = metadataStore;
  this._tabTracker = tabTracker;
  this._telemetrySender = telemetrySender;
  this._newTabURL = `${this.options.pageURL}#/`;
  Services.prefs.setIntPref("places.favicons.optimizeToDimension", 64);
  this._experimentProvider = new ExperimentProvider(
    options.experiments,
    options.rng
  );
  this._searchProvider = this.options.searchProvider || new SearchProvider();
  this._feeds = new FeedController({
    feeds,
    broadcast: this.broadcast.bind(this),
    send: this.sendById.bind(this),
    searchProvider: this._searchProvider,
    metadataStore: this._metadataStore,
    tabTracker: this._tabTracker,
    // TODO: move this into Feeds. Requires previewProvider/tabTracker to be independent
    getCachedMetadata: (links, type) => {
      const event = this._tabTracker.generateEvent({source: type});
      return this._previewProvider.asyncGetEnhancedLinks(links, event);
    },
    fetchNewMetadata: (links, type) => {
      const event = this._tabTracker.generateEvent({source: type});
      return this._previewProvider.asyncSaveLinks(links, event);
    },
    fetchNewMetadataLocally: (links, type) => this._pageScraper.asyncFetchLinks(links, type)
  });
  this._store = createStore({middleware: this._feeds.reduxMiddleware});
  this._feeds.connectStore(this._store);
}

ActivityStreams.prototype = {

  _pagemod: null,
  _isUnloaded: false,

  init() {
    this._initializePerfMeter();
    this._initializeAppURLHider();

    if (!this.options.shield_variant) {
      this._experimentProvider.init();
    }
    this._tabTracker.init(this.appURLs, this._experimentProvider.experimentId, this._store);
    this._searchProvider.init();
    this._initializePreviewProvider(this._metadataStore, this._tabTracker, this._store);
    this._initializePageScraper(this._previewProvider, this._tabTracker);
    this._initializePrefProvider(this._tabTracker);

    this._setupPageMod();
    this._setupListeners();
    NewTabURL.override(this._newTabURL);
    this._setHomePage();
    this._setUpPageWorker(this._store);

    this._initializeAppData();
    this._store.dispatch({type: "APP_INIT"});

    Services.obs.addObserver(this, TOPIC_SYNC_COMPLETE, false);
  },

  /**
   * Send a message to a worker
   */
  send(action, worker, skipMasterStore) {
    // if the function is async, the worker might not be there yet, or might have already disappeared
    try {
      if (!skipMasterStore) {
        this._store.dispatch(action);
      }
      worker.port.emit(ADDON_TO_CONTENT, action);
      this._perfMeter.log(worker.tab, action.type);
    } catch (err) {
      this._pagemod.removeWorker(worker);
      Cu.reportError(err);
    }
  },

  sendById(action, workerId, skipMasterStore) {
    const worker = this._pagemod.getWorkerById(workerId);
    this.send(action, worker, skipMasterStore);
  },

  /**
   * Broadcast a message to all workers
   */
  broadcast(action) {
    this._store.dispatch(action);
    this._pagemod.workers.forEach((id, worker) => {
      this.send(action, worker, true);
    });
  },

  _initializeAppData() {
    this._refreshAppState();
  },

  _setUpPageWorker(store) {
    this._pageWorker = null;
    if (!this.options.pageWorker) {
      this._pageWorker = new PageWorker({store});
      this._pageWorker.connect();
    } else {
      this._pageWorker = this.options.pageWorker;
    }
  },

  _initializePerfMeter() {
    this._perfMeter = new PerfMeter(this.appURLs);
  },

  _initializeAppURLHider() {
    this._appURLHider = new AppURLHider(this.appURLs);
  },

  _initializePreviewProvider(metadataStore, tabTracker, store) {
    this._previewProvider = new PreviewProvider(tabTracker, metadataStore, store);
  },

  _initializePrefProvider(tabTracker) {
    this._prefsProvider = new PrefsProvider({eventTracker: tabTracker, broadcast: this.broadcast.bind(this)});
    this._prefsProvider.init();
  },

  _initializePageScraper(previewProvider, tabTracker) {
    this._pageScraper = null;

    if (!this.options.pageScraper) {
      this._pageScraper = new PageScraper(previewProvider, tabTracker);
    } else {
      this._pageScraper = this.options.pageScraper;
    }
    this._pageScraper.init();
  },

  /**
   * _refreshAppState - This function replaces all messages that used to be requested on a page reload.
   *                    instead, they dispatch actions on the master store directly.
   *                    TODO: Refactor this in to a different functions that handle refreshing data separately
   */
  _refreshAppState() {
    this._store.dispatch(am.actions.Response("EXPERIMENTS_RESPONSE", this._experimentProvider.data));

    this._store.dispatch(am.actions.Response("PREFS_RESPONSE", simplePrefs.prefs));
  },

  _respondOpenWindow({msg}) {
    if (msg.type === am.type("NOTIFY_OPEN_WINDOW")) {
      windows.open({
        url: msg.data.url,
        isPrivate: msg.data.isPrivate
      });
    }
  },

  /**
   * Responds to places requests
   */
  _respondToPlacesRequests({msg, worker}) {
    switch (msg.type) {
      case am.type("NOTIFY_BOOKMARK_ADD"):
        PlacesProvider.links.asyncAddBookmark(msg.data);
        break;
      case am.type("NOTIFY_BOOKMARK_DELETE"):
        PlacesProvider.links.asyncDeleteBookmark(msg.data);
        break;
      case am.type("NOTIFY_HISTORY_DELETE"):
        PlacesProvider.links.deleteHistoryLink(msg.data);
        break;
      case am.type("NOTIFY_BLOCK_URL"):
        PlacesProvider.links.blockURL(msg.data);
        break;
      case am.type("NOTIFY_UNBLOCK_URL"):
        PlacesProvider.links.unblockURL(msg.data);
        break;
    }
  },

  /**
   * Handles changes to places
   */
  _handlePlacesChanges(eventName, data) {
    switch (eventName) {
      case "bookmarkAdded":
        this.broadcast(am.actions.Response("RECEIVE_BOOKMARK_ADDED", data));
        break;
      case "bookmarkRemoved":
        this.broadcast(am.actions.Response("RECEIVE_BOOKMARK_REMOVED", data));
        break;
      case "manyLinksChanged":
        this.broadcast({type: "MANY_LINKS_CHANGED"});
        break;
      case "clearHistory":
        this._tabTracker.handleUserEvent({event: "CLEAR_HISTORY"});
        break;
      default:
        this.broadcast(am.actions.Response("RECEIVE_PLACES_CHANGES", data));
    }
  },

  /*
   * Broadcast current engine has changed to all open newtab pages
   */
  _handleCurrentEngineChanges(eventName, data) {
    this.broadcast(am.actions.Response("SEARCH_ENGINES_CHANGED", data));
  },

  _handleUserEvent({msg}) {
    this._tabTracker.handleUserEvent(msg.data);
  },

  _handleUndesiredEvent({msg}) {
    this._tabTracker.handleUndesiredEvent(msg.data);
  },

  _handleExperimentChange(prefName) {
    this._tabTracker.experimentId = this._experimentProvider.exprimentID;
    this.broadcast(am.actions.Response("EXPERIMENTS_RESPONSE", this._experimentProvider.data));
  },

  _onRouteChange({msg} = {}) {
    if (msg) {
      this._tabTracker.handleRouteChange(tabs.activeTab, msg.data);
    }
  },

  _respondToUIChanges(args) {
    const {msg} = args;
    switch (msg.type) {
      case am.type("NOTIFY_ROUTE_CHANGE"):
        return this._onRouteChange(args);
      case am.type("NOTIFY_USER_EVENT"):
        return this._handleUserEvent(args);
      case am.type("NOTIFY_UNDESIRED_EVENT"):
        return this._handleUndesiredEvent(args);
    }
    return undefined;
  },

  _logPerfMeter({msg, worker}) {
    this._perfMeter.log(worker.tab, msg.type, msg.data);
  },

  /**
   * Sets up various listeners for the pages
   */
  _setupListeners() {
    this._handlePlacesChanges = this._handlePlacesChanges.bind(this);
    PLACES_CHANGES_EVENTS.forEach(event => PlacesProvider.links.on(event, this._handlePlacesChanges));

    this._handleCurrentEngineChanges = this._handleCurrentEngineChanges.bind(this);
    this._searchProvider.on("browser-search-engine-modified", this._handleCurrentEngineChanges);

    this._handleExperimentChange = this._handleExperimentChange.bind(this);
    this._experimentProvider.on("change", this._handleExperimentChange);

    // This is a collection of handlers that receive messages from content
    this._contentToAddonHandlers = (msgName, args) => {
      // Log requests first so that the requests are logged before responses
      // in synchronous response cases.
      this._logPerfMeter(args);

      // Dispatch to store, to synchronize it
      if (!args.msg.meta || !args.msg.meta.skipMasterStore) {
        this._store.dispatch(args.msg);
      }

      // Other handlers
      this._respondToUIChanges(args);
      this._respondToPlacesRequests(args);
      this._respondOpenWindow(args);
    };
    this.on(CONTENT_TO_ADDON, this._contentToAddonHandlers);
  },

  /**
   * Turns off various listeners for the pages
   */
  _removeListeners() {
    PLACES_CHANGES_EVENTS.forEach(event => PlacesProvider.links.off(event, this._handlePlacesChanges));
    this._searchProvider.off("browser-search-engine-modified", this._handleCurrentEngineChanges);
    this._experimentProvider.off("change", this._handleExperimentChange);
    this.off(CONTENT_TO_ADDON, this._contentToAddonHandlers);
  },

  /**
   * Sets up communications with the pages and manages the lifecycle of workers
   */
  _setupPageMod() {
    this._pagemod.init({
      onAttach: this._refreshAppState.bind(this),
      onMessage: message => this.emit(CONTENT_TO_ADDON, message),
      logEvent: this._perfMeter.log.bind(this._perfMeter)
    });
  },

  /*
   * Replace the home page with the ActivityStream new tab page.
   */
  _setHomePage() {
    // Only hijack the home page if it isn't set by user or if it is set to
    // about:home/about:blank
    // AND the user didn't previously override the preference.
    if (!ss.storage.homepageOverriden &&
        (!prefService.isSet(HOME_PAGE_PREF) ||
         ["about:home", "about:blank"].includes(prefService.get(HOME_PAGE_PREF)))) {
      prefService.set(HOME_PAGE_PREF, `${this._newTabURL}HOME`);
    }
  },

  _unsetHomePage() {
    if (prefService.get(HOME_PAGE_PREF) === `${this._newTabURL}HOME`) {
      // Reset home page back if user didn't change it.
      prefService.reset(HOME_PAGE_PREF);
    } else {
      // The user changed the pref. Keep track of that so next time we don't
      // hijack it again.
      ss.storage.homepageOverriden = true;
    }
  },

  /**
   * The URLs for the app.
   */
  get appURLs() {
    if (!this._appURLs) {
      let baseUrl = this.options.pageURL;
      this._appURLs = [
        baseUrl,
        `${baseUrl}#/`,
        `${baseUrl}#/HOME`
      ];
    }
    return this._appURLs;
  },

  get tabData() {
    return this._tabTracker.tabData;
  },

  get performanceData() {
    return this._perfMeter.events;
  },

  observe(subject, topic, data) {
    switch (topic) {
      case TOPIC_SYNC_COMPLETE:
        this._store.dispatch({type: "SYNC_COMPLETE"});
        break;
      default:
        break;
    }
  },

  /**
   * Unload the application
   */
  unload(reason) { // eslint-disable-line no-unused-vars
    let defaultUnload = () => {
      this._store.dispatch({type: "APP_UNLOAD", data: reason});
      this._previewProvider.uninit();
      this._searchProvider.uninit();
      this._pageScraper.uninit();
      NewTabURL.reset();
      Services.prefs.clearUserPref("places.favicons.optimizeToDimension");
      this._removeListeners();
      this._pagemod.destroy();
      this._tabTracker.uninit();
      this._telemetrySender.uninit();
      this._appURLHider.uninit();
      this._perfMeter.uninit();
      this._prefsProvider.destroy();
      this._experimentProvider.destroy();
      this._pageWorker.destroy();

      Services.obs.removeObserver(this, TOPIC_SYNC_COMPLETE);
    };

    switch (reason) {
      // can be one of: uninstall/disable/shutdown/upgrade/downgrade
      case "disable":
      case "uninstall":
        this._tabTracker.handleUserEvent({event: reason});
        this._unsetHomePage();
        defaultUnload();
        this._experimentProvider.clearPrefs();
        break;
      default:
        defaultUnload();
    }
    this._isUnloaded = true;
  }
};

exports.ActivityStreams = ActivityStreams;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) { /* globals XPCOMUtils, Task, OS, Sqlite, PlacesUtils, NetUtil, Services */


const {Cu} = __webpack_require__(0);
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Sqlite.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/Timer.jsm");

const {MIGRATIONS} = __webpack_require__(44);

XPCOMUtils.defineLazyModuleGetter(global, "Task",
                                  "resource://gre/modules/Task.jsm");
XPCOMUtils.defineLazyModuleGetter(global, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(global, "OS",
                                  "resource://gre/modules/osfile.jsm");

const METASTORE_NAME = "metadata.sqlite";

const SQL_DDLS = [
  `CREATE TABLE IF NOT EXISTS page_metadata (
      id INTEGER PRIMARY KEY,
      cache_key LONGVARCHAR UNIQUE,
      places_url LONGVARCHAR,
      title TEXT,
      type VARCHAR(32),
      description TEXT,
      media_url LONGVARCHAR,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expired_at LONG
  )`,
  `CREATE TABLE IF NOT EXISTS page_images (
    id INTEGER PRIMARY KEY,
    url LONGVARCHAR UNIQUE,
    type INTEGER,
    height INTEGER,
    width INTEGER,
    color VARCHAR(32)
  )`,
  `CREATE TABLE IF NOT EXISTS page_metadata_images (
    metadata_id INTEGER,
    image_id INTEGER,
    FOREIGN KEY(metadata_id) REFERENCES page_metadata(id) ON DELETE CASCADE,
    FOREIGN KEY(image_id) REFERENCES page_images(id) ON DELETE CASCADE
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS page_metadata_cache_key_uniqueindex ON page_metadata (cache_key)",
  "CREATE UNIQUE INDEX IF NOT EXISTS page_images_url_uniqueindex ON page_images (url)",
  `CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY,
    version VARCHAR(32)
  )`
];

const SQL_LAST_INSERT_ROWID = "SELECT last_insert_rowid() AS lastInsertRowID";

const SQL_INSERT_METADATA = `INSERT INTO page_metadata
  (cache_key, places_url, title, type, description, media_url, expired_at, metadata_source, provider_name)
  VALUES
  (:cache_key, :places_url, :title, :type, :description, :media_url, :expired_at, :metadata_source, :provider_name)`;

const SQL_INSERT_IMAGES = `INSERT INTO page_images
  (url, type, height, width, color)
  VALUES
  (:url, :type, :height, :width, :color)`;

const SQL_INSERT_METADATA_IMAGES = `INSERT INTO page_metadata_images
  (metadata_id, image_id) VALUES (?, ?)`;

const SQL_SELECT_IMAGE_ID = "SELECT id FROM page_images WHERE url = ?";

const SQL_DROPS = [
  "DROP TABLE IF EXISTS page_metadata_images",
  "DROP TABLE IF EXISTS page_metadata",
  "DROP TABLE IF EXISTS page_images",
  "DROP TABLE IF EXISTS migrations"
];

const SQL_DELETE_EXPIRED = "DELETE FROM page_metadata WHERE expired_at <= (CAST(strftime('%s', 'now') AS LONG)*1000)";

/* Image type constants */
const IMAGE_TYPES = {
  "favicon": 1,
  "favicon_rich": 2,
  "preview": 3
};

/* Maxium number of allowed parameters in a single SQL statement (defined here: https://www.sqlite.org/limits.html) */
const SQL_PARAMETER_LIMIT = 999;
const UNIQUE_CONSTRAINT_FAILED_EXCEPTION = "UNIQUE constraint failed";

function MetadataStore(path, migrations = null) {
  this._path = path || OS.Path.join(OS.Constants.Path.profileDir, METASTORE_NAME);
  this._migrations = migrations || MIGRATIONS;
  this._conn = null;
  this._dataExpiryJob = null;
}

MetadataStore.prototype = {
  /**
   * Creates the table schema for the metadata database. This function must be called
   * after a database connection has been established
   */
  _asyncCreateTableSchema: Task.async(function*() {
    try {
      yield this._conn.executeTransaction(function*() {
        for (let ddl of SQL_DDLS) {
          yield this._conn.execute(ddl);
        }

        // Handle the migrations
        const currentVersion = yield this._asyncGetCurrentVersion();
        let lastVersion = currentVersion.version;
        for (let i = currentVersion.index + 1; i < this._migrations.length; i++) {
          const migration = this._migrations[i];
          lastVersion = migration.version;
          for (let statement of migration.statements) {
            yield this._conn.execute(statement);
          }
        }
        if (lastVersion !== currentVersion.version) {
          this._conn.execute("INSERT OR REPLACE INTO migrations (id, version) VALUES (1, ?)", [lastVersion]);
        }
      }.bind(this));
    } catch (e) {
      Cu.reportError("MetadataStore failed to create tables.");
      throw e;
    }
  }),

  _asyncGetCurrentVersion: Task.async(function*() {
    const result = yield this._conn.execute("SELECT version FROM migrations");
    let currentVersion;
    try {
      currentVersion = result[0].getResultByName("version");
    } catch (e) {
      currentVersion = "1.0.0"; // for the first run
    }
    for (let i = this._migrations.length - 1; i >= 0; i--) {
      if (this._migrations[i].version === currentVersion) {
        return {version: currentVersion, index: i};
      }
    }
    throw new Error(`Can't find version ${currentVersion} in the migration history`);
  }),

  get transactionInProgress() {
    if (!this._conn) {
      return false;
    }
    return this._conn.transactionInProgress;
  },

  /**
   * Creates a connection to the metadata database. It sets the journal mode
   * to WAL, enables the foreign key support, and also creates the tables and
   * indices if necessary
   *
   * Returns a promise that is resolved upon success, or rejected if an exception occurs
   */
  asyncConnect: Task.async(function*() {
    if (this._conn) {
      return;
    }

    try {
      this._conn = yield Sqlite.openConnection({path: this._path});
      yield this._conn.execute("PRAGMA journal_mode = WAL;");
      yield this._conn.execute("PRAGMA foreign_keys = ON;");
      yield this._asyncCreateTableSchema();
    } catch (e) {
      Cu.reportError(`MetadataStore failed to create connection: ${e.message}`);
      throw e;
    }
  }),

  asyncClose: Task.async(function*() {
    if (this._conn) {
      yield this._conn.close();
      this._conn = null;
    }
  }),

  _getMetadataParameters(aRow) {
    return {
      cache_key: aRow.cache_key,
      places_url: aRow.places_url,
      title: aRow.title,
      type: aRow.type,
      description: aRow.description,
      media_url: aRow.media && aRow.media.url,
      expired_at: aRow.expired_at,
      metadata_source: aRow.metadata_source || "MetadataService",
      provider_name: aRow.provider_name
    };
  },

  _getFaviconParameters(aRow) {
    return {
      url: aRow.favicon_url,
      type: IMAGE_TYPES.favicon,
      height: aRow.favicon_height,
      width: aRow.favicon_width,
      color: (aRow.favicon_colors && aRow.favicon_colors[0]) ? this._rgbToHex(aRow.favicon_colors[0].color) : null
    };
  },

  _getImageParameters(aRow) {
    return {
      url: aRow.url,
      type: IMAGE_TYPES.preview,
      height: aRow.height,
      width: aRow.width,
      color: (aRow.colors && aRow.colors[0]) ? this._rgbToHex(aRow.colors[0].color) : null
    };
  },

  /**
  * Convert a RGB array to the Hex form, e.g. [10, 1, 2] => #0A0102
  */
  _rgbToHex(rgb) {
    return rgb ? `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1).toUpperCase()}` : null;
  },

  _asyncGetLastInsertRowID: Task.async(function*() {
    let result = yield this._conn.execute(SQL_LAST_INSERT_ROWID);
    return result[0].getResultByName("lastInsertRowID");
  }),

  _asyncGetImageIDByURL: Task.async(function*(url) {
    let result = yield this._conn.executeCached(SQL_SELECT_IMAGE_ID, [url]);
    return result[0].getResultByName("id");
  }),

  /**
   * Inserts the metadata into the database. It consists of two tables,
   * i.e. page_metadata for the regular meta information of the page, and
   * page_images for the favicon and preview images.
   *
   * metaObjects, an array of metadata objects that currently generated by embed.ly
   * Returns a promise that is resolved upon success, or rejected if an exception occurs
   */
  asyncInsert: Task.async(function*(metaObjects, ignoreUniqueConstraintError = false) {
    if (!this._conn) {
      throw new Error("MetadataStore is not yet connected");
    }

    const principal = Services.scriptSecurityManager.getSystemPrincipal();
    for (let metaObject of metaObjects) {
      yield this._conn.executeTransaction(function*() {
        let metadata_id;
        let image_ids = [];

        if (!metaObject.places_url) {
          throw new Error("Objects to insert must include a places_url");
        }

        if (metaObject.favicon_url) {
          // attach favicon to places_url for Places
          PlacesUtils.favicons.setAndFetchFaviconForPage(
            NetUtil.newURI(metaObject.places_url),
            NetUtil.newURI(metaObject.favicon_url),
            false,
            PlacesUtils.favicons.FAVICON_LOAD_NON_PRIVATE,
            null,
            principal
          );
        }

        /* 1. inserts it into page_metadata */
        try {
          let metadataBindings = this._getMetadataParameters(metaObject);
          yield this._conn.executeCached(SQL_INSERT_METADATA, metadataBindings);
          metadata_id = yield this._asyncGetLastInsertRowID();
        } catch (e) {
          if (!ignoreUniqueConstraintError) {
            Cu.reportError(`MetadataStore failed to insert metadata: ${e.message}`);
            throw e;
          } else if (!e.message.includes(UNIQUE_CONSTRAINT_FAILED_EXCEPTION)) {
            // skip over any errors we choose not to log
            Cu.reportError(`MetadataStore failed to insert metadata: ${e.message}`);
            throw e;
          }
        }

        /* 2. inserts the favicon into page_images, handles the special case, in which
         * the favicon already exsits */
        if (metaObject.favicon_url) {
          let faviconBindings = this._getFaviconParameters(metaObject);
          try {
            yield this._conn.executeCached(SQL_INSERT_IMAGES, faviconBindings);
            image_ids.push(yield this._asyncGetLastInsertRowID());
          } catch (e) {
            try {
              image_ids.push(yield this._asyncGetImageIDByURL(faviconBindings.url));
            } catch (ex) {
              if (!ignoreUniqueConstraintError) {
                Cu.reportError(`MetadataStore failed to insert metadata: ${e.message}`);
                throw e;
              } else if (!e.message.includes(UNIQUE_CONSTRAINT_FAILED_EXCEPTION)) {
                // skip over any errors we choose not to log
                Cu.reportError(`MetadataStore failed to insert metadata: ${e.message}`);
                throw e;
              }
            }
          }
        }

        /* 3. inserts all the preview images, if they exist */
        if (metaObject.images) {
          for (let image of metaObject.images) {
            let imageBindings = this._getImageParameters(image);
            try {
              yield this._conn.executeCached(SQL_INSERT_IMAGES, imageBindings);
              image_ids.push(yield this._asyncGetLastInsertRowID());
            } catch (e) {
              try {
                image_ids.push(yield this._asyncGetImageIDByURL(imageBindings.url));
              } catch (ex) {
                Cu.reportError(`MetadataStore failed to fetch the id of image: ${ex.message}`);
                throw ex; /* force this transaction to rollback */
              }
            }
          }

          /* 4. inserts relations into the page_metadata_images */
          for (let image_id of image_ids) {
            yield this._conn.executeCached(SQL_INSERT_METADATA_IMAGES, [metadata_id, image_id]);
          }
        }
      }.bind(this));
    }
  }),

  /**
   * Drops all the tables and the corresponding indices, the table schema remains
   *
   * Returns a promise that is resolved upon success, or rejected if an exception occurs
   */
  asyncReset: Task.async(function*() {
    if (this._conn) {
      try {
        yield this._conn.executeTransaction(function*() {
          for (let drop of SQL_DROPS) {
            yield this._conn.execute(drop);
          }
        }.bind(this));
        yield this._asyncCreateTableSchema();
      } catch (e) {
        Cu.reportError(`MetadataStore failed to drop: ${e.message}`);
        throw e;
      }
    }
  }),

  /**
   * Delete the metadata store SQLite file, it'll automatically close the
   * database connection
   */
  asyncTearDown: Task.async(function*() {
    try {
      yield this.asyncClose();
      yield OS.File.remove(this._path, {ignoreAbsent: true});
    } catch (e) {
      Cu.reportError(`MetadataStore failed to tear down the database: ${e.message}`);
    }
  }),

  /**
   * Executes arbitrary query against metadata database. For bulk insert, use
   * asyncInsert function instead
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
   * Returns a promise with the array of retrieved items
   */
  asyncExecuteQuery: Task.async(function*(aSql, aOptions = {}) {
    let {columns, params, callback} = aOptions;
    let items = [];
    let queryError = null;

    if (!this._conn) {
      throw new Error("MetadataStore is not yet connected");
    }

    yield this._conn.executeCached(aSql, params, aRow => {
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
  }),

  /**
   * Get page metadata (including images) for the given cache_keys.
   * For the missing cache_keys, it simply ignores them and will not
   * raise any exception. Note that this function throws an exception
   * if it is called with a closed or unestablished connection
   *
   * @param {Array} cacheKeys an cache key array
   *
   * Returns a promise with the array of retrieved metadata records
   */
  asyncGetMetadataByCacheKey: Task.async(function*(cacheKeys) {
    let limitedCacheKeys = cacheKeys;
    if (limitedCacheKeys.length > SQL_PARAMETER_LIMIT) {
      limitedCacheKeys = cacheKeys.slice(0, SQL_PARAMETER_LIMIT);
    }
    const quoted = limitedCacheKeys.map(key => "?").join(",");
    let metaObjects;
    try {
      metaObjects = yield this.asyncExecuteQuery(
        `SELECT * FROM page_metadata WHERE cache_key IN (${quoted})`,
        {
          params: limitedCacheKeys,
          columns: ["id", "cache_key", "places_url", "title", "type", "description", "media_url", "provider_name"]
        }
      );
    }
    catch (e) {
      Cu.reportError(`Failed to fetch metadata by cacheKey: ${e.message}`);
      throw e;
    }

    // fetch the favicons and images for each metadata object
    for (let metaObject of metaObjects) {
      let images;
      metaObject.images = [];
      metaObject.favicons = [];

      try {
        images = yield this.asyncExecuteQuery(
          `SELECT pi.*
           FROM page_metadata AS pm
              JOIN page_metadata_images AS pmi ON pm.id = pmi.metadata_id
              JOIN page_images AS pi ON pi.id = pmi.image_id
           WHERE pm.id = :metaobject_id`,
          {
            params: {metaobject_id: metaObject.id},
            columns: ["url", "type", "height", "width", "color"]
          }
        );
      } catch (e) {
        Cu.reportError(`Failed to fetch metadata by cacheKey: ${e.message}`);
        throw e;
      }
      for (let image of images) {
        const imageData = {
          url: image.url,
          color: image.color,
          height: image.height,
          width: image.width
        };
        switch (image.type) {
          case IMAGE_TYPES.favicon:
          case IMAGE_TYPES.favicon_rich:
            metaObject.favicons.push(imageData);
            break;
          case IMAGE_TYPES.preview:
            metaObject.images.push(imageData);
            break;
          default:
            throw new Error(`Fetched unknown image types: ${image.type}`);
        }
      }
    }

    return metaObjects;
  }),

  /**
   * Check if the link exists in the database by checking if it's cache key exists
   *
   * @param {String} key a cache key
   *
   * Returns a promise with the array of the retrieved metadata record
   */
  asyncCacheKeyExists: Task.async(function*(key) {
    try {
      let metadataLink = yield this.asyncExecuteQuery(
        "SELECT 1 FROM page_metadata WHERE cache_key = :key",
        {params: {key}}
      );
      return metadataLink.length > 0;
    } catch (e) {
      return false;
    }
  }),

  /**
   * Find the oldest entry in the database
   *
   * Returns the timestamp of the oldest entry in the database
   */
  asyncGetOldestInsert: Task.async(function*() {
    let timestamp = null;
    try {
      const entry = yield this.asyncExecuteQuery("SELECT min(created_at) FROM page_metadata");
      if (entry && entry.length) {
        timestamp = entry[0][0];
      }
    } catch (e) {
      throw e;
    }
    return timestamp;
  }),

  /**
   * Counts all the items in the database
   *
   * Returns a promise with the array of the retrieved metadata records
   */
  asyncCountAllItems: Task.async(function*() {
    try {
      const result = yield this.asyncExecuteQuery("SELECT count(*) FROM page_metadata");
      return result[0][0];
    } catch (e) {
      throw e;
    }
  }),

  /**
  * Enables the data expiry job. The database connection needs to
  * be established prior to calling this function. Once it's triggered,
  * any following calls will be ignored unless the user disables
  * it by disableDataExpiryJob()
  *
  * @param {Number} interval
  *        an time interval in millisecond for this cron job
  */
  enableDataExpiryJob(interval) {
    if (this._dataExpiryJob) {
      return;
    }

    this._dataExpiryJob = setInterval(() => {
      if (!this._conn) {
        return;  // ignore the callback if the connection is invalid
      }

      this._conn.execute(SQL_DELETE_EXPIRED).catch(error => {
        // The delete might fail if a table dropping is being processed at
        // the same time
        Cu.reportError(`Failed to delete expired metadata: ${error.message}`);
      });
    }, interval);
  },

  disableDataExpiryJob() {
    if (this._dataExpiryJob) {
      clearInterval(this._dataExpiryJob);
      this._dataExpiryJob = null;
    }
  }
};

exports.MetadataStore = MetadataStore;
exports.METASTORE_NAME = METASTORE_NAME;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals Services, Locale, XPCOMUtils */


const tabs = __webpack_require__(12);
const {Ci, Cu} = __webpack_require__(0);
const self = __webpack_require__(5);
const {uuid} = __webpack_require__(27);
const simplePrefs = __webpack_require__(4);
const eventConstants = __webpack_require__(8);
const {absPerf} = __webpack_require__(10);

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Locale.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const TELEMETRY_PREF = "telemetry";
const COMPLETE_NOTIF = "tab-session-complete";
const ACTION_NOTIF = "user-action-event";
const PERFORMANCE_NOTIF = "performance-event";
const PERF_LOG_COMPLETE_NOTIF = "performance-log-complete";
const UNDESIRED_NOTIF = "undesired-event";

let TOPIC_SLOW_ADDON_DETECTED;
try {
  // This import currently fails on travis which is running Firefox 46.
  // This workaround is ugly but we are just being paranoid about future changes.
  const {AddonWatcher} = Cu.import("resource://gre/modules/AddonWatcher.jsm", {});
  TOPIC_SLOW_ADDON_DETECTED = AddonWatcher.TOPIC_SLOW_ADDON_DETECTED;
} catch (e) {
  TOPIC_SLOW_ADDON_DETECTED = "addon-watcher-detected-slow-addon";
}

function TabTracker(options) {
  this._tabData = {};
  this._clientID = options.clientID;
  this.onOpen = this.onOpen.bind(this);
  this._onPrefChange = this._onPrefChange.bind(this);
}

TabTracker.prototype = {
  _openTabs: {},

  get tabData() {
    return this._tabData;
  },

  init(trackableURLs, experimentId, store) {
    this._trackableURLs = trackableURLs;
    this._experimentID = experimentId;
    this._store = store;

    this.enabled = simplePrefs.prefs[TELEMETRY_PREF];
    if (this.enabled) {
      this._addListeners();
    }
    simplePrefs.on(TELEMETRY_PREF, this._onPrefChange);
  },

  _addListeners() {
    tabs.on("open", this.onOpen);
    Services.obs.addObserver(this, PERF_LOG_COMPLETE_NOTIF, true);
    Services.obs.addObserver(this, TOPIC_SLOW_ADDON_DETECTED, true);
  },

  _removeListeners() {
    Object.keys(this._openTabs).forEach(id => {
      let tab = this._openTabs[id].tab;
      tab.removeListener("ready", this.logReady);
      tab.removeListener("pageshow", this.logPageShow);
      tab.removeListener("activate", this.logActivate);
      tab.removeListener("deactivate", this.logDeactivate);
      tab.removeListener("close", this.logClose);
    });
    tabs.removeListener("open", this.onOpen);

    if (this.enabled) {
      Services.obs.removeObserver(this, PERF_LOG_COMPLETE_NOTIF);
      Services.obs.removeObserver(this, TOPIC_SLOW_ADDON_DETECTED);
    }
  },

  _clearTabData() {
    // keep history and bookmarks sizes of the current tabData
    let {total_history_size, total_bookmarks} = this._tabData;
    this._tabData = {
      total_history_size,
      total_bookmarks
    };
  },

  _setCommonProperties(payload, url) {
    payload.client_id = this._clientID;
    payload.addon_version = self.version;
    payload.locale = Locale.getLocale();
    payload.page = url.split("#/")[1] || eventConstants.defaultPage;
    payload.session_id = this._tabData.session_id;
    if (this._experimentID) {
      payload.experiment_id = this._experimentID;
    }
  },

  uninit() {
    this._removeListeners();
    if (this.enabled) {
      simplePrefs.removeListener(TELEMETRY_PREF, this._onPrefChange);
      this.enabled = false;
    }
  },

  set experimentId(experimentId) {
    this._experimentID = experimentId || null;
  },

  isActivityStreamsURL(URL) {
    return this._trackableURLs.indexOf(URL) !== -1;
  },

  handleUserEvent(payload, experimentId) {
    payload.action = "activity_stream_event";
    payload.tab_id = tabs.activeTab.id;
    this._setCommonProperties(payload, tabs.activeTab.url);
    Services.obs.notifyObservers(null, ACTION_NOTIF, JSON.stringify(payload));
    if (payload.event === "SEARCH" || payload.event === "CLICK") {
      this._tabData.unload_reason = payload.event.toLowerCase();
    }
  },

  handleUndesiredEvent(payload, experimentId) {
    payload.action = "activity_stream_masga_event";
    payload.tab_id = tabs.activeTab.id;
    this._setCommonProperties(payload, tabs.activeTab.url);
    if (!("value" in payload)) {
      payload.value = 0;
    }
    Services.obs.notifyObservers(null, UNDESIRED_NOTIF, JSON.stringify(payload));
  },

  handlePerformanceEvent(eventData, eventName, value) {
    if (!tabs.activeTab) {
      // short circuit out if there is no active tab
      return;
    }

    let payload = Object.assign({}, eventData);
    payload.action = "activity_stream_performance";
    payload.tab_id = tabs.activeTab.id;
    payload.event = eventName;
    payload.value = value;
    this._setCommonProperties(payload, tabs.activeTab.url);
    Services.obs.notifyObservers(null, PERFORMANCE_NOTIF, JSON.stringify(payload));
  },

  handleRouteChange(tab, route) {
    if (!route.isFirstLoad) {
      this.navigateAwayFromPage(tab, "route_change");
      this.logReady(tab);
    }
  },

  generateEvent(eventData) {
    return Object.assign({}, eventData, {event_id: String(uuid())});
  },

  _initTabSession(tab, loadReason) {
    // For session IDs that were set on tab open, let's make sure we
    // don't overwrite them.
    this._tabData.session_id = this._tabData.session_id || String(uuid());
    this._tabData.url = tab.url;
    this._tabData.tab_id = tab.id;
    this._tabData.load_reason = loadReason;
  },

  navigateAwayFromPage(tab, reason) {
    // we can't use tab.url, because it's pointing to a new url of the page
    // we have to use the URL stored in this._openTabs object
    this._setCommonProperties(this._tabData, this._openTabs[tab.id].url);
    this._tabData.action = "activity_stream_session";
    // unload_reason could be set in "handleUserEvent" for certain user events
    // in order to provide the more sepcific reasons other than "navigation"
    this._tabData.unload_reason = this._tabData.unload_reason || reason;

    // Attach the number of highlights to the payload. Fetching the highlight count
    // here other than doing so in onOpen to make it cover all the cases, such as
    // new tab, refresh, back, and re-activate
    //
    // Note: the selector "selectAndDedup" on the content side might filter out some
    // highlight links if they also belong to the Top Sites. The highlight count
    // would be greater than the actual value in this case. This discrepancy will
    // eventually go away as we are phasing out the filtering in the selectAndDedup
    if (this._store) {
      const currentState = this._store.getState();
      if (currentState.Highlights.error || !currentState.Highlights.init) {
        this._tabData.highlights_size = -1;
      } else {
        this._tabData.highlights_size = currentState.Highlights.rows.length;
      }
    } else {
      this._tabData.highlights_size = -1;
    }

    if (!this._tabData.tab_id) {
      // We're navigating away from an activity streams page that
      // didn't even load yet. Let's say it's been active for 0 seconds.
      // Note: none is for if the page didn't load at all.
      this._initTabSession(tab, this._tabData.load_reason || "none");
      this._tabData.session_duration = 0;
      delete this._tabData.start_time;
      Services.obs.notifyObservers(null, COMPLETE_NOTIF, JSON.stringify(this._tabData));
      this._clearTabData();
      return;
    }
    if (this._tabData.start_time) {
      this._tabData.session_duration = (absPerf.now() - this._tabData.start_time);
      delete this._tabData.start_time;
    }
    delete this._tabData.active;
    Services.obs.notifyObservers(null, COMPLETE_NOTIF, JSON.stringify(this._tabData));
    this._clearTabData();
  },

  logReady(tab) {
    // If an inactive tab is done loading, we don't care. It's session would have
    // already ended, likely with an 'unfocus' unload reason.
    if (this.isActivityStreamsURL(tab.url) && tabs.activeTab.id === tab.id) {
      if (!this._tabData.url) {
        this._tabData.load_reason = "newtab";
      } else if (!this._tabData.session_duration) {
        // The page content has been reloaded but a total time wasn't set.
        // This is due to a page refresh. Let's set the total time now.
        this.navigateAwayFromPage(tab, "refresh");
        this._tabData.load_reason = "refresh";
      }
      this.logActivate(tab);
      return;
    }
    // We loaded a URL other than activity streams. If URL is loaded into the
    // same tab (tab_id must match) and the previous URL is activity streams URL,
    // then we are replacing the activity streams tab and we must update its state.
    if (this._tabData.tab_id === tab.id &&
        this._openTabs[tab.id] &&
        this.isActivityStreamsURL(this._openTabs[tab.id].url)) {
      this.navigateAwayFromPage(tab, "navigation");
    }
  },

  logPageShow(tab) {
    // 'pageshow' events are triggered whenever 'ready' events are triggered as well
    // as whenever a user hits the 'back' button on the browser. The 'ready' event
    // is emitted before this 'pageshow' event in cases when both are triggered.
    // Thus, if we get here and load_reason still has not been set, then we know
    // we got here due to a click of the 'back' button.
    if (this.isActivityStreamsURL(tab.url) && !this._tabData.load_reason) {
      // logReady will start a new session and set the 'load_reason' as 'newtab'.
      // we do not use 'back_button' for the 'load_reason' due to a known issue:
      // https://github.com/mozilla/activity-stream/issues/808
      this.logReady(tab);
    }
  },

  logActivate(tab) {
    if (this.isActivityStreamsURL(tab.url)) {
      // note that logActivate may be called from logReady handler when page loads
      // but also from "activate" event, when the tab gains focus, in which case
      // we need to restore tab_id and url, because they could have been errased
      // by a call navigateAwayFromPage() caused by another tab
      this._initTabSession(tab, this._tabData.load_reason || "focus");
      this._tabData.start_time = absPerf.now();

      // URL stored in this._openTabs object keeps the previous URL after the tab.url
      // is replaced with a different page URL, as in click action of page reload
      this._openTabs[tab.id].url = tab.url;
      this._openTabs[tab.id].active = true;
    }
  },

  logDeactivate(tab) {
    // If there is no activeTab, that means we closed the whole window
    // we already log "close", so no need to log deactivate as well.
    if (!tabs.activeTab) {
      return;
    }
    if (this.isActivityStreamsURL(tab.url)) {
      this.navigateAwayFromPage(tab, "unfocus");
      this._openTabs[tab.id].active = false;
    }
  },

  logClose(tab) {
    if (this.isActivityStreamsURL(tab.url)) {
      // check whether this tab is inactive or not, don't send the close ping
      // if it's inactive as an "unfocus" one has already been sent by logDeactivate.
      // Note that the test !tabs.activeTab won't work here when the user closes
      // the window
      if (!this._openTabs[tab.id].active) {
        return;
      }
      this.navigateAwayFromPage(tab, "close");
    }
    // get rid of that tab reference
    delete this._openTabs[tab.id];
  },

  onOpen(tab) {
    this._openTabs[tab.id] = {tab, url: tab.url, active: true};
    this._tabData.tab_id = tab.id;

    this.logReady = this.logReady.bind(this);
    this.logPageShow = this.logPageShow.bind(this);
    this.logActivate = this.logActivate.bind(this);
    this.logDeactivate = this.logDeactivate.bind(this);
    this.logClose = this.logClose.bind(this);

    tab.on("ready", this.logReady);
    tab.on("pageshow", this.logPageShow);
    tab.on("activate", this.logActivate);
    tab.on("deactivate", this.logDeactivate);
    tab.on("close", this.logClose);

    if (this._store) {
      // These values are added in PlacesStatsFeed
      const currentState = this._store.getState();
      this._tabData.total_history_size = currentState.PlacesStats.historySize;
      this._tabData.total_bookmarks = currentState.PlacesStats.bookmarksSize;
    }

    // Some performance pings are sent before a tab is loaded. Let's make sure we have
    // session id available in advance for those pings.
    this._tabData.session_id = String(uuid());
  },

  _onPrefChange() {
    let newValue = simplePrefs.prefs.telemetry;
    if (!this.enabled && newValue) {
      this._addListeners();
    } else if (this.enabled && !newValue) {
      this._removeListeners();
    }
    this.enabled = newValue;
  },

  observe(subject, topic, data) {
    switch (topic) {
      case PERF_LOG_COMPLETE_NOTIF: {
        let eventData = JSON.parse(data);
        if (eventData.tabId === this._tabData.tab_id) {
          this._tabData.load_latency = eventData.events[eventData.events.length - 1].start;
        }
        break;
      }
      case TOPIC_SLOW_ADDON_DETECTED: {
        // data is the addonId of the slow addon. If it is us, we record it.
        if (data === self.id) {
          this.handleUndesiredEvent({
            event: "SLOW_ADDON_DETECTED",
            source: "ADDON"
          });
        }
        break;
      }
    }
  },

  QueryInterface: XPCOMUtils.generateQI([
    Ci.nsIObserver,
    Ci.nsISupportsWeakReference
  ])
};

exports.TabTracker = TabTracker;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

/* globals Services, XPCOMUtils */

const {Ci, Cu} = __webpack_require__(0);
const simplePrefs = __webpack_require__(4);
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.importGlobalProperties(["fetch"]);

const ENDPOINT_PREF = "telemetry.ping.endpoint";
const TELEMETRY_PREF = "telemetry";
const ACTION_NOTIF = "user-action-event";
const PERFORMANCE_NOTIF = "performance-event";
const COMPLETE_NOTIF = "tab-session-complete";
const UNDESIRED_NOTIF = "undesired-event";
const LOGGING_PREF = "performance.log";

function TelemetrySender() {
  this.enabled = simplePrefs.prefs[TELEMETRY_PREF];
  this._pingEndpoint = simplePrefs.prefs[ENDPOINT_PREF];
  this.logging = simplePrefs.prefs[LOGGING_PREF];
  this._onPrefChange = this._onPrefChange.bind(this);
  simplePrefs.on(ENDPOINT_PREF, this._onPrefChange);
  simplePrefs.on(TELEMETRY_PREF, this._onPrefChange);
  simplePrefs.on(LOGGING_PREF, this._onPrefChange);
  if (this.enabled) {
    Services.obs.addObserver(this, COMPLETE_NOTIF, true);
    Services.obs.addObserver(this, ACTION_NOTIF, true);
    Services.obs.addObserver(this, PERFORMANCE_NOTIF, true);
    Services.obs.addObserver(this, UNDESIRED_NOTIF, true);
  }
}

TelemetrySender.prototype = {
  QueryInterface: XPCOMUtils.generateQI([
    Ci.nsIObserver,
    Ci.nsISupportsWeakReference
  ]),

  observe(subject, topic, data) {
    if (topic === COMPLETE_NOTIF || topic === ACTION_NOTIF || topic === PERFORMANCE_NOTIF || topic === UNDESIRED_NOTIF) {
      this._sendPing(data);
    }
  },

  _onPrefChange(prefName) {
    if (prefName === ENDPOINT_PREF) {
      this._pingEndpoint = simplePrefs.prefs[ENDPOINT_PREF];
    } else if (prefName === TELEMETRY_PREF) {
      let newValue = simplePrefs.prefs[TELEMETRY_PREF];

      if (this.enabled && !newValue) {
        Services.obs.removeObserver(this, COMPLETE_NOTIF);
        Services.obs.removeObserver(this, ACTION_NOTIF);
        Services.obs.removeObserver(this, PERFORMANCE_NOTIF);
        Services.obs.removeObserver(this, UNDESIRED_NOTIF);
      } else if (!this.enabled && newValue) {
        Services.obs.addObserver(this, COMPLETE_NOTIF, true);
        Services.obs.addObserver(this, ACTION_NOTIF, true);
        Services.obs.addObserver(this, PERFORMANCE_NOTIF, true);
        Services.obs.addObserver(this, UNDESIRED_NOTIF, true);
      }

      this.enabled = newValue;
    } else if (prefName === LOGGING_PREF) {
      this.logging = simplePrefs.prefs[LOGGING_PREF];
    }
  },

  _sendPing(data) {
    if (this.logging) {
      // performance related pings cause a lot of logging, so we mute them
      if (JSON.parse(data).action !== "activity_stream_performance") {
        console.log(`TELEMETRY PING: ${data}`); // eslint-disable-line no-console
      }
    }
    fetch(this._pingEndpoint, {method: "POST", body: data}).then(response => {
      if (!response.ok) {
        Cu.reportError(`Ping failure with response code: ${response.status}`);
      }
    }).catch(e => {
      Cu.reportError(`Ping failure with error code: ${e.message}`);
    });
  },

  uninit() {
    try {
      if (this.enabled) {
        Services.obs.removeObserver(this, COMPLETE_NOTIF);
        Services.obs.removeObserver(this, ACTION_NOTIF);
        Services.obs.removeObserver(this, PERFORMANCE_NOTIF);
        Services.obs.removeObserver(this, UNDESIRED_NOTIF);
      }
      simplePrefs.removeListener(TELEMETRY_PREF, this._onPrefChange);
      simplePrefs.removeListener(ENDPOINT_PREF, this._onPrefChange);
    } catch (e) {
      Cu.reportError(e);
    }
  }
};

exports.TelemetrySender = TelemetrySender;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals Services */


const {Cu, Ci} = __webpack_require__(0);

Cu.import("resource://gre/modules/Services.jsm");

function AppURLHider(appURLs) {
  this._appURLs = appURLs;
  this._hideAppURLs();
}

AppURLHider.prototype = {
  uninit() {
    Services.ww.unregisterNotification(this._windowObserver);
    delete this._cachedWindowObserver;
  },

  /**
   * Add the app urls to the hidden pages of the passed in window.
   */
  _addHiddenURLsTo(window) {
    if (window.gInitialPages && !window.gInitialPages.includes(this._appURLs[0])) {
      window.gInitialPages.push(...this._appURLs);
    }
  },

  /**
   * Watches for new windows and adds app urls to the list of hidden awesomebar
   * URLs.
   */
  get _windowObserver() {
    if (!this._cachedWindowObserver) {
      this._cachedWindowObserver = {
        observe: (chromeWindow, topic) => {
          if (topic === "domwindowopened") {
            let window = chromeWindow;
            const onListen = {
              handleEvent: () => {
                this._addHiddenURLsTo(window);
                window.QueryInterface(Ci.nsIDOMWindow).removeEventListener("DOMContentLoaded", onListen, false);
              }
            };
            window.QueryInterface(Ci.nsIDOMWindow).addEventListener("DOMContentLoaded", onListen, false);
          }
        }
      };
    }
    return this._cachedWindowObserver;
  },

  /**
   * Adds app urls to the list of hidden awesomebar URLs of each open window and
   * sets up an observer for new windows that are opened.
   */
  _hideAppURLs() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
      let window = enumerator.getNext();
      this._addHiddenURLsTo(window);
    }

    Services.ww.registerNotification(this._windowObserver);
  }
};

exports.AppURLHider = AppURLHider;


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



const {Ci, Cc, Cu, ChromeWorker} = __webpack_require__(0);

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const XHTML_NS = "http://www.w3.org/1999/xhtml";
const MAXIMUM_PIXELS = Math.pow(144, 2);

function ColorAnalyzer() {
  // a queue of callbacks for each job we give to the worker
  this.callbacks = [];

  this.hiddenWindowDoc = Cc["@mozilla.org/appshell/appShellService;1"].
                         getService(Ci.nsIAppShellService).
                         hiddenDOMWindow.document;

  this.worker = new ChromeWorker("resource://gre/modules/ColorAnalyzer_worker.js");
  this.worker.onmessage = this.onWorkerMessage.bind(this);
  this.worker.onerror = this.onWorkerError.bind(this);
}

ColorAnalyzer.prototype = {
  findRepresentativeColor: function ColorAnalyzer_frc(imageURI, callback) {
    function cleanup() {
      image.removeEventListener("load", loadListener);
      image.removeEventListener("error", errorListener);
    }
    let image = this.hiddenWindowDoc.createElementNS(XHTML_NS, "img");
    let loadListener = this.onImageLoad.bind(this, image, callback, cleanup);
    let errorListener = this.onImageError.bind(this, image, callback, cleanup);
    image.addEventListener("load", loadListener);
    image.addEventListener("error", errorListener);
    image.src = imageURI.spec;
  },

  onImageLoad: function ColorAnalyzer_onImageLoad(image, callback, cleanup) {
    if (image.naturalWidth * image.naturalHeight > MAXIMUM_PIXELS) {
      // this will probably take too long to process - fail
      callback(false);
    } else {
      let canvas = this.hiddenWindowDoc.createElementNS(XHTML_NS, "canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      let ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      try {
        this.startJob(ctx.getImageData(0, 0, canvas.width, canvas.height), callback);
      } catch (e) {
        callback(false);
      }
    }
    cleanup();
  },

  onImageError: function ColorAnalyzer_onImageError(image, callback, cleanup) {
    Cu.reportError("ColorAnalyzer: image at " + image.src + " didn't load");
    callback(false);
    cleanup();
  },

  startJob: function ColorAnalyzer_startJob(imageData, callback) {
    this.callbacks.push(callback);
    this.worker.postMessage({ imageData: imageData, maxColors: 1 });
  },

  onWorkerMessage: function ColorAnalyzer_onWorkerMessage(event) {
    // colors can be empty on failure
    if (event.data.colors.length < 1) {
      this.callbacks.shift()(false);
    } else {
      this.callbacks.shift()(true, event.data.colors[0]);
    }
  },

  onWorkerError: function ColorAnalyzer_onWorkerError(error) {
    // this shouldn't happen, but just in case
    error.preventDefault();
    Cu.reportError("ColorAnalyzer worker: " + error.message);
    this.callbacks.shift()(false);
  }
};

module.exports = new ColorAnalyzer();


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

const {Cu} = __webpack_require__(0);
const ColorAnalyzer = __webpack_require__(33);
Cu.import("resource://gre/modules/Services.jsm");

exports.getColor = function getColor(dataURI, label) {
  return new Promise((resolve, reject) => {
    try {
      ColorAnalyzer.findRepresentativeColor({spec: dataURI}, (ok, number) => {
        if (ok) {
          const rgb = [(number >> 16) & 0xFF, (number >> 8) & 0xFF, number & 0xFF];
          resolve(rgb);
        } else {
          resolve(null);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/* global XPCOMUtils, EventEmitter */

const {Cu} = __webpack_require__(0);
const prefService = __webpack_require__(24);
const {PrefsTarget} = __webpack_require__(11);
const ss = __webpack_require__(25);
const {preferencesBranch} = __webpack_require__(5);
const PREF_PREFIX = `extensions.${preferencesBranch}.experiments.`;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGetter(global, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

exports.ExperimentProvider = class ExperimentProvider {
  constructor(experiments = __webpack_require__(15), rng) {
    this._experiments = experiments;
    this._rng = rng || Math.random;
    this._data = {};
    this._experimentId = null;
    this._target = PrefsTarget();
    EventEmitter.decorate(this);

    this._onPrefChange = this._onPrefChange.bind(this);
  }

  init() {
    this.setValues();
    Object.keys(this._experiments).forEach(experimentName => {
      this._target.on(PREF_PREFIX + experimentName, this._onPrefChange);
      Object.defineProperty(this._data, experimentName, {
        get() {
          return prefService.get(PREF_PREFIX + experimentName);
        },
        enumerable: true
      });
    });
  }

  _onPrefChange(prefName) {
    this.overrideExperimentPrefs(prefName);
    this.emit("change", prefName);
  }

  /**
   * This is called when experiment prefs are changed so
   * that users are pulled out of all experiment reporting.
   */
  overrideExperimentPrefs(prefName) {
    ss.storage.overrideExperimentProvider = true;
    this._experimentId = null;
  }

  /**
   * This is used to disable all experiments, i.e set all their
   * values to their original control value.
   */
  disableAllExperiments() {
    Object.keys(this._experiments).forEach(key => {
      const experiment = this._experiments[key];
      const {active, control} = experiment;
      if (active) {
        prefService.set(PREF_PREFIX + key, control.value);
      }
    });
  }

  setValues() {
    if (ss.storage.overrideExperimentProvider) {
      console.log(`The following experiments were turned on via overrides:\n`); // eslint-disable-line no-console
      Object.keys(this._experiments).forEach(experimentName => {
        const {variant, control} = this._experiments[experimentName];
        if (prefService.get(PREF_PREFIX + experimentName) === variant.value) {
          console.log(`- ${experimentName} - \n`); // eslint-disable-line no-console
        } else {
          prefService.set(PREF_PREFIX + experimentName, control.value);
        }
      });
      return;
    }

    // if the global pref to disable experiments is on, disable experiments
    if (!prefService.get(`extensions.${preferencesBranch}.activateExperiments`)) {
      this.disableAllExperiments();
      return;
    }

    const randomNumber = this._rng();
    let floor = 0;
    let inExperiment;

    Object.keys(this._experiments).forEach(key => {
      const experiment = this._experiments[key];
      const {variant, control} = experiment;

      if (prefService.get(PREF_PREFIX + key) === variant.value) {
        if (experiment.active) {
          // If the user is already part of an active experiment, set the experiment id.
          this._experimentId = variant.id;
        } else {
          // If the user is part of an inactive experiment,
          // reset that experiment's pref.
          prefService.set(PREF_PREFIX + key, control.value);
          this._experimentId = null;
        }
      }
    });

    Object.keys(this._experiments).forEach(key => {
      const experiment = this._experiments[key];
      const {variant, control} = experiment;
      const ceiling = variant.threshold + floor;

      // If the experiment is not new or not active you will not be assigned to it.
      if (prefService.has(PREF_PREFIX + key) || !experiment.active) {
        return;
      }

      // If the experiment pref is undefined, it's a new experiment. Start
      // by assuming the user will not be in it.
      prefService.set(PREF_PREFIX + key, control.value);

      if (ceiling > 1) {
        throw new Error("Your variant cohort sizes should add up to less than 1.");
      }

      // If you're already in an experiment, you can't be in another one.
      if (this._experimentId) {
        return;
      }

      // If a user is in no experiments and there are new, active experiments,
      // randomly assign them to a variant (or control)
      inExperiment = randomNumber >= floor && randomNumber < ceiling;
      if (inExperiment) {
        this._experimentId = variant.id;
        prefService.set(PREF_PREFIX + key, variant.value);
      }
      floor = ceiling;
    });
  }

  // This is an object representing all experiments
  get data() {
    return this._data;
  }

  // This returns null if the user is part of a control group,
  // or an id indicating the experiment/variant if they are part of it.
  get experimentId() {
    return this._experimentId;
  }

  destroy() {
    this._experimentId = null;
    Object.keys(this._experiments).forEach(experimentName => {
      this._target.removeListener(PREF_PREFIX + experimentName, this._onPrefChange);
    });
  }

  clearPrefs() {
    Object.keys(this._experiments).forEach(experimentName => {
      prefService.reset(PREF_PREFIX + experimentName);
    });
    ss.storage.overrideExperimentProvider = false;
  }
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

const simplePrefs = __webpack_require__(4);
const {Cu} = __webpack_require__(0);
const {PlacesProvider} = __webpack_require__(6);
const {Recommender} = __webpack_require__(63);
const Feed = __webpack_require__(7);
const {TOP_SITES_LENGTH, HIGHLIGHTS_LENGTH} = __webpack_require__(3);
const am = __webpack_require__(1);

const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes

module.exports = class HighlightsFeed extends Feed {
  constructor(options) {
    super(options);
    this.baselineRecommender = null; // Added in initializeRecommender, if the experiment is turned on
  }

  /**
   * getCoefficientsFromPrefs - Try to get the coefficients for the recommender from prefs.
   *                            They should be an array of numbers
   *
   * @return {array/null}  If we could parse them, we return the array.
   *                       If we couldn't parse them, we return null.
   */
  getCoefficientsFromPrefs() {
    try {
      let value = JSON.parse(simplePrefs.prefs.weightedHighlightsCoefficients);
      if (Array.isArray(value)) {
        return value;
      }
      Cu.reportError("Coefficients values must be a valid array");
    } catch (e) {
      Cu.reportError(e);
    }
    return null;
  }

  /**
   * initializeRecommender - This creates a recommender and assigns it to .baselineRecommender
   *                         To do this, it calls the .getAllHistoryItems query on places provider.
   *                         It will then refresh the app
   *
   * @return {Promise}  Returns the promise created by .getAllHistoryItems
   */
  initializeRecommender(reason) {
    return PlacesProvider.links.getAllHistoryItems().then(links => {
      let highlightsCoefficients = this.getCoefficientsFromPrefs();
      this.baselineRecommender = new Recommender(links, {highlightsCoefficients});
    }).then(() => this.refresh(reason));
  }

  /**
   * getData
   *
   * @return Promise  A promise that resolves with the "HIGHLIGHTS_RESPONSE" action
   */
  getData() {
    if (!this.baselineRecommender) {
      return Promise.reject(new Error("Tried to get weighted highlights but there was no baselineRecommender"));
    }
    return PlacesProvider.links.getRecentlyVisited()
      .then(links => this.options.getCachedMetadata(links, "HIGHLIGHTS_RESPONSE"))
      .then(links => this.baselineRecommender.scoreEntries(links))
      .then(links => am.actions.Response("HIGHLIGHTS_RESPONSE", links));
  }

  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app inititalizes, create a recommender, and then refresh the data.
        this.initializeRecommender("app was initializing");
        break;
      case am.type("RECEIVE_BOOKMARK_ADDED"):
        // We always want new bookmarks
        this.refresh("a bookmark was added");
        break;
      case am.type("METADATA_UPDATED"):
        // If the user visits a site and we don't have enough weighted highlights yet, refresh the data.
        if (state.Highlights.rows.length < (HIGHLIGHTS_LENGTH + TOP_SITES_LENGTH)) {
          this.refresh("there were not enough sites");
        }
        // If the user visits a site & the last time we refreshed the data was older than 15 minutes, refresh the data.
        if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          this.refresh("the sites were too old");
        }
        break;
      case am.type("PREF_CHANGED_RESPONSE"):
        // If the weightedHighlightsCoefficients pref was changed and we have a recommender, update it with
        // the new coefficients.
        if (action.data.name === "weightedHighlightsCoefficients" && this.baselineRecommender) {
          let highlightsCoefficients = this.getCoefficientsFromPrefs();
          this.baselineRecommender.updateOptions({highlightsCoefficients});
          this.refresh("coefficients were changed");
        }
        break;
      case am.type("SYNC_COMPLETE"):
        // We always want new synced tabs.
        this.refresh("new tabs synced");
        break;
      case am.type("MANY_LINKS_CHANGED"):
        // manyLinksChanged is an event fired by Places when all history is cleared,
        // or when frecency of links change due to something like a sync
        this.refresh("frecency of many links changed");
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

const {PrefsTarget} = __webpack_require__(11);
const {findClosestLocale, getPreferedLocales} = __webpack_require__(111);
const Feed = __webpack_require__(7);
const am = __webpack_require__(1);
const AVAILABLE_LOCALES = Object.keys(__webpack_require__(14));

// These all affect getPreferedLocales
const LOCALE_PREFS = [
  "intl.locale.matchOS",
  "general.useragent.locale",
  "intl.accept_languages"
];

class LocalizationFeed extends Feed {
  constructor(options) {
    super(options);
    this.availableLocales = options.availableLocales || AVAILABLE_LOCALES;
    this.prefsTarget = PrefsTarget();
    this.onPrefChange = this.onPrefChange.bind(this);
  }
  onPrefChange(pref) {
    this.refresh(`${pref} pref was updated`);
  }
  addListeners() {
    LOCALE_PREFS.forEach(pref => this.prefsTarget.on(pref, this.onPrefChange));
  }
  removeListeners() {
    LOCALE_PREFS.forEach(pref => this.prefsTarget.removeListener(pref, this.onPrefChange));
  }
  getData() {
    let locale = findClosestLocale(this.availableLocales, getPreferedLocales());
    return Promise.resolve(am.actions.Response("LOCALE_UPDATED", locale));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        this.addListeners();
        this.refresh("app was initializing");
        break;
      case am.type("APP_UNLOAD"):
        this.removeListeners();
    }
  }
}

LocalizationFeed.LOCALE_PREFS = LOCALE_PREFS;
module.exports = LocalizationFeed;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals module, require */

const {PlacesProvider} = __webpack_require__(6);
const simplePrefs = __webpack_require__(4);
const Feed = __webpack_require__(7);
const am = __webpack_require__(1);
const MAX_NUM_LINKS = 5;

module.exports = class MetadataFeed extends Feed {
  constructor(options) {
    super(options);
    this.linksToFetch = new Map();
  }

  /**
   * When the app initializes, we want to have metadata for all existing entries,
   * therefore add them to the list of links to fetch metadata for, then refresh
   * the state
   */
  getInitialMetadata(reason) {
    return PlacesProvider.links.getRecentlyVisited().then(links => {
      links.forEach(item => this.linksToFetch.set(item.url, Date.now()));
    }).then(() => this.refresh(reason));
  }

  /**
   * Once the max number of links is collected, start an async job to fetch
   * metadata for those links, and clear the list of links which are missing metadata
   */
  getData() {
    let links = Array.from(this.linksToFetch.keys(), item => Object.assign({"url": item}));
    this.linksToFetch.clear();

    // if we are in the experiment, make a network request through PageScraper
    if (simplePrefs.prefs["experiments.locallyFetchMetadata20"]) {
      return this.options.fetchNewMetadataLocally(links, "METADATA_FEED_REQUEST").then(() => (am.actions.Response("METADATA_UPDATED")));
    }
    return this.options.fetchNewMetadata(links, "METADATA_FEED_REQUEST").then(() => (am.actions.Response("METADATA_UPDATED")));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        this.getInitialMetadata("app was initializing");
        break;
      case am.type("RECEIVE_PLACES_CHANGES"):
        this.linksToFetch.set(action.data.url, Date.now());
        if (this.linksToFetch.size > MAX_NUM_LINKS) {
          this.refresh("metadata was needed for these links");
        }
        break;
    }
  }
};
module.exports.MAX_NUM_LINKS = MAX_NUM_LINKS;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

const {PlacesProvider} = __webpack_require__(6);
const {Cu} = __webpack_require__(0);
const Feed = __webpack_require__(7);
const am = __webpack_require__(1);
const {PlacesStatsUpdate} = am.actions;
const UPDATE_TIME = 24 * 60 * 60 * 1000; // 24 hours

module.exports = class PlacesStatsFeed extends Feed {
  // Used by this.refresh
  getData() {
    this.sendStatsPing();
    return Promise.all([
      PlacesProvider.links.getHistorySize(),
      PlacesProvider.links.getBookmarksSize()
    ])
    .then(([historySize, bookmarksSize]) => (
      PlacesStatsUpdate(historySize, bookmarksSize)
    ));
  }
  sendStatsPing() {
    this.options.metadataStore.asyncGetOldestInsert().then(timestamp => {
      if (timestamp) {
        Promise.all([
          PlacesProvider.links.getHistorySizeSince(timestamp),
          this.options.metadataStore.asyncCountAllItems()
        ]).then(([placesCount, metadataCount]) => {
          let event = this.options.tabTracker.generateEvent({source: "PLACES_STATS_FEED"});
          this.options.tabTracker.handlePerformanceEvent(event, "countHistoryURLs", placesCount);
          this.options.tabTracker.handlePerformanceEvent(event, "countMetadataURLs", metadataCount);
        }).catch(e => Cu.reportError(e));
      }
    }).catch(e => Cu.reportError(e));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app first starts up, refresh the data.
        this.refresh("app was initializing");
        break;
      case am.type("RECEIVE_PLACES_CHANGES"):
        // When a user visits a site, if the last time we refreshed the data is greater than 24 hours, refresh the data.
        if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          this.refresh("queries are older than 24 hours");
        }
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

const Feed = __webpack_require__(7);
const am = __webpack_require__(1);
const getCurrentBrowser = __webpack_require__(54);
const {Cu} = __webpack_require__(0);

module.exports = class SearchFeed extends Feed {

  /**
   * getEngines - Dispatches an action that contains all the search engines,
   *              e.g. Google, Yahoo, etc.
   */
  getEngines() {
    const state = {
      engines: this.options.searchProvider.currentState.engines,
      currentEngine: JSON.stringify(this.options.searchProvider.currentState.currentEngine)
    };
    this.store.dispatch({type: "SEARCH_STATE_UPDATED", data: state});
  }

  /**
   * getSuggestions - Retrieves search suggestions for a search string (action.data)
   *                  Dispatches an array of suggestions.
   */
  getSuggestions(action) {
    const browser = getCurrentBrowser();
    return this.options.searchProvider.asyncGetSuggestions(browser, action.data)
      .then(suggestions => this.options.send(am.actions.Response("SEARCH_SUGGESTIONS_RESPONSE", suggestions), action.workerId, true))
      .catch(e => Cu.reportError(e));
  }

  cycleCurrentEngine(action) {
    this.options.searchProvider.cycleCurrentEngine(action.data);
    const engine = this.options.searchProvider.currentEngine;
    this.options.send(am.actions.Response("SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE", {currentEngine: engine}), action.workerId);
  }

  /**
   * doSearch - Triggers a search in the current new tab, given a search string.
   */
  doSearch(action) {
    this.options.searchProvider.asyncPerformSearch(getCurrentBrowser(), action.data);
  }

  removeFormHistoryEntry(action) {
    this.options.searchProvider.removeFormHistoryEntry(getCurrentBrowser(), action.data);
  }

  manageEngines() {
    this.options.searchProvider.manageEngines(getCurrentBrowser());
  }

  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        this.getEngines();
        break;
      case am.type("SEARCH_ENGINES_CHANGED"):
        this.getEngines();
        break;
      case am.type("SEARCH_SUGGESTIONS_REQUEST"):
        this.getSuggestions(action);
        break;
      case am.type("NOTIFY_PERFORM_SEARCH"):
        this.doSearch(action);
        break;
      case am.type("NOTIFY_REMOVE_FORM_HISTORY_ENTRY"):
        this.removeFormHistoryEntry(action);
        break;
      case am.type("NOTIFY_MANAGE_ENGINES"):
        this.manageEngines();
        break;
      case am.type("SEARCH_CYCLE_CURRENT_ENGINE_REQUEST"): {
        this.cycleCurrentEngine(action);
        break;
      }
    }
  }
};


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

/* globals Task */
const {Cu} = __webpack_require__(0);
const {PlacesProvider} = __webpack_require__(6);
const Feed = __webpack_require__(7);
const {TOP_SITES_LENGTH} = __webpack_require__(3);
const am = __webpack_require__(1);
const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes
const getScreenshots = __webpack_require__(55);
const {isRootDomain} = __webpack_require__(13);

Cu.import("resource://gre/modules/Task.jsm");

module.exports = class TopSitesFeed extends Feed {
  // Used by this.refresh
  getData() {
    return Task.spawn(function*() {
      const experiments = this.store.getState().Experiments.values;

      let links;
      // Get links from places
      links = yield PlacesProvider.links.getTopFrecentSites();

      // Get metadata from PreviewProvider
      links = yield this.options.getCachedMetadata(links, "TOP_FRECENT_SITES_RESPONSE");

      // Get screenshots if the favicons are too small
      if (experiments.screenshots) {
        try {
          links = yield getScreenshots(links, site => {
            if (site.favicon_height >= 96 && site.favicon_width >= 96 && isRootDomain(site.url)) {
              // If we are at the "root domain path" and the icon is big enough,
              // we don't show a screenshot.
              return false;
            }
            return true;
          });
          links = links.map(link => {
            if (link.screenshot) {
              link.metadata_source = `${link.metadata_source}+Screenshot`;
            }
            return link;
          });
        } catch (e) {
          Cu.reportError(e);
        }
      }
      // Create the action
      return am.actions.Response("TOP_FRECENT_SITES_RESPONSE", links);
    }.bind(this));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app first starts up, refresh the data.
        this.refresh("app was initializing");
        break;
      case am.type("RECEIVE_PLACES_CHANGES"):
        // When a user visits a site, if we don't have enough top sites yet, refresh the data.
        if (state.TopSites.rows.length < TOP_SITES_LENGTH) {
          this.refresh("there were not enough sites");
        }
        // When a user visits a site, if the last time we refreshed the data is greater than 15 minutes, refresh the data.
        else if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          this.refresh("the sites were too old");
        }
        break;
      case am.type("MANY_LINKS_CHANGED"):
        // manyLinksChanged is an event fired by Places when all history is cleared,
        // or when frecency of links change due to something like a sync
        this.refresh("frecency of many links changed");
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

const TopSitesFeed = __webpack_require__(41);
const HighlightsFeed = __webpack_require__(36);
const PlacesStatsFeed = __webpack_require__(39);
const SearchFeed = __webpack_require__(40);
const MetadataFeed = __webpack_require__(38);
const LocalizationFeed = __webpack_require__(37);

module.exports = [
  TopSitesFeed,
  HighlightsFeed,
  PlacesStatsFeed,
  SearchFeed,
  MetadataFeed,
  LocalizationFeed
];


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals require, exports */


const {getMetadata} = __webpack_require__(88);
const {Cc, Ci} = __webpack_require__(0);

function MetadataParser() {
}

MetadataParser.prototype = {
  /**
   * Parse the outerHTML
   */
  _getDocumentObject(text) {
    const parser = Cc["@mozilla.org/xmlextras/domparser;1"]
                  .createInstance(Ci.nsIDOMParser);
    return parser.parseFromString(text, "text/html");
  },

  /**
   * Format the data so the metadata DB receives it
   */
  _formatData(data, url) {
    const images = data.image_url ? [{url: data.image_url}] : [];
    const formattedData = {
      url,
      images,
      provider_name: data.provider,
      original_url: data.original_url,
      title: data.title,
      description: data.description,
      favicon_url: data.icon_url
    };
    return formattedData;
  },

  /**
   * Parse HTML, get the metadata from it, and format it
   */
  parseHTMLText(raw, url) {
    const doc = this._getDocumentObject(raw);
    return this._formatData(getMetadata(doc, url), url);
  }
};

exports.MetadataParser = MetadataParser;


/***/ }),
/* 44 */
/***/ (function(module, exports) {

/*
 * The migration file for the metadata store
 *
 * Each migration consists of a version, an optional description, and an array of migration
 * statements. The order of migrations array will be treated as the timeline of migration history.
 * Therefore, the migration history should be used as an immutable array, you should never
 * delete versions if they have already been migrated. Instead, you should create a new
 * migration to revert its effect.
 *
 * Note that all the migration actions are subject to the related rules of SQLite, there are
 * some certain actions that are not revertible. Please use this feature sparingly.
 *
 * Reference:
 * [1]. https://www.sqlite.org/lang_altertable.html
 *
 * Example:
 * exports.migration = [
 *   {
 *     version: "1.0.0",
 *     description: "A dummy migration as a sentinel",
 *     statements: [],
 *   },
 *   {
 *     version: "1.0.1",
 *     description: "version 1.0.1",
 *     statements: ["ALTER TABLE foo ADD COLUMN bar VARCHAR(32)"],
 *   }
 * ]
 */

// Don't delete the version "1.0.0" as it acts as a sentinel
exports.MIGRATIONS = [
  {
    version: "1.0.0",
    description: "A dummy migration as a sentinel",
    statements: []
  },
  {
    version: "1.0.1",
    description: "Add a metadata_source field to MetadataStore",
    statements: ["ALTER TABLE page_metadata ADD COLUMN metadata_source VARCHAR(32) DEFAULT 'Embedly'"]
  },
  {
    version: "1.0.2",
    description: "Add a provider_name field to MetadataStore",
    statements: ["ALTER TABLE page_metadata ADD COLUMN provider_name VARCHAR(32)"]
  }
];


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

const generateUUID = __webpack_require__(27);
const privateBrowsing = __webpack_require__(114);
const {Cu} = __webpack_require__(0);
const {PageMod} = __webpack_require__(112);
const {data} = __webpack_require__(5);
const {CONTENT_TO_ADDON} = __webpack_require__(8);
const {WORKER_ATTACHED_EVENT} = __webpack_require__(3);

module.exports = class PageModProvider {
  constructor({pageURL, uuid, onAddWorker, onRemoveWorker} = {}) {
    this.workers = new Map();
    this.pageURL = pageURL;
    this.uuid = uuid || (() => String(generateUUID.uuid()));
    this.onAddWorker = onAddWorker;
    this.onRemoveWorker = onRemoveWorker;
    this._perfMeter = null;
    this._pagemod = null;
    this._logEvent = null;
  }

  /**
   * Sets up communications with the pages and manages the lifecycle of workers
   */
  init({onAttach, onMessage, logEvent} = {}) {
    this._logEvent = logEvent;
    this._pagemod = new PageMod({
      include: [`${this.pageURL}*`],
      contentScriptFile: data.url("content-bridge.js"),
      contentScriptWhen: "start",
      attachTo: ["existing", "top"],
      onAttach: worker => {
        if (onAttach) {
          onAttach();
        }

        // Don't attach when in private browsing. Send user to about:privatebrowsing
        if (privateBrowsing.isPrivate(worker)) {
          worker.tab.url = "about:privatebrowsing";
          return;
        }

        // This detaches workers on reload or closing the tab
        worker.on("detach", () => this.removeWorker(worker));

        // add the worker to a set to enable broadcasting
        const workerId = this.addWorker(worker);

        worker.port.on(CONTENT_TO_ADDON, msg => {
          if (!msg.type) {
            Cu.reportError("ActivityStreams.dispatch error: unknown message type");
            return;
          }
          // This detaches workers if a new url is launched
          // it is important to remove the worker from the set, otherwise we will leak memory
          if (msg.type === "pagehide") {
            this.removeWorker(worker);
          }
          if (onMessage) {
            const message = Object.assign({}, msg, {workerId});
            onMessage({msg: message, worker});
          }
        });
      },
      onError: err => {
        Cu.reportError(err);
      }
    });
  }

  /**
   * getWorkerById - Returns a reference to a worker, given an id
   *
   * @param  {string} workerId unique identified of a worker
   * @return {obj}             a worker
   */
  getWorkerById(workerId) {
    let worker;
    for (let [w, id] of this.workers) {
      if (id === workerId) {
        worker = w;
      }
    }
    return worker;
  }

  /**
   * Adds a worker and returns the new id
   */
  addWorker(worker) {
    if (this.workers.has(worker)) {
      return this.workers.get(worker);
    }
    const id = this.uuid();
    this.workers.set(worker, id);
    if (this._logEvent) {
      this._logEvent(worker.tab, WORKER_ATTACHED_EVENT);
    }
    if (this.onAddWorker) {
      this.onAddWorker();
    }
    return id;
  }

  /**
   * Removes a worker
   */
  removeWorker(worker) {
    this.workers.delete(worker);
    if (this.onRemoveWorker) {
      this.onRemoveWorker();
    }
  }

  destroy() {
    this.workers.clear();
    if (this._pagemod) {
      this._pagemod.destroy();
    }
  }
};


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals Services, Task */


const {MetadataParser} = __webpack_require__(43);
const {Cu} = __webpack_require__(0);
const options = __webpack_require__(109);

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.importGlobalProperties(["URL"]);
Cu.importGlobalProperties(["fetch"]);

const DEFAULT_OPTIONS = {
  framescriptPath: new URL("data/page-scraper-content-script.js", options.prefixURI),
  blacklist: ["about:", "localhost:", "resource://"]
};
const PERFORMANCE_EVENT_NAMES = {
  framescript_event: "framescriptMessageReceived",
  local_fetch_event: "localFetchStarted",
  metadata_raw_html: "metadataReceivedRawHTML",
  metadata_exists: "metadataExists",
  metadata_invalid: "metadataInvalidReceived",
  metadata_sucess: "metadataParseSuccess",
  metadata_fail: "metadataParseFail",
  network_fail: "networkRequestFailed"
};

function PageScraper(previewProvider, tabTracker, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._previewProvider = previewProvider;
  this._tabTracker = tabTracker;
  this._metadataParser = new MetadataParser();
}

/**
 * Receives raw HTML from a page and sends it to a service to be parsed and the
 * metadata extracted, and then stores that in the metadata DB. It takes an instance
 * of PreviewProvider, since all the link processing takes places in PreviewProvider
 */

PageScraper.prototype = {
  /**
   * Parse the HTML and attempt to insert it in the metadata database
   */
  _parseAndSave(rawHTML, url, event) {
    this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_raw_html, Date.now());
    let metadata;
    try {
      metadata = this._metadataParser.parseHTMLText(rawHTML, url);
    } catch (err) {
      Cu.reportError(`MetadataParser failed to parse ${url}. ${err}`);
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_fail, Date.now());
      return;
    }
    this._asyncSaveMetadata(metadata, event);
  },

  /**
   * Save the metadata in the MetadataStore DB
   */
  _asyncSaveMetadata: Task.async(function*(metadata, event) {
    const startTime = Date.now();
    const shouldSaveMetadata = yield this._shouldSaveMetadata(metadata);
    if (!shouldSaveMetadata) {
      return;
    }
    try {
      if (metadata.images && metadata.images.length) {
        let {url, height, width} = yield this._previewProvider._computeImageSize(metadata.images[0].url);
        metadata.images[0].height = height || 500;
        metadata.images[0].width = width || 500;
        metadata.images[0].url = url;
      }
      if (metadata.favicon_url) {
        let {height, width} = yield this._previewProvider._computeImageSize(metadata.favicon_url);
        if (height && width) {
          metadata.favicon_height = height;
          metadata.favicon_width = width;
        }
      }
    } catch (e) {
      Cu.reportError(`PageScraper failed to compute image size for ${metadata.url}`);
    }
    this._previewProvider.processAndInsertMetadata(metadata, "Local");
    this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_sucess, Date.now() - startTime);
  }),

  /**
   * Make a network request for links that the MetadataFeed has requested metadata for.
   * Attempt to parse the html from that page and insert into the DB
   */
  asyncFetchLinks: Task.async(function*(links, eventType) {
    for (let link of links) {
      const event = this._tabTracker.generateEvent({source: eventType});
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.local_fetch_event, Date.now());
      let linkExists = yield this._previewProvider.asyncLinkExist(link.url);
      if (linkExists) {
        this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_exists, Date.now());
        return;
      }
      let rawHTML;
      try {
        rawHTML = yield this._fetchContent(link.url);
      } catch (err) {
        Cu.reportError(`PageScraper failed to get page content for ${link.url}. ${err}`);
        this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.network_fail, Date.now());
        return;
      }
      this._parseAndSave(rawHTML, link.url, event);
    }
  }),

  /**
   * Wrapper for requesting the URL and returning it's DOM
   */
  _fetchContent: Task.async(function*(url) {
    const response = yield fetch(url);
    const rawHTML = yield response.text();
    return rawHTML;
  }),

  /**
   * If metadata has neither a title, nor a favicon_url we do not want to insert
   * it into the metadata DB. If the link already exists we do not want to insert
   * it into the metadata DB. Capture both events
   */
  _shouldSaveMetadata: Task.async(function*(metadata, event) {
    const linkExists = yield this._previewProvider.asyncLinkExist(metadata.url);
    if (linkExists) {
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_exists, Date.now());
    }
    const hasMetadata = metadata && !!metadata.title && !!metadata.favicon_url;
    if (!hasMetadata) {
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_invalid, Date.now());
    }
    return (hasMetadata && !linkExists);
  }),

  /**
   * Ensure that the page doesn't belong to a blacklist by checking that the
   * url is not a substring of a restricted set of knows urls that should not
   * collect metadata
   */
  _blacklistFilter(url) {
    return (this.options.blacklist.every(item => url.indexOf(item) === -1));
  },

  /**
   * Message handler for the incoming framescript messages
   */
  _messageHandler(message) {
    let {text, url} = message.data.data;
    if (message.data.type === "PAGE_HTML" && this._blacklistFilter(url)) {
      const event = this._tabTracker.generateEvent({source: "PAGE_SCRAPER"});
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.framescript_event, Date.now());
      this._parseAndSave(text, url, event);
    }
  },

  /**
   * Initialize the Page Scraper
   */
  init() {
    this._messageHandler = this._messageHandler.bind(this);
    Services.mm.loadFrameScript(this.options.framescriptPath, true);
    Services.mm.addMessageListener("page-scraper-message", this._messageHandler);
  },

  /**
   * Uninitialize the Page Scraper
   */
  uninit() {
    Services.mm.removeMessageListener("page-scraper-message", this._messageHandler);
    Services.mm.removeDelayedFrameScript(this.options.framescriptPath);
  }
};

exports.PageScraper = PageScraper;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

const {Page} = __webpack_require__(113);
const {data} = __webpack_require__(5);
const {LOCAL_STORAGE_KEY} = __webpack_require__(3);
const {ADDON_TO_CONTENT} = __webpack_require__(8);
const watch = __webpack_require__(95);
const debounce = __webpack_require__(86);

class PageWorker {
  constructor({store, wait} = {}) {
    if (!store) {
      throw new Error("options.store is required");
    }
    this._page = null;
    this._onDispatch = this._onDispatch.bind(this);
    this._unsubscribe = null;
    this._store = store;
    this._wait = wait || 100;
  }
  _onDispatch() {
    this._page.port.emit(ADDON_TO_CONTENT, {
      type: LOCAL_STORAGE_KEY,
      data: this._store.getState()
    });
  }
  connect() {
    this._page = Page({
      contentURL: data.url("page-worker/page-worker.html"),
      contentScriptFile: data.url("content-bridge.js"),
      contentScriptWhen: "start"
    });

    // Note: watch only calls the callback (this._onDispatch) if something on
    // the state object actually changed
    const w = watch(this._store.getState);

    /* Notes:
    1. According to the redux docs, calling .subscribe on a store
    returns a function which will unsubscribe
    2. We wait a certain amount of time (this._wait) before updating
    local storage in order to not overload writing to the state. In order for
    user actions to accurately represent the state of the app when we trigger a
    refresh (or open a new tab) we must set the wait to be low i.e 100ms in this case */
    this._unsubscribe = this._store.subscribe(debounce(w(this._onDispatch), this._wait));
  }
  destroy() {
    if (this._page) {
      try {
        this._page.destroy();
      } catch (e) {
        // The page probably wasn't set up yet
      }
      this._page = null;
    }
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }
}

module.exports = PageWorker;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

/* globals Services */
const {Cu} = __webpack_require__(0);
Cu.import("resource://gre/modules/Services.jsm");

const tabs = __webpack_require__(12);
const simplePrefs = __webpack_require__(4);

const {absPerf} = __webpack_require__(10);
const {WORKER_ATTACHED_EVENT} = __webpack_require__(3);

const VALID_TELEMETRY_TAGS = new Set([
  "TAB_READY",
  "NOTIFY_PERFORMANCE",
  WORKER_ATTACHED_EVENT
]);

function PerfMeter(trackableURLs) {
  this._trackableURLs = trackableURLs;
  this._tabs = {};
  this.onOpen = this.onOpen.bind(this);
  this.onReady = this.onReady.bind(this);
  this.onClose = this.onClose.bind(this);
  this.onPrefChange = this.onPrefChange.bind(this);
  tabs.on("open", this.onOpen);
  simplePrefs.on("performance.log", this.onPrefChange);
  this._active = simplePrefs.prefs["performance.log"];
  this._stats = {
    sum: 0,
    squareSum: 0,
    samples: []
  };
}

PerfMeter.prototype = {

  get events() {
    return this._tabs;
  },

  _addSampleValue(value) {
    this._stats.sum += value;
    this._stats.squareSum += value * value;
    this._stats.samples.push(value);
  },

  _isLoadCompleteEvent(item) {
    return !!(item.data && item.data === "NEWTAB_RENDER");
  },

  _twoDigitsRound(number) {
    return Math.round(number * 100) / 100;
  },

  _computeStats() {
    let total = this._stats.samples.length;
    // deal with median first
    let sorted = this._stats.samples.sort((a, b) => a - b);
    let median;
    let index = Math.floor(total / 2);
    // if there's odd number of samples, take a middle one
    if (total % 2 === 1) {
      median = sorted[index];
    } else {
      // otherwise take a middle point between middle points
      median = (sorted[index - 1] + sorted[index]) / 2;
    }

    let mean = this._stats.sum / total;
    let variance = (this._stats.squareSum / total) - mean * mean;

    return {
      total,
      mean: this._twoDigitsRound(mean),
      std: this._twoDigitsRound(Math.sqrt(variance)),
      median
    };
  },

  uninit() {
    tabs.removeListener("open", this.onOpen);
    simplePrefs.removeListener("performance.log", this.onPrefChange);
    this.clearTabs();
  },

  clearTabs() {
    // remove tab listeners
    for (let id of Object.keys(this._tabs)) {
      this._tabs[id].tab.removeListener("ready", this.onReady);
      this._tabs[id].tab.removeListener("close", this.onClose);
    }
    this._tabs = {};
  },

  onPrefChange() {
    this._active = simplePrefs.prefs["performance.log"];
  },

  isActivityStreamsURL(URL) {
    return this._trackableURLs.includes(URL);
  },

  onReady(tab) {
    if (this.isActivityStreamsURL(tab.url)) {
      this.log(tab, "TAB_READY");
    } else {
      // not an activity stream tab, get rid of it
      delete this._tabs[tab.id];
    }
    tab.removeListener("ready", this.onReady);
  },

  onClose(tab) {
    // Removes the listener for ready, just in case "ready" never fired.
    tab.removeListener("ready", this.onReady);
    delete this._tabs[tab.id];
  },

  onOpen(tab) {
    let item = {tag: "TAB_OPEN", start: 0};
    this._tabs[tab.id] = {
      tab,
      openAt: absPerf.now(),
      events: [item],
      requests: new Map(),
      workerWasAttached: false
    };
    tab.on("ready", this.onReady);
    tab.on("close", this.onClose);
    this.displayItem(tab.id, item);
  },

  log(tab, tag, data) {
    if (this.isActivityStreamsURL(tab.url) && VALID_TELEMETRY_TAGS.has(tag)) {
      let tabData = this._tabs[tab.id];

      if (!tabData) {
        // If the tab was restored, onOpen was never called.
        this.onOpen(tab);
        tabData = this._tabs[tab.id];
      }

      // when tab is reloaded, the worker will be re-attached to the tab and another
      // WORKER_ATTACHED event will be sent. In which case we re-initialize tabData
      if (tag === WORKER_ATTACHED_EVENT) {
        if (tabData.workerWasAttached) {
          // tab is reloaded - re-initialize it. Since reload does not generate TAB_OPEN
          // and TAB_READY events, we introduce articficial ones starting at 0
          tabData.events = [
            {tag: "TAB_RELOAD", start: 0},
            {tag: "TAB_READY", start: 0}
          ];
          tabData.requests = new Map();
          tabData.openAt = absPerf.now();
        }
        tabData.workerWasAttached = true;
      }

      let item = {
        tag,
        start: absPerf.now() - tabData.openAt,
        data
      };

      // handle requests/response pairs
      if (tag.endsWith("_REQUEST")) {
        tabData.requests.set(tag, item.start);
      } else if (tag.endsWith("_RESPONSE")) {
        let request = tag.replace("_RESPONSE", "_REQUEST");
        item.delta = item.start - tabData.requests.get(request);
      }

      tabData.events.push(item);

      // check for last event
      if (this._isLoadCompleteEvent(item)) {
        Services.obs.notifyObservers(null, "performance-log-complete", JSON.stringify({tabId: tab.id, events: tabData.events}));
        this._addSampleValue(item.start);
      }

      // display the event onto console
      this.displayItem(tab.id, item);
    }
  },

  displayItem(tabId, item) {
    if (this._active) {
      console.info(`${tabId} ${item.start} ${item.tag}${item.data ? `:${item.data}` : ""} ${item.delta || ""}`); // eslint-disable-line no-console
      if (this._isLoadCompleteEvent(item)) {
        let {total, mean, std, median} = this._computeStats();
        console.info(`SIZE=${total} MEAN=${mean} STD=${std} MEDIAN=${median}`); // eslint-disable-line no-console
      }
    }
  }
};

exports.PerfMeter = PerfMeter;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const am = __webpack_require__(1);
const simplePrefs = __webpack_require__(4);
const DEFAULT_OPTIONS = {eventTracker: {handleUserEvent() {}}};

/**
 * PrefsProvider
 * Listens to pref changes and broadcasts them to content.
 * It also provides an action handler that can respond to requests and notifications from content.
 */
exports.PrefsProvider = class PrefsProvider {

  /**
   * constructor
   *
   * @param  {obj} options
   *         {obj} options.eventTracker    The TabTracker in order to handler the user event for a pref change (ActivtyStreams.js)
   *         {func} options.broadcast    This is a method that takes an action created with am.actions (action-manager.js)
   */
  constructor(options = {}) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this._onPrefChange = this._onPrefChange.bind(this);
  }

  /**
   * Broadcast the pref change to content in the form
   *  {name: "prefName", value: "newPrefvalue"} and capture that event
   */
  _onPrefChange(name) {
    this.options.broadcast(am.actions.Response("PREF_CHANGED_RESPONSE", {
      name,
      value: simplePrefs.prefs[name]
    }));
    this.options.eventTracker.handleUserEvent({"event": "PREF_CHANGE", "source": name});
  }

  /**
   * init - Sets up a listener on pref changes
   */
  init() {
    simplePrefs.on("", this._onPrefChange);
  }

  /**
   * destroy - Removes the event listener on prefs
   */
  destroy() {
    simplePrefs.off("", this._onPrefChange);
    this._onPrefChange = null;
  }
};


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals Task, Services, require, exports */


const {Cu} = __webpack_require__(0);
const simplePrefs = __webpack_require__(4);
const self = __webpack_require__(5);
const {TippyTopProvider} = __webpack_require__(52);
const {getColor} = __webpack_require__(34);
const {absPerf} = __webpack_require__(10);
const {consolidateBackgroundColors, consolidateFavicons, extractMetadataFaviconFields} = __webpack_require__(13);

const {BACKGROUND_FADE} = __webpack_require__(3);
const ENABLED_PREF = "previews.enabled";
const ENDPOINT = "metadata.endpoint";
const VERSION_SUFFIX = `?addon_version=${self.version}`;
const ALLOWED_PREFS = new Set([ENABLED_PREF]);

const ALLOWED_QUERY_PARAMS = new Set(["id", "p", "q", "query", "s", "search", "sitesearch", "v"]);
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const DISALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const URL_FILTERS = [
  item => !!item.url,
  item => !!(new URL(item.url)),
  item => ALLOWED_PROTOCOLS.has(new URL(item.url).protocol),
  item => !DISALLOWED_HOSTS.has(new URL(item.url).hostname)
];

Cu.importGlobalProperties(["fetch"]);
Cu.importGlobalProperties(["URL"]);
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Services.jsm");

const DEFAULT_OPTIONS = {
  metadataTTL: 3 * 24 * 60 * 60 * 1000, // 3 days for the metadata to live
  proxyMaxLinks: 25, // number of links proxy accepts per request
  initFresh: false
};

function PreviewProvider(tabTracker, metadataStore, store, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._onPrefChange = this._onPrefChange.bind(this);
  this._tippyTopProvider = new TippyTopProvider();
  this._tabTracker = tabTracker;
  this._metadataStore = metadataStore;
  this._store = store;
  this.init();
}

PreviewProvider.prototype = {

  _onPrefChange(prefName) {
    if (ALLOWED_PREFS.has(prefName)) {
      switch (prefName) {
        case ENABLED_PREF:
          this.enabled = simplePrefs.prefs[ENABLED_PREF];
          break;
      }
    }
  },

  /**
    * Filter out sites that do not have acceptable protocols and hosts
    */
  _URLFilter(definition) {
    return function(item) {
      return definition.every(test => test(item));
    };
  },

  /**
    * Sanitize the URL to remove any unwanted or sensitive information about the link
    */
  _sanitizeURL(url) {
    if (!url) {
      return "";
    }

    let newURL = new URL(url);

    // extract and parse the query parameters, if any
    if (newURL.search.length !== 0) {
      let queryParams = new Map(newURL.search.slice(1).split("&").map(pair => pair.split("=")));

      // filter out the allowed query params and update the query string
      newURL.search = Array.from(queryParams.keys())
        .filter(param => ALLOWED_QUERY_PARAMS.has(param))
        .map(param => `${param}=${queryParams.get(param)}`)
        .join("&");
    }

    // remove extra slashes then construct back a safe pathname
    if (newURL.pathname) {
      let safePathItems = newURL.pathname.split("/").filter(item => item.replace(/\/+/, ""));
      let safePath = "/";
      newURL.pathname = safePath + safePathItems.join("/");
    }

    // if the url contains sensitive information, remove it
    if (newURL.username) {
      newURL.username = "";
    }
    if (newURL.password) {
      newURL.password = "";
    }

    newURL.hash = "";
    return newURL.toString();
  },

  /**
    * Create a key based on a URL in order to dedupe sites
    */
  _createCacheKey(spec) {
    let url = new URL(spec);
    let key = url.host.replace(/www\.?/, "");
    key = key + url.pathname + (url.search || "");
    return key.toString();
  },

  /**
    * Canonicalize urls by sanitizing them, then deduping them
    */
  _uniqueLinks(links) {
    let dedupedLinks = new Map();
    links.forEach(link => {
      if (!dedupedLinks.has(link.cache_key)) {
        dedupedLinks.set(link.cache_key, link);
      }
    });
    return Array.from(dedupedLinks.values());
  },

  /**
    * Process the raw links that come in,
    * adds a sanitizeURL and cacheKey
    */
  _processLinks(links) {
    return links
      .filter(this._URLFilter(URL_FILTERS))
      .map(link => {
        const sanitizedURL = this._sanitizeURL(link.url);
        const cacheKey = this._createCacheKey(sanitizedURL);
        return Object.assign({}, link, {sanitized_url: sanitizedURL, cache_key: cacheKey, places_url: link.url});
      });
  },

  /**
    * Get the main colors from the favicon
    */
  _getFaviconColors(link) {
    return new Promise(resolve => {
      if (!link.favicon) {
        resolve(null);
        return null;
      }
      return getColor(link.favicon, link.url)
        .then(color => {
          if (!color) {
            resolve(null);
          } else {
            resolve([...color, BACKGROUND_FADE]);
          }
        })
        .catch(err => {
          Cu.reportError(err);
          resolve(null);
        });
    });
  },

  /**
    * Returns links with previews if available. Optionally return those with previews only
    * Also, collect some metrics on how many links were returned by PlacesProvider vs how
    * how many were returned by the cache
    */
  asyncGetEnhancedLinks: Task.async(function*(links, event) {
    this._tabTracker.handlePerformanceEvent(event, "previewCacheRequest", links.length);
    if (!this.enabled) {
      return links;
    }
    let processedLinks = this._processLinks(links);

    // Collect all items in the DB that we requested and create a mapping between that
    // object's metadata and it's cache key
    let dbLinks = yield this._asyncFindItemsInDB(processedLinks);
    let existingLinks = new Map();
    dbLinks.forEach(item => existingLinks.set(item.cache_key, item));
    let results = [];
    for (let link of processedLinks) {
      if (!link) {
        break;
      }
      // copy over fields we need from the original site object
      let enhancedLink = {};
      enhancedLink.title = link.title;
      enhancedLink.type = link.type;
      enhancedLink.url = link.url;
      enhancedLink.eTLD = link.eTLD;
      enhancedLink.cache_key = link.cache_key;
      enhancedLink.lastVisitDate = link.lastVisitDate;
      enhancedLink.bookmarkDateCreated = link.bookmarkDateCreated;
      enhancedLink.bookmarkGuid = link.bookmarkGuid;

      // get favicon and background color from firefox
      const firefoxBackgroundColor = yield this._getFaviconColors(link);
      const firefoxFaviconURL = link.favicon;

      // get favicon and background color from tippytop
      const {
        favicon_height: tippyTopFaviconHeight,
        favicon_width: tippyTopFaviconWidth,
        favicon_url: tippyTopFaviconURL,
        background_color: tippyTopBackgroundColor,
        metadata_source
      } = this._tippyTopProvider.processSite(link);
      enhancedLink.metadata_source = metadata_source;

      // Find the item in the map and return it if it exists, then unpack that
      // object onto our new link
      let metadataLinkFaviconURL = null;
      let metadataLinkFaviconColor = null;
      let metadataLinkFaviconHeight = null;
      let metadataLinkFaviconWidth = null;
      if (existingLinks.has(link.cache_key)) {
        const cachedMetadataLink = existingLinks.get(link.cache_key);
        const {url, color, height, width} = extractMetadataFaviconFields(cachedMetadataLink);
        metadataLinkFaviconURL = url;
        metadataLinkFaviconColor = color;
        metadataLinkFaviconHeight = height;
        metadataLinkFaviconWidth = width;
        enhancedLink.metadata_source = cachedMetadataLink.metadata_source;
        enhancedLink.title = cachedMetadataLink.title;
        enhancedLink.description = cachedMetadataLink.description;
        enhancedLink.provider_name = cachedMetadataLink.provider_name;
        enhancedLink.images = cachedMetadataLink.images;
      }

      // consolidate favicons, background color and metadata source, then return the final link
      enhancedLink.favicon_url = consolidateFavicons(tippyTopFaviconURL, metadataLinkFaviconURL, firefoxFaviconURL);
      enhancedLink.favicon_width = tippyTopFaviconWidth || metadataLinkFaviconWidth;
      enhancedLink.favicon_height = tippyTopFaviconHeight || metadataLinkFaviconHeight;
      enhancedLink.background_color = consolidateBackgroundColors(tippyTopBackgroundColor, metadataLinkFaviconColor, firefoxBackgroundColor);
      results.push(enhancedLink);
    }

    this._tabTracker.handlePerformanceEvent(event, "previewCacheHits", existingLinks.size);
    this._tabTracker.handlePerformanceEvent(event, "previewCacheMisses", processedLinks.length - existingLinks.size);
    return results;
  }),

  /**
   * Find the metadata for each link in the database
   */
  _asyncFindItemsInDB: Task.async(function*(links) {
    let cacheKeys = [];

    // Create the cache keys
    links.forEach(link => {
      const key = link.cache_key;
      cacheKeys.push(key);
    });

    // Hit the database for the missing keys
    let linksMetadata;
    try {
      linksMetadata = yield this._metadataStore.asyncGetMetadataByCacheKey(cacheKeys);
    } catch (e) {
      Cu.reportError(`Failed to fetch metadata: ${e.message}`);
      return [];
    }
    return linksMetadata;
  }),

  /**
   * Request links from metadata service, optionally filtering out known links
   */
  asyncSaveLinks: Task.async(function*(links, event) {
    let processedLinks = this._processLinks(links);
    let dbLinks = yield this._asyncFindItemsInDB(processedLinks);
    let existingLinks = new Set();
    dbLinks.forEach(item => existingLinks.add(item.cache_key));
    let linksList = this._uniqueLinks(processedLinks)
      // If a request is in progress, don't re-request it
      .filter(link => !this._alreadyRequested.has(link.cache_key))
      // If we already have the link in the database don't request it again
      .filter(link => !existingLinks.has(link.cache_key));

    linksList.forEach(link => this._alreadyRequested.add(link.cache_key));

    let requestQueue = [];
    let promises = [];
    while (linksList.length !== 0) {
      // we have some new links we need to fetch the metadata for, put them on the queue
      requestQueue.push(linksList.splice(0, this.options.proxyMaxLinks));
    }
    // for each bundle of 25 links, create a new request to metadata service
    requestQueue.forEach(requestBundle => {
      promises.push(this._asyncFetchAndStore(requestBundle, event));
    });
    yield Promise.all(promises).catch(err => Cu.reportError(err));
  }),

  /**
   * Makes the necessary requests to metadata service to get data for each link
   */
  _asyncGetLinkData: Task.async(function*(newLinks) {
    try {
      let response = yield fetch(this._metadataEndpoint, {
        method: "POST",
        body: JSON.stringify({urls: newLinks}),
        headers: {"Content-Type": "application/json"}
      });
      return response;
    } catch (err) {
      Cu.reportError(err);
      throw err;
    }
  }),

  /**
   * Extracts data from metadata service and saves in the MetadataStore
   * Also, collect metrics on how many requests were made, how much time each
   * request took to complete, and their success or failure status
   */
  _asyncFetchAndStore: Task.async(function*(newLinks, event) {
    if (!this.enabled) {
      return;
    }
    // extract only the sanitized link urls to send to metadata service
    let linkURLs = newLinks.map(link => link.sanitized_url);
    this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestSentCount", newLinks.length);
    try {
      // Make network call when enabled and record how long the network call took
      const startNetworkCall = absPerf.now();
      let response = yield this._asyncGetLinkData(linkURLs);
      const endNetworkCall = absPerf.now();
      this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestTime", endNetworkCall - startNetworkCall);

      if (response.ok) {
        let responseJson = yield response.json();
        this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestReceivedCount", Object.keys(responseJson.urls).length);
        this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestSucess", 1);
        let linksToInsert = newLinks.filter(link => responseJson.urls[link.sanitized_url])
          .map(link => Object.assign({}, link, responseJson.urls[link.sanitized_url]));

        // add favicon_height and favicon_width to the favicon and store it in db
        yield this._asyncAddFaviconHeightAndWidth(linksToInsert);
        this.insertMetadata(linksToInsert, "MetadataService");
      } else {
        this._tabTracker.handlePerformanceEvent(event, "embedlyProxyFailure", 1);
      }
    } catch (err) {
      Cu.reportError(err);
      throw err;
    }
    // regardess of if the link has been cached or if the request has failed, we
    // must still remove the in-flight links from the list
    newLinks.forEach(link => this._alreadyRequested.delete(link.cache_key));
  }),

  /**
   * Do some post-processing on the links before inserting them into the metadata
   * DB and adding them to the metadata cache
   */
  insertMetadata(links, metadataSource) {
    const linksToInsert = links.map(link => Object.assign({}, link, {
      expired_at: (this.options.metadataTTL) + Date.now(),
      metadata_source: metadataSource
    }));
    return this._metadataStore.asyncInsert(linksToInsert, true).then(() => {
      this._store.dispatch({type: "METADATA_UPDATED"});
    }).catch(err => {
      // TODO: add more exception handling code, e.g. sending exception report
      Cu.reportError(err);
    });
  },

  /**
   * Do some pre-processing on the link before inserting it into the metadata
   * DB and adding them to the metadata cache
   */
  processAndInsertMetadata(link, metadataSource) {
    const processedLink = this._processLinks([link]);
    return this.insertMetadata(processedLink, metadataSource);
  },

  /**
   * Computes and sets the favicon dimensions
   */
  _asyncAddFaviconHeightAndWidth: Task.async(function*(links) {
    for (let link of links) {
      try {
        const {width, height} = yield this._computeImageSize(link.favicon_url);
        if (height && width) {
          link.favicon_width = width;
          link.favicon_height = height;
        }
      }
      catch (err) {}  // eslint-disable-line no-empty
    }
  }),

  /**
   * Locally compute the size of the image
   */
  _computeImageSize(url) {
    return new Promise((resolve, reject) => {
      let image = new Services.appShell.hiddenDOMWindow.Image();
      image.src = url;
      image.addEventListener("load", () => {
        let imageWithSize = {
          url: image.src,
          width: image.width,
          height: image.height
        };
        resolve(imageWithSize);
      });
      image.addEventListener("error", () => reject(`Error loading image: ${url}`));
    });
  },

  /**
   * Check if a single link exists in the metadata DB
   */
  asyncLinkExist: Task.async(function*(url) {
    let key = this._createCacheKey(url);
    if (!key) {
      return false;
    }

    const linkExists = yield this._metadataStore.asyncCacheKeyExists(key);
    return linkExists;
  }),

  /**
   * Initialize Preview Provider
   */
  init() {
    this._alreadyRequested = new Set();
    const endpoint = simplePrefs.prefs[ENDPOINT];
    this._metadataEndpoint = `${endpoint}${VERSION_SUFFIX}`;
    this.enabled = simplePrefs.prefs[ENABLED_PREF];
    simplePrefs.on("", this._onPrefChange);
  },

  /**
   * Uninit the preview provider
   */
  uninit() {
    simplePrefs.off("", this._onPrefChange);
    this._alreadyRequested = new Set();
    this._metadataEndpoint = null;
  }
};

exports.PreviewProvider = PreviewProvider;


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/* global XPCOMUtils, Task, Services, EventEmitter, FormHistory,
SearchSuggestionController, PrivateBrowsingUtils, exports, require */


const {Ci, Cu} = __webpack_require__(0);
const {PrefsTarget} = __webpack_require__(11);
const SEARCH_ENGINE_TOPIC = "browser-search-engine-modified";
const HIDDEN_ENGINES_PREF = "browser.search.hiddenOneOffs";
const ENGINE_ICON_SIZE = 16;
const MAX_LOCAL_SUGGESTIONS = 3;
const MAX_SUGGESTIONS = 6;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.importGlobalProperties(["URL", "Blob", "FileReader", "atob"]);

XPCOMUtils.defineLazyModuleGetter(global, "FormHistory",
                                  "resource://gre/modules/FormHistory.jsm");
XPCOMUtils.defineLazyModuleGetter(global, "PrivateBrowsingUtils",
                                  "resource://gre/modules/PrivateBrowsingUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(global, "SearchSuggestionController",
                                  "resource://gre/modules/SearchSuggestionController.jsm");

XPCOMUtils.defineLazyGetter(global, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

function SearchProvider() {
  EventEmitter.decorate(this);
  this._target = PrefsTarget();
  this._onPrefChange = this._onPrefChange.bind(this);
}

SearchProvider.prototype = {

  // This is used to handle search suggestions.  It maps xul:browsers to objects
  // { controller, previousFormHistoryResult }.
  _suggestionMap: new WeakMap(),
  QueryInterface: XPCOMUtils.generateQI([
    Ci.nsIObserver,
    Ci.nsISupportsWeakReference
  ]),

  /**
   * Event listener for the HIDDEN_ENGINES_PREF pref change
   */
  _onPrefChange(e) {
    this.emit(SEARCH_ENGINE_TOPIC, "hiddenOneOffs");
  },

  /**
   *  Observe current engine changes to notify all other newtab pages.
   */
  observe(subject, topic, data) {
    if (topic !== SEARCH_ENGINE_TOPIC) {
      return;
    }
    switch (data) {
      case "engine-current":
      case "engine-changed":
      case "engine-added":
      case "engine-removed":
        this.emit(SEARCH_ENGINE_TOPIC, data);
    }
  },

  /**
   *  Initialize the Search Provider.
   */
  init() {
    this._target.on(HIDDEN_ENGINES_PREF, this._onPrefChange);
    Services.obs.addObserver(this, SEARCH_ENGINE_TOPIC, true);
  },

  /**
   *  Unintialize the Search Provider.
   */
  uninit() {
    this._target.removeListener(HIDDEN_ENGINES_PREF, this._onPrefChange);
    Services.obs.removeObserver(this, SEARCH_ENGINE_TOPIC, true);
  },

  /**
   *  Gets the current engine - a combination of the engine name and the icon URI.
   */
  get currentEngine() {
    const engine = Services.search.currentEngine;
    const favicon = engine.getIconURLBySize(ENGINE_ICON_SIZE, ENGINE_ICON_SIZE);
    let obj = {
      name: engine.name,
      iconBuffer: favicon
    };
    return obj;
  },

  /**
   *  Removes an entry from the form history.
   */
  removeFormHistoryEntry(browser, entry) {
    let {previousFormHistoryResult} = this._suggestionMap.get(browser);
    if (!previousFormHistoryResult) {
      return false;
    }
    for (let i = 0; i < previousFormHistoryResult.matchCount; i++) {
      if (previousFormHistoryResult.getValueAt(i) === entry) {
        previousFormHistoryResult.removeValueAt(i, true);
        return true;
      }
    }
    return false;
  },

  /**
   *  Opens about:preferences#search in order to manage search settings.
   */
  manageEngines(browser) {
    const browserWindow = browser.ownerDocument.defaultView;
    browserWindow.openPreferences("paneSearch");
  },

  /**
   *  Change the current search engine and capture the new state.
   */
  cycleCurrentEngine(engineName) {
    Services.search.currentEngine = Services.search.getEngineByName(engineName);
    const newEngine = this.currentEngine;
    this.emit("CURRENT_ENGINE", newEngine);
  },

  /**
   *  Gets the state - a combination of the current engine and all the visible engines.
   */
  get currentState() {
    let state = {
      engines: [],
      currentEngine: this.currentEngine
    };
    const pref = Services.prefs.getCharPref(HIDDEN_ENGINES_PREF);
    const hiddenEngines = pref ? pref.split(",") : [];
    let result = Services.search.getVisibleEngines().filter(engine => !hiddenEngines.includes(engine.name));
    for (let engine of result) {
      let favicon = engine.getIconURLBySize(ENGINE_ICON_SIZE, ENGINE_ICON_SIZE);
      state.engines.push({
        name: engine.name,
        iconBuffer: favicon
      });
    }
    return state;
  },

  /**
   *  Gets the suggestion based on the search string and the current engine.
   */
  asyncGetSuggestions: Task.async(function*(browser, data) {
    const engine = Services.search.getEngineByName(data.engineName);
    if (!engine) {
      throw new Error(`Unknown engine name: ${data.engineName}`);
    }
    let {controller} = this._getSuggestionData(browser);
    let ok = SearchSuggestionController.engineOffersSuggestions(engine);
    controller.maxLocalResults = ok ? MAX_LOCAL_SUGGESTIONS : MAX_SUGGESTIONS;
    controller.maxRemoteResults = ok ? MAX_SUGGESTIONS : 0;
    let isPrivate = PrivateBrowsingUtils.isBrowserPrivate(browser);

    let suggestions;
    try {
      // If fetch() rejects due to it's asynchronous behaviour, the suggestions
      // are null and is then handled.
      suggestions = yield controller.fetch(data.searchString, isPrivate, engine);
    } catch (e) {
      Cu.reportError(e);
    }

    let result = null;
    if (suggestions) {
      this._suggestionMap.get(browser).previousFormHistoryResult = suggestions.formHistoryResult;
      result = {
        engineName: data.engineName,
        searchString: suggestions.term,
        formHistory: suggestions.local,
        suggestions: suggestions.remote
      };
    }
    return result;
  }),

  /**
   *  Performs a search in the browser.
   */
  asyncPerformSearch: Task.async(function*(browser, data) {
    const engine = Services.search.getEngineByName(data.engineName);
    const submission = engine.getSubmission(data.searchString, "", data.searchPurpose);

    // The browser may have been closed between the time its content sent the
    // message and the time we handle it. In that case, trying to call any
    // method on it will throw.
    const browserWindow = browser.ownerDocument.defaultView;
    const whereToOpen = browserWindow.whereToOpenLink(data.originalEvent);

    // There is a chance that by the time we receive the search message, the user
    // has switched away from the tab that triggered the search. If, based on the
    // event, we need to load the search in the same tab that triggered it (i.e.
    // where === "current"), openUILinkIn will not work because that tab is no
    // longer the current one. For this case we manually load the URI.
    if (whereToOpen === "current") {
      browser.loadURIWithFlags(submission.uri.spec, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, submission.postData);
    } else {
      let params = {
        postData: submission.postData,
        inBackground: Services.prefs.getBoolPref("browser.tabs.loadInBackground")
      };
      browserWindow.openUILinkIn(submission.uri.spec, whereToOpen, params);
    }
    yield this._asyncAddFormHistoryEntry(browser, data.searchString);
    return browserWindow;
  }),

  /**
   *  Add an entry to the form history - after a search happens.
   */
  _asyncAddFormHistoryEntry: Task.async(function*(browser, entry = "") {
    let {controller} = this._getSuggestionData(browser);
    let isPrivate = false;
    try {
      isPrivate = PrivateBrowsingUtils.isBrowserPrivate(browser);
    } catch (e) {
      // The browser might have already been destroyed.
      return false;
    }
    if (isPrivate || entry === "") {
      return false;
    }
    let result = yield new Promise((resolve, reject) => {
      const ops = {
        op: "bump",
        fieldname: controller.formHistoryParam,
        value: entry
      };
      const callbacks = {
        handleCompletion: () => resolve(true),
        handleError: () => reject()
      };
      FormHistory.update(ops, callbacks);
    }).catch(err => Cu.reportError(err));
    return result;
  }),

  /**
   *  Gets the suggestions data for the current browser.
   */
  _getSuggestionData(browser) {
    let data = this._suggestionMap.get(browser);
    if (!data) {
      // Since one SearchSuggestionController instance is meant to be used per
      // autocomplete widget, this means that we assume each xul:browser has at
      // most one such widget.
      data = {
        controller: new SearchSuggestionController(),
        previousFormHistoryResult: undefined
      };
      this._suggestionMap.set(browser, data);
    }
    return data;
  }
};

exports.SearchProvider = SearchProvider;
exports.HIDDEN_ENGINES_PREF = HIDDEN_ENGINES_PREF;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals require, JSON */


const data = __webpack_require__(5).data;
const {IMAGE_SIZE, getSiteData} = __webpack_require__(104);

const DEFAULT_OPTIONS = {sites: null};

function TippyTopProvider(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this.init();
}

TippyTopProvider.prototype = {
  /**
   * Initialize provider.
   */
  init() {
    // If a getSiteData function is passed into the constructor (for testability), use it.
    // Else, use the one provided by tippy-top-sites.
    this._getTippyTopData = this.options.getSiteData || getSiteData;
  },

  /**
    * Process the site, adding tippy top favicon and background color if URL is known.
    */
  processSite(site) {
    let enhancedSite = Object.assign({}, site);
    let tippyTopSite = this._getTippyTopData(site.url);
    let usedTippyTopData = false;
    if ("image_url" in tippyTopSite) {
      enhancedSite.favicon_url = data.url(`content/favicons/images/${tippyTopSite.image_url}`);
      enhancedSite.favicon_height = IMAGE_SIZE;
      enhancedSite.favicon_width = IMAGE_SIZE;
      usedTippyTopData = true;
    }
    if ("background_color" in tippyTopSite) {
      enhancedSite.background_color = tippyTopSite.background_color;
      usedTippyTopData = true;
    }
    if (!enhancedSite.metadata_source && usedTippyTopData) {
      enhancedSite.metadata_source = "TippyTopProvider";
    }
    return enhancedSite;
  }
};

exports.TippyTopProvider = TippyTopProvider;


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

const {Cu} = __webpack_require__(0);

module.exports = class FeedController {
  constructor(options) {
    const feeds = options.feeds;
    const otherOptions = Object.assign({}, options);
    delete otherOptions.feeds;
    this.feeds = feeds.map(F => new F(otherOptions));

    this.reduxMiddleware = store => next => action => {
      next(action);
      this.feeds.forEach(feed => {
        try {
          feed.onAction(store.getState(), action);
        } catch (e) {
          Cu.reportError(`Error caught in .onAction for ${feed.constructor.name}: ${e}`);
        }
      });
    };
  }
  connectStore(store) {
    this.feeds.forEach(f => f.connectStore(store));
  }
};


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/* globals XPCOMUtils, windowMediator */
const {Cu} = __webpack_require__(0);

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyServiceGetter(global, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

module.exports = function getCurrentBrowser() {
  const win = windowMediator.getMostRecentWindow("navigator:browser");
  const gBrowser = win.getBrowser();
  return gBrowser.selectedBrowser;
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/* globals Task, XPCOMUtils, PreviewProvider */

const {Cu} = __webpack_require__(0);

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(global, "PreviewProvider",
                                  "resource:///modules/PreviewProvider.jsm");

/**
 * getScreenshots: Given an array of sites with a url property, returns a Promise
 *                 that resolves with new copy of the array of sites, each with a new .screenshot property
 *
 * @param  {array} sites                    An array of sites, where each site is an object with the property .url
 * @param  {func} condition (optional)      A function that takes a single param "site", which fetches a screenshot if it
 *                                          returns true, and skips it if it returns false
 * @return {Promise}                              description
 */
module.exports = Task.async(function*getScreenshots(sites, condition) {
  const result = {};

  // TODO: FIXME: Rewrite this function so that the screenshotting is done
  // in parallel. For a start, see
  // https://github.com/mozilla/activity-stream/pull/2058/commits/f974b48a1974d9fb024ccb239d59ad4fc25b5042
  for (let site of sites) {
    // Don't fetch screenshots if the site doesn't meet the conditions
    if (condition && !condition(site)) {
      continue;
    }

    try {
      const dataURI = yield PreviewProvider.getThumbnail(site.url);
      result[site.url] = dataURI;
    } catch (e) {
      Cu.reportError(e);
    }
  }
  return sites.map(site => {
    if (!result[site.url]) {
      return site;
    }
    return Object.assign({}, site, {screenshot: result[site.url]});
  });
});

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 56 */
/***/ (function(module, exports) {

const VALID_KEYS = new Set([
  "type",
  "data",
  "query",
  "meta"
]);
const VALID_KEYS_STRING = Array.from(VALID_KEYS).join(", ");

// This is an extremely bare-bones action types
// that can be used if you just want a plain action,
// but you want the validations applied to it
function BaseAction(action) {
  return action;
}

// This is based on redux compose
function compose([...funcs], context = this) {
  return function() {
    if (funcs.length === 0) {
      return arguments[0]; // eslint-disable-line prefer-rest-params
    }

    const last = funcs[funcs.length - 1];
    const rest = funcs.slice(0, -1);

    return rest.reduceRight((composed, f) => f.bind(context)(composed),
      last(...arguments)); // eslint-disable-line prefer-rest-params
  };
}

class ActionManager {
  constructor(types) {
    if (!types || typeof types.length === "undefined") {
      throw new Error("You must instantiate ActionManager with an array of action types.");
    }
    this._types = new Set(types);
    this.validators = [this.validateType, this.validateStandardForm];
    this.actions = {};
    this.defineActions({BaseAction});
  }

  type(type) {
    this.validateType({type});
    return type;
  }

  defineActions(definitions) {
    Object.keys(definitions).forEach(name => {
      const definition = definitions[name];
      const composed = (...args) =>
        compose([
          ...this.validators,
          definition
        ], this)(...args);
      composed.definition = definition;
      this.actions[name] = composed;
    });
  }

  validateStandardForm(action) {
    if (!action) {
      throw new Error("Looks like your action definition does not return an object.");
    }
    if (!action.type) {
      throw new Error("You must define a type for an action.");
    }
    Object.keys(action).forEach(key => {
      if (!VALID_KEYS.has(key)) {
        throw new Error(`${key} is not a standard action key. Should be one of ${VALID_KEYS_STRING}`);
      }
    });
    return action;
    // TODO schema validation
  }

  validateType(action = {}) {
    if (!this._types.has(action.type)) {
      throw new Error(`${action.type} is not defined in your ActionManager`);
    }
    return action;
  }
}

module.exports = ActionManager;


/***/ }),
/* 57 */
/***/ (function(module, exports) {

const DEFAULT_OPTIONS = {
  timeout: 20000,
  target: typeof window !== "undefined" ? window : {}
};

class Channel {
  constructor(options = {}) {
    if (!options.incoming) {
      throw new Error("You must specify an incoming event name with the 'incoming' option.");
    }
    if (!options.outgoing) {
      throw new Error("You must specify an outgoing event name with the 'outgoing' option.");
    }
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.callbacks = new Set();
    this.timeouts = new Map();

    this._onReceiveEvent = this.runCallbacks.bind(this);
    this.options.target.addEventListener(this.options.incoming, this._onReceiveEvent);
  }

  on(cb) {
    this.callbacks.add(cb);
  }

  off(cb) {
    if (cb) {
      this.callbacks.delete(cb);
    } else {
      this.callbacks.clear();
    }
  }

  runCallbacks(event) {
    const action = event.detail;
    this.callbacks.forEach(cb => cb(action));
  }

  broadcast(action) {
    const event = new CustomEvent(this.options.outgoing, {detail: JSON.stringify(action)});
    this.options.target.dispatchEvent(event);
  }

  connectStore(store) {
    this.on(action => store.dispatch(action));
  }

  get middleware() {
    return store => next => function(action) {
      const meta = action.meta || {};
      const timeouts = this.timeouts;

      // Send action to the next step in the middleware
      next(action);

      // Check if we were expecting this action from a RequestExpect.
      // If so, clear the timeout and remote it from the list
      if (timeouts.has(action.type)) {
        clearTimeout(timeouts.get(action.type));
        timeouts.delete(action.type);
      }

      // If this is a RequestExpect, add a timeout
      // So that we dispatch an error if the expected response
      // is never received.
      if (meta.expect) {
        const time = meta.timeout || this.options.timeout;
        const timeout = setTimeout(() => {
          const error = new Error(`Expecting ${meta.expect} but it timed out after ${time}ms`);
          error.name = "E_TIMEOUT";
          store.dispatch({type: meta.expect, error: true, data: error});
        }, time);
        timeouts.set(meta.expect, timeout);
      }

      // If the action has the right "broadcast" property on the meta property,
      // send it to the other side of the channel.
      if (meta.broadcast === this.options.outgoing) {
        this.broadcast(action);
      }
    }.bind(this);
  }
}

Channel.DEFAULT_OPTIONS = DEFAULT_OPTIONS;

module.exports = {Channel};


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

const {createStore, applyMiddleware, combineReducers} = __webpack_require__(99);
const thunk = __webpack_require__(94).default;
const reducers = __webpack_require__(70);
const {Channel} = __webpack_require__(57);
const parseUrlMiddleware = __webpack_require__(61);
const loggerMiddleware = __webpack_require__(72);
const {LOCAL_STORAGE_KEY} = __webpack_require__(3);
const {areSelectorsReady} = __webpack_require__(73);

let store;

/**
 * rehydrateFromLocalStorage - Fetches initial state from local storage
 *
 * @return {obj}  Redux initial state as a plain object
 */
function rehydrateFromLocalStorage() {
  let state = {};
  try {
    state = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || {};
  } catch (e) {
    // Nothing in local storage
  }
  return state;
}

/**
 * How frequently do we poll the store?
 *
 * @type {Number} milliseconds between polls
 */
const _rehydrationInterval = 1 * 1000; // try every second
let _rehydrationIntervalTimer = null;

/**
 * Polls the storeState for completion, and if found, dispatches MERGE_STORE.
 * Once that completes, test to see if we're ready, in which case we clear
 * the timer to stop polling
 *
 * @param  {Object} storeToRehydrate  the redux store to be rehydrated
 *                                    (defaults to store variable in this module)
 */
function _rehydrationIntervalCallback(storeToRehydrate = store) {
  if (!areSelectorsReady(storeToRehydrate.getState())) {
    storeToRehydrate.dispatch({type: "MERGE_STORE", data: rehydrateFromLocalStorage()});

    if (areSelectorsReady(storeToRehydrate.getState())) {
      clearInterval(_rehydrationIntervalTimer);
      store = null; // allow the reference to be GCed
    }
  }
}

/**
 * If we're going to need to rehydrate, start polling...
 */
function _startRehydrationPolling() {
  _rehydrationIntervalTimer = setInterval(_rehydrationIntervalCallback, _rehydrationInterval);
}

/**
 * A higher-order function which returns a reducer that, on MERGE_STORE action,
 * will return the action.data object merged into the previous state.
 *
 * For all other actions, it merely calls mainReducer.
 *
 * Because we want this to merge the entire state object, it's written as a
 * higher order function which takes the main reducer (itself often a call to
 * combineReducers) as a parameter.
 *
 * @param  {function} mainReducer reducer to call if action != "MERGE_STORE"
 * @return {function}             a reducer that, on "MERGE_STORE" action,
 *                                will return the action.data object merged
 *                                into the previous state, and the result
 *                                of calling mainReducer otherwise.
 */
function _mergeStateReducer(mainReducer) {
  return (prevState, action) => {
    if (action.type === "MERGE_STORE") {
      return Object.assign({}, prevState, action.data);
    }

    return mainReducer(prevState, action);
  };
}

/**
 * createActivityStreamStore - Creates a redux store for A.S.
 *
 * @param  {obj} options              Options for creating the store
 * @param  {type} options.incoming    Name of the incoming event for the channel
 * @param  {type} options.outgoing    Name of the outgoing event for the channel
 * @param  {type} options.logger      Use logging middleware?
 * @param  {type} options.rehydrate   Rehydrate state from locastorage on startup?
 * @return {obj}                      Redux store
 *
 * @note Because this module tracks the store for rehydration purposes,
 * it's currently only possible to have a single activity stream store per
 * content-space instance of the app.  It shouldn't be too much work to
 * refactor this to support multiple stores, however, should we ever want to do
 * that.
 */
module.exports = function createActivityStreamStore(options) {
  const {incoming, outgoing, logger, rehydrate, middleware} = options || {};

  // Add a channel if incoming and outgoing events were specified
  let channel;
  if (incoming && outgoing) {
    channel = new Channel({incoming, outgoing});
  }

  const mw = [
    thunk,
    parseUrlMiddleware
  ];

  if (channel) {
    mw.push(channel.middleware);
  }

  if (middleware) {
    mw.push(middleware);
  }

  // Logger should be last in the middleware array
  if (logger) {
    mw.push(loggerMiddleware);
  }

  let initialStore = rehydrate ? rehydrateFromLocalStorage() : {};

  store = createStore(
    _mergeStateReducer(combineReducers(reducers)),
    initialStore,
    applyMiddleware(...mw)
  );

  // we only want to rehydrate stores that are rehydratable, i.e. the content
  // stores.
  //
  if (rehydrate && !areSelectorsReady(store.getState())) {
    _startRehydrationPolling();
  }

  if (channel) {
    channel.connectStore(store);
  }

  return store;
};

module.exports.rehydrateFromLocalStorage = rehydrateFromLocalStorage;
module.exports._mergeStateReducer = _mergeStateReducer;
module.exports._startRehydrationPolling = _startRehydrationPolling;
module.exports._rehydrationIntervalCallback = _rehydrationIntervalCallback;


/***/ }),
/* 59 */
/***/ (function(module, exports) {

module.exports = function getBestImage(images) {
  // we will always either get one, and consequently best image, or no image at all
  if (!images || !images.length) {
    return null;
  }
  return images[0];
};


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

const {DEFAULT_LOCALE, RTL_LIST} = __webpack_require__(3);
const STRINGS = __webpack_require__(14);

module.exports.getDirection = function getDirection(locale) {
  return (RTL_LIST.indexOf(locale.split("-")[0]) >= 0) ? "rtl" : "ltr";
};

module.exports.getLocalizedStrings = function getLocalizedStrings(locale, allStrings = STRINGS) {
  if (locale === DEFAULT_LOCALE) {
    return allStrings[DEFAULT_LOCALE];
  }
  const strings = allStrings[locale];
  // This will include the English string for any missing ids
  return Object.assign({}, allStrings[DEFAULT_LOCALE], strings || {});
};


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

const urlParse = __webpack_require__(9);
const am = __webpack_require__(1);

module.exports = () => next => action => {
  if (!am.ACTIONS_WITH_SITES.has(action.type)) {
    return next(action);
  }

  if (action.error || !action.data || !action.data.length) {
    return next(action);
  }

  const data = action.data.map(site => {
    if (!site.url) {
      return site;
    }
    const parsedUrl = urlParse(site.url, false);
    if (!parsedUrl) {
      return null;
    }
    return Object.assign({}, site, {parsedUrl});
  }).filter(item => item);

  return next(Object.assign({}, action, {data}));
};


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const {BOOKMARK_AGE_DIVIDEND} = __webpack_require__(3);
const URL = __webpack_require__(74)("url-parse");
const getBestImage = __webpack_require__(59);

/**
 * Score function for URLs.
 * See tests and `scoreEntry` comments for more insight into how the score is computed.
 *
 * @param {Array.<URLs>} history - User history used to assign higher score to popular domains.
 * @param {Object} options - settings for the scoring function.
 */
class Baseline {
  constructor(history, options = {}) {
    this.domainCounts = history.reduce(this.countDomainOccurrences, new Map());
    this.options = options;
    // Features that are extracted from URLs and need normalization.
    // Key 0 holds the min, key 1 holds max, using arrays for brevity.
    this.normalizeFeatures = {
      description: {min: 1, max: 0},
      pathLength: {min: 1, max: 0},
      image: {min: 1, max: 0}
    };

    // These are features used for adjusting the final score.
    // Used by decay function to filter out features.
    this.adjustmentFeatures = ["bookmarkAge", "imageCount", "age", "idf"];

    if (!this.options.highlightsCoefficients) {
      throw new Error("Coefficients not specified");
    }
  }

  extractFeatures(entry) {
    const urlObj = URL(entry.url);
    const host = urlObj.host;
    // For empty profiles.
    const occurrences = this.domainCounts.get(host) || 1;
    const domainCountsSize = this.domainCounts.size || 1;
    const tf = entry.visitCount || 1;
    const idf = Math.log(1 + domainCountsSize / occurrences);

    const age = this.normalizeTimestamp(entry.lastVisitDate);
    const imageCount = entry.images ? entry.images.length : 0;
    const description = this.extractDescriptionLength(entry);
    const pathLength = urlObj.pathname.split("/").filter(e => e.length).length;
    const image = this.extractImage(entry.images);
    const queryLength = urlObj.query.length;

    // For bookmarks, compute a positive age in milliseconds; otherwise default 0
    const bookmarkAge = entry.bookmarkDateCreated ? Math.max(1, Date.now() - entry.bookmarkDateCreated) : 0;

    const features = {age, tf, idf, imageCount, bookmarkAge, description, pathLength, queryLength, image};
    this.updateFeatureMinMax(features);

    return Object.assign({}, entry, {features, host});
  }

  // Adjust all values in the range [0, 1].
  normalize(features) {
    return Object.keys(this.normalizeFeatures).reduce((acc, key) => {
      const {min, max} = this.normalizeFeatures[key];
      if (max > min) { // No division by 0.
        let delta = max - min;
        acc[key] = (features[key] - min) / delta;
      }

      return acc;
    }, Object.assign({}, features));
  }

  scoreEntry(entry) {
    entry.features = this.normalize(entry.features);

    // Initial score based on visits and number of occurrences of the domain.
    const {tf, idf} = entry.features;
    let score = this.decay(tf * idf, // Score
      // Features: Age in hours, number of visits to url, how often you go to the domain, number of images,
      //           length of path, length of description, size of biggest image.
      entry.features,
      // Features weights: Positive values decrease the score proportional to a factor of feature * weight.
      //                   Negative values increase score proportional to a factor of feature * weight.
      this.options.highlightsCoefficients);

    score = this.adjustScore(score, entry.features);

    return Object.assign({}, entry, {score});
  }

  /**
   * Extra penalty/reward we want to adjust the score by.
   *
   * @param {Number} score - initial value.
   * @param {Object} features - associated features and their values.
   */
  adjustScore(score, features) {
    let newScore = score;

    newScore /= Math.pow(1 + features.age, 2);

    if (!features.imageCount || !features.image) {
      newScore = 0;
    }

    if (!features.description || !features.pathLength) {
      newScore *= 0.2;
    }

    // Boost boomarks even if they have low score or no images giving a
    // just-bookmarked page a near-infinite boost
    if (features.bookmarkAge) {
      newScore += BOOKMARK_AGE_DIVIDEND / features.bookmarkAge;
    }

    return newScore;
  }

  extractDescriptionLength(entry) {
    if (!entry.description ||
        entry.title === entry.description ||
        entry.url === entry.description) {
      return 0;
    }

    return entry.description.length;
  }

  /**
   * Update min and max values of the features that require normalization.
   *
   * @param {Object} newFeatures - features and associated values.
   */
  updateFeatureMinMax(newFeatures) {
    Object.keys(this.normalizeFeatures).forEach(key => {
      this.normalizeFeatures[key].min = this.selectMinValue(this.normalizeFeatures[key].min, newFeatures[key]);
      this.normalizeFeatures[key].max = this.selectMaxValue(this.normalizeFeatures[key].max, newFeatures[key]);
    });
  }

  /**
   * Guard against undefined values that cause Math.{min, max} to return NaN.
   */
  selectMaxValue(oldv, newv) {
    const value = Math.max(oldv, newv);
    if (Number.isNaN(value)) {
      return oldv;
    }

    return value;
  }

  selectMinValue(oldv, newv) {
    const value = Math.min(oldv, newv);
    if (Number.isNaN(value)) {
      return oldv;
    }

    return value;
  }

  updateOptions(options) {
    this.options = options;
  }

  /**
   * Scoring function for an array of URLs.
   *
   * @param {Array.<URLs>} entries
   * @returns {Array.<URLs>} sorted and with the associated score value.
   */
  score(entries) {
    let results = entries.map(entry => this.extractFeatures(entry))
                    .map(entry => this.scoreEntry(entry))
                    .sort(this.sortDescByScore)
                    .filter(entry => entry.score > 0);

    // Decreases score for similar consecutive items and remove duplicates
    results = this._adjustConsecutiveEntries(results);
    let dedupedEntries = this._dedupeSites(results);

    // Sort again after adjusting score.
    return dedupedEntries.sort(this.sortDescByScore);
  }

  /**
   * Reduce user history to a map of hosts and number of visits
   *
   * @param {Map.<string, number>} result - Accumulator
   * @param {Object} entry
   * @returns {Map.<string, number>}
   */
  countDomainOccurrences(result, entry) {
    let host = entry.reversedHost
                    .split("")
                    .reverse()
                    .join("")
                    .slice(1); // moc.buhtig. => github.com
    result.set(host, entry.visitCount);

    return result;
  }

  /**
   * Return the size of the image.
   * Assumes `getBestImage` returns the best image it has.
   * @param {Array} images
   * @returns {Number}
   */
  extractImage(images) {
    const image = getBestImage(images);

    // Sanity check: validate that an image exists and we have dimensions before trying to compute size.
    if (!image || !image.width || !image.height) {
      return 0;
    }

    return Math.min(image.width * image.height, 1e5);
  }

  /**
   * @param {Number} value
   * @returns {Number}
   */
  normalizeTimestamp(value) {
    if (!value) {
      return 0;
    }

    let r = (Date.now() - value) / (1e3 * 3600 * 24);
    return parseFloat(r.toFixed(4));
  }

  /**
   * @param {Number} value - initial score based on frequency.
   * @param {Object} features - object of features and associated values for a URL.
   * @param {Array.<Number>} coef - weights
   * @returns {Number}
   */
  decay(value, features, coef) {
    // Get all available features, filter out the ones we don't use in
    // computing initial score.
    const featNames = Object.keys(features)
                        .filter(f => this.adjustmentFeatures.indexOf(f) === -1)
                        .sort();

    if (featNames.length !== coef.length) {
      throw new Error("Different number of features and weights");
    }

    // Multiply feature value by weight and sum up all results.
    let exp = featNames.reduce((acc, name, i) => acc + features[name] * coef[i], 0);

    // Throw error instead of trying to fallback because results will be wrong.
    if (Number.isNaN(exp)) {
      throw new Error("Could not compute feature score");
    }

    return value * Math.pow(Math.E, -exp);
  }

  sortDescByScore(a, b) {
    return b.score - a.score;
  }

  /**
   * Determine if two entries are similar. Used to lower the score for similar consecutive items.
   *
   * @param {Object} prev
   * @param {Object} curr
   * @returns {boolean}
   * @private
   */
  _similarItems(prev, curr) {
    const imgPrev = getBestImage(prev.images);
    const imgCurr = getBestImage(curr.images);
    const hasImage = imgPrev && imgCurr;
    return prev.host === curr.host || (hasImage && imgPrev.url === imgCurr.url);
  }

  /**
   *  Decrease the score for consecutive items which are similar (see `_similarItems`).
   *  Combined with sorting by score the result is we don't see similar consecutive
   *  items.
   *
   *  @param {Array} entries - scored and sorted highlight items.
   */
  _adjustConsecutiveEntries(entries) {
    let penalty = 0.8;

    if (entries.length < 2) {
      return entries;
    }

    entries.reduce((prev, curr) => {
      if (this._similarItems(prev, curr)) {
        curr.score *= penalty;
        penalty -= 0.2;
      } else {
        penalty = 0.8;
      }

      return curr;
    });

    return entries;
  }

  _dedupeSites(entries) {
    let dedupedEntries = new Map();
    entries.forEach(item => {
      let key = this._createDedupeKey(item);
      if (!dedupedEntries.get(key)) {
        dedupedEntries.set(key, [item]);
      }
    });

    let results = [];
    dedupedEntries.forEach(item => results.push(item[0]));
    return results;
  }

  _createDedupeKey(entry) {
    return entry.host;
  }
}

exports.Baseline = Baseline;


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const {Baseline} = __webpack_require__(62);

class Recommender {
  constructor(history, options = {}) {
    // XXX Based on currently running experiments this could include
    // a mechanism of choosing different recommendation systems.
    this.recommender = new Baseline(history, options);
  }

  scoreEntries(entries) {
    return this.recommender.score(entries);
  }

  updateOptions(options) {
    this.recommender.updateOptions(options);
  }
}

exports.Recommender = Recommender;


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

const definitions = __webpack_require__(15);
const defaultState = {values: {}, error: false, init: false};

// Start with control values
Object.keys(definitions).forEach(key => {
  if (definitions[key].active === false) {
    return;
  }
  defaultState.values[key] = definitions[key].control.value;
});

module.exports = function Experiments(prevState = defaultState, action) {
  if (action.type !== "EXPERIMENTS_RESPONSE") {
    return prevState;
  } else if (action.error) {
    return {
      error: action.data,
      values: prevState.values
    };
  }
  return {
    init: true,
    error: false,
    values: action.data
  };
};


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

const am = __webpack_require__(1);

// Track changes to the filtering of activity stream view.
const INITIAL_STATE = {
  // The query to filter content
  query: ""
};

module.exports = function Filter(prevState = INITIAL_STATE, action) {
  const state = Object.assign({}, prevState);
  switch (action.type) {
    case am.type("NOTIFY_FILTER_QUERY"):
      state.query = action.data || "";
      return state;
    default:
      return prevState;
  }
};


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

const {DEFAULT_LOCALE} = __webpack_require__(3);
const INITIAL_STATE = {locale: DEFAULT_LOCALE, strings: {}, direction: "ltr"};
const {getDirection, getLocalizedStrings} = __webpack_require__(60);

function Intl(prevState = INITIAL_STATE, action) {
  switch (action.type) {
    case "LOCALE_UPDATED":
      if (!action.data) {
        return prevState;
      }
      return {
        locale: action.data,
        strings: getLocalizedStrings(action.data),
        direction: getDirection(action.data)
      };
    default:
      return prevState;
  }
}

Intl.INITIAL_STATE = INITIAL_STATE;

module.exports = Intl;


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

const am = __webpack_require__(1);

const initialState = {
  historySize: null,
  bookmarksSize: null
};

module.exports = (prevState = initialState, action) => {
  switch (action.type) {
    case am.type("PLACES_STATS_UPDATED"):
      return Object.assign({}, prevState, action.data);
    default:
      return prevState;
  }
};


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

const am = __webpack_require__(1);

// Prefs
// This reducer keeps track of prefs from the addon,
// and creates an object with the following state:
const INITIAL_STATE = {
  // This is set to true when our request returns an error or times out
  error: false,

  // This is an object where each key/value pair is a pref in the addon.
  prefs: {}
};

module.exports = function Prefs(prevState = INITIAL_STATE, action) {
  const state = Object.assign({}, prevState);
  switch (action.type) {
    case am.type("PREFS_RESPONSE"):
      if (action.error) {
        state.error = action.data;
      } else {
        state.prefs = action.data;
        state.error = false;
      }
      return state;
    case am.type("PREF_CHANGED_RESPONSE"):
      state.prefs[action.data.name] = action.data.value;
      return state;
    default:
      return prevState;
  }
};
module.exports.INITIAL_STATE = INITIAL_STATE;


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

const am = __webpack_require__(1);

const DEFAULTS = {
  rows: [],
  error: false,
  init: false,
  isLoading: false,
  canLoadMore: true
};

module.exports = function setRowsOrError(requestType, responseType, querySize) {
  return (prevState = DEFAULTS, action) => {
    const state = {};
    const meta = action.meta || {};
    switch (action.type) {
      case am.type(requestType):
        state.isLoading = true;
        break;
      case am.type(responseType):
        state.isLoading = false;
        if (action.error) {
          state.rows = meta.append ? prevState.rows : [];
          state.error = action.data;
        } else {
          state.init = true;
          state.rows = meta.append ? prevState.rows.concat(action.data) : action.data;
          state.error = false;
          // If there is no data, we definitely can't load more.
          if (!action.data || !action.data.length) {
            state.canLoadMore = false;
          }
          // If the results returned are less than the query size,
          // we should be on our last page of results.
          else if (querySize && action.data.length < querySize) {
            state.canLoadMore = false;
          }
        }
        break;
      case am.type("RECEIVE_BOOKMARK_ADDED"):
        state.rows = prevState.rows.map(site => {
          if (site.url === action.data.url) {
            const {bookmarkGuid, bookmarkTitle, lastModified} = action.data;
            const frecency = typeof action.data.frecency !== "undefined" ? action.data.frecency : site.frecency;
            return Object.assign({}, site, {bookmarkGuid, bookmarkTitle, frecency, bookmarkDateCreated: lastModified});
          }
          return site;
        });
        break;
      case am.type("RECEIVE_BOOKMARK_REMOVED"):
        state.rows = prevState.rows.map(site => {
          if (site.url === action.data.url) {
            const frecency = typeof action.data.frecency !== "undefined" ? action.data.frecency : site.frecency;
            const newSite = Object.assign({}, site, {frecency});
            delete newSite.bookmarkGuid;
            delete newSite.bookmarkTitle;
            delete newSite.bookmarkDateCreated;
            return newSite;
          }
          return site;
        });
        break;
      case am.type("NOTIFY_BLOCK_URL"):
      case am.type("NOTIFY_HISTORY_DELETE"):
        state.rows = prevState.rows.filter(val => val.url !== action.data);
        break;
      case requestType === "RECENT_LINKS_REQUEST" && am.type("NOTIFY_FILTER_QUERY"):
        // Allow loading more even if we hit the end as the filter has changed
        state.canLoadMore = true;
        break;
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
};
module.exports.DEFAULTS = DEFAULTS;


/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* global require, module */

const setRowsOrError = __webpack_require__(69);
const setSearchContent = __webpack_require__(71);
const Experiments = __webpack_require__(64);
const Filter = __webpack_require__(65);
const Prefs = __webpack_require__(68);
const PlacesStats = __webpack_require__(67);
const Intl = __webpack_require__(66);

module.exports = {
  TopSites: setRowsOrError("TOP_FRECENT_SITES_REQUEST", "TOP_FRECENT_SITES_RESPONSE"),
  Highlights: setRowsOrError("HIGHLIGHTS_REQUEST", "HIGHLIGHTS_RESPONSE"),
  Search: setSearchContent("SEARCH_STATE_UPDATED", "SEARCH_SUGGESTIONS_RESPONSE", "SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE"),
  Experiments,
  Filter,
  Prefs,
  PlacesStats,
  Intl
};


/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const am = __webpack_require__(1);

const initialState = {
  isLoading: false,
  error: false,
  searchString: "",
  suggestions: [],
  formHistory: [],
  currentEngine: {
    name: "",
    icon: ""
  },
  engines: [],
  searchPlaceholder: "",
  searchSettings: "",
  searchHeader: "",
  searchForSomethingWith: ""
};

module.exports = function Search(type) {
  return (prevState = initialState, action) => {
    const state = {};
    if (action.error) {
      state.error = action.data;
      return Object.assign({}, prevState, state);
    }
    switch (action.type) {
      case am.type("SEARCH_STATE_UPDATED"):
        state.currentEngine = JSON.parse(action.data.currentEngine);
        state.engines = action.data.engines.map(engine => ({
          name: engine.name,
          icon: engine.iconBuffer
        }));
        break;
      case am.type("NOTIFY_UPDATE_SEARCH_STRING"):
        state.searchString = action.data.searchString;
        break;
      case am.type("SEARCH_SUGGESTIONS_RESPONSE"):
        state.formHistory = action.data.formHistory || [];
        state.suggestions = action.data.suggestions || [];
        break;
      case am.type("SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE"):
        state.currentEngine = action.data.currentEngine;
        break;
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
};


/***/ }),
/* 72 */
/***/ (function(module, exports) {

module.exports = store => next => action => {
  console.log("ACTION", action); // eslint-disable-line no-console
  next(action);
};


/***/ }),
/* 73 */
/***/ (function(module, exports) {

/**
 * Returns whether or not the selectors have finished initializing.
 *
 * @param  {Object} state  The state object
 * @return {Boolean}
 */
function areSelectorsReady(state) {
  return state.TopSites.init && state.Highlights.init && state.Experiments.init;
}
module.exports = {areSelectorsReady};


/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

var require;let platform_require = require;

module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 45);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var required = __webpack_require__(37)
  , lolcation = __webpack_require__(42)
  , qs = __webpack_require__(33)
  , protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\S\s]*)/i;

/**
 * These are the parse rules for the URL parser, it informs the parser
 * about:
 *
 * 0. The char it Needs to parse, if it's a string it should be done using
 *    indexOf, RegExp using exec and NaN means set as current value.
 * 1. The property we should set when parsing this value.
 * 2. Indication if it's backwards or forward parsing, when set as number it's
 *    the value of extra chars that should be split off.
 * 3. Inherit from location if non existing in the parser.
 * 4. `toLowerCase` the resulting value.
 */
var rules = [
  ['#', 'hash'],                        // Extract from the back.
  ['?', 'query'],                       // Extract from the back.
  ['/', 'pathname'],                    // Extract from the back.
  ['@', 'auth', 1],                     // Extract from the front.
  [NaN, 'host', undefined, 1, 1],       // Set left over value.
  [/:(\d+)$/, 'port', undefined, 1],    // RegExp the back.
  [NaN, 'hostname', undefined, 1, 1]    // Set left over.
];

/**
 * @typedef ProtocolExtract
 * @type Object
 * @property {String} protocol Protocol matched in the URL, in lowercase.
 * @property {Boolean} slashes `true` if protocol is followed by "//", else `false`.
 * @property {String} rest Rest of the URL that is not part of the protocol.
 */

/**
 * Extract protocol information from a URL with/without double slash ("//").
 *
 * @param {String} address URL we want to extract from.
 * @return {ProtocolExtract} Extracted information.
 * @api private
 */
function extractProtocol(address) {
  var match = protocolre.exec(address);

  return {
    protocol: match[1] ? match[1].toLowerCase() : '',
    slashes: !!match[2],
    rest: match[3]
  };
}

/**
 * Resolve a relative URL pathname against a base URL pathname.
 *
 * @param {String} relative Pathname of the relative URL.
 * @param {String} base Pathname of the base URL.
 * @return {String} Resolved pathname.
 * @api private
 */
function resolve(relative, base) {
  var path = (base || '/').split('/').slice(0, -1).concat(relative.split('/'))
    , i = path.length
    , last = path[i - 1]
    , unshift = false
    , up = 0;

  while (i--) {
    if (path[i] === '.') {
      path.splice(i, 1);
    } else if (path[i] === '..') {
      path.splice(i, 1);
      up++;
    } else if (up) {
      if (i === 0) unshift = true;
      path.splice(i, 1);
      up--;
    }
  }

  if (unshift) path.unshift('');
  if (last === '.' || last === '..') path.push('');

  return path.join('/');
}

/**
 * The actual URL instance. Instead of returning an object we've opted-in to
 * create an actual constructor as it's much more memory efficient and
 * faster and it pleases my OCD.
 *
 * @constructor
 * @param {String} address URL we want to parse.
 * @param {Object|String} location Location defaults for relative paths.
 * @param {Boolean|Function} parser Parser for the query string.
 * @api public
 */
function URL(address, location, parser) {
  if (!(this instanceof URL)) {
    return new URL(address, location, parser);
  }

  var relative, extracted, parse, instruction, index, key
    , instructions = rules.slice()
    , type = typeof location
    , url = this
    , i = 0;

  //
  // The following if statements allows this module two have compatibility with
  // 2 different API:
  //
  // 1. Node.js's `url.parse` api which accepts a URL, boolean as arguments
  //    where the boolean indicates that the query string should also be parsed.
  //
  // 2. The `URL` interface of the browser which accepts a URL, object as
  //    arguments. The supplied object will be used as default values / fall-back
  //    for relative paths.
  //
  if ('object' !== type && 'string' !== type) {
    parser = location;
    location = null;
  }

  if (parser && 'function' !== typeof parser) parser = qs.parse;

  location = lolcation(location);

  //
  // Extract protocol information before running the instructions.
  //
  extracted = extractProtocol(address || '');
  relative = !extracted.protocol && !extracted.slashes;
  url.slashes = extracted.slashes || relative && location.slashes;
  url.protocol = extracted.protocol || location.protocol || '';
  address = extracted.rest;

  //
  // When the authority component is absent the URL starts with a path
  // component.
  //
  if (!extracted.slashes) instructions[2] = [/(.*)/, 'pathname'];

  for (; i < instructions.length; i++) {
    instruction = instructions[i];
    parse = instruction[0];
    key = instruction[1];

    if (parse !== parse) {
      url[key] = address;
    } else if ('string' === typeof parse) {
      if (~(index = address.indexOf(parse))) {
        if ('number' === typeof instruction[2]) {
          url[key] = address.slice(0, index);
          address = address.slice(index + instruction[2]);
        } else {
          url[key] = address.slice(index);
          address = address.slice(0, index);
        }
      }
    } else if (index = parse.exec(address)) {
      url[key] = index[1];
      address = address.slice(0, index.index);
    }

    url[key] = url[key] || (
      relative && instruction[3] ? location[key] || '' : ''
    );

    //
    // Hostname, host and protocol should be lowercased so they can be used to
    // create a proper `origin`.
    //
    if (instruction[4]) url[key] = url[key].toLowerCase();
  }

  //
  // Also parse the supplied query string in to an object. If we're supplied
  // with a custom parser as function use that instead of the default build-in
  // parser.
  //
  if (parser) url.query = parser(url.query);

  //
  // If the URL is relative, resolve the pathname against the base URL.
  //
  if (
      relative
    && location.slashes
    && url.pathname.charAt(0) !== '/'
    && (url.pathname !== '' || location.pathname !== '')
  ) {
    url.pathname = resolve(url.pathname, location.pathname);
  }

  //
  // We should not add port numbers if they are already the default port number
  // for a given protocol. As the host also contains the port number we're going
  // override it with the hostname which contains no port number.
  //
  if (!required(url.port, url.protocol)) {
    url.host = url.hostname;
    url.port = '';
  }

  //
  // Parse down the `auth` for the username and password.
  //
  url.username = url.password = '';
  if (url.auth) {
    instruction = url.auth.split(':');
    url.username = instruction[0] || '';
    url.password = instruction[1] || '';
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  //
  // The href is just the compiled result.
  //
  url.href = url.toString();
}

/**
 * This is convenience method for changing properties in the URL instance to
 * insure that they all propagate correctly.
 *
 * @param {String} part          Property we need to adjust.
 * @param {Mixed} value          The newly assigned value.
 * @param {Boolean|Function} fn  When setting the query, it will be the function
 *                               used to parse the query.
 *                               When setting the protocol, double slash will be
 *                               removed from the final url if it is true.
 * @returns {URL}
 * @api public
 */
URL.prototype.set = function set(part, value, fn) {
  var url = this;

  switch (part) {
    case 'query':
      if ('string' === typeof value && value.length) {
        value = (fn || qs.parse)(value);
      }

      url[part] = value;
      break;

    case 'port':
      url[part] = value;

      if (!required(value, url.protocol)) {
        url.host = url.hostname;
        url[part] = '';
      } else if (value) {
        url.host = url.hostname +':'+ value;
      }

      break;

    case 'hostname':
      url[part] = value;

      if (url.port) value += ':'+ url.port;
      url.host = value;
      break;

    case 'host':
      url[part] = value;

      if (/:\d+$/.test(value)) {
        value = value.split(':');
        url.port = value.pop();
        url.hostname = value.join(':');
      } else {
        url.hostname = value;
        url.port = '';
      }

      break;

    case 'protocol':
      url.protocol = value.toLowerCase();
      url.slashes = !fn;
      break;

    case 'pathname':
      url.pathname = value.length && value.charAt(0) !== '/' ? '/' + value : value;

      break;

    default:
      url[part] = value;
  }

  for (var i = 0; i < rules.length; i++) {
    var ins = rules[i];

    if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
  }

  url.origin = url.protocol && url.host && url.protocol !== 'file:'
    ? url.protocol +'//'+ url.host
    : 'null';

  url.href = url.toString();

  return url;
};

/**
 * Transform the properties back in to a valid and full URL string.
 *
 * @param {Function} stringify Optional query stringify function.
 * @returns {String}
 * @api public
 */
URL.prototype.toString = function toString(stringify) {
  if (!stringify || 'function' !== typeof stringify) stringify = qs.stringify;

  var query
    , url = this
    , protocol = url.protocol;

  if (protocol && protocol.charAt(protocol.length - 1) !== ':') protocol += ':';

  var result = protocol + (url.slashes ? '//' : '');

  if (url.username) {
    result += url.username;
    if (url.password) result += ':'+ url.password;
    result += '@';
  }

  result += url.host + url.pathname;

  query = 'object' === typeof url.query ? stringify(url.query) : url.query;
  if (query) result += '?' !== query.charAt(0) ? '?'+ query : query;

  if (url.hash) result += url.hash;

  return result;
};

//
// Expose the URL parser and some additional properties that might be useful for
// others or testing.
//
URL.extractProtocol = extractProtocol;
URL.location = lolcation;
URL.qs = qs;

module.exports = URL;


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__root_js__ = __webpack_require__(26);


/** Built-in value references. */
var Symbol = __WEBPACK_IMPORTED_MODULE_0__root_js__["a" /* default */].Symbol;

/* harmony default export */ __webpack_exports__["a"] = Symbol;


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getPrototype_js__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__ = __webpack_require__(27);




/** `Object#toString` result references. */
var objectTag = '[object Object]';

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject(value) {
  if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__isObjectLike_js__["a" /* default */])(value) || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__baseGetTag_js__["a" /* default */])(value) != objectTag) {
    return false;
  }
  var proto = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__getPrototype_js__["a" /* default */])(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor &&
    funcToString.call(Ctor) == objectCtorString;
}

/* harmony default export */ __webpack_exports__["a"] = isPlainObject;


/***/ }),
/* 4 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = compose;
/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  var last = funcs[funcs.length - 1];
  var rest = funcs.slice(0, -1);
  return function () {
    return rest.reduceRight(function (composed, f) {
      return f(composed);
    }, last.apply(undefined, arguments));
  };
}

/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_lodash_es_isPlainObject__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_symbol_observable__ = __webpack_require__(38);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_symbol_observable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_symbol_observable__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return ActionTypes; });
/* harmony export (immutable) */ __webpack_exports__["a"] = createStore;



/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var ActionTypes = {
  INIT: '@@redux/INIT'
};

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} enhancer The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */
function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.');
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    var isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action) {
    if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_lodash_es_isPlainObject__["a" /* default */])(action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i]();
    }

    return action;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }

    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/zenparsing/es-observable
   */
  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object') {
          throw new TypeError('Expected the observer to be an object.');
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return { unsubscribe: unsubscribe };
      }
    }, _ref[__WEBPACK_IMPORTED_MODULE_1_symbol_observable___default.a] = function () {
      return this;
    }, _ref;
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT });

  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[__WEBPACK_IMPORTED_MODULE_1_symbol_observable___default.a] = observable, _ref2;
}

/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = warning;
/**
 * Prints a warning in the console if it exists.
 *
 * @param {String} message The warning message.
 * @returns {void}
 */
function warning(message) {
  /* eslint-disable no-console */
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  /* eslint-enable no-console */
  try {
    // This error was thrown as a convenience so that if you enable
    // "break on all exceptions" in your console,
    // it would pause the execution at this line.
    throw new Error(message);
    /* eslint-disable no-empty */
  } catch (e) {}
  /* eslint-enable no-empty */
}

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

(function webpackUniversalModuleDefinition(root, factory) {
	if(true)
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["wu"] = factory();
	else
		root["wu"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _toConsumableArray = __webpack_require__(1)["default"];

	var _slicedToArray = __webpack_require__(39)["default"];

	var _Symbol$iterator = __webpack_require__(52)["default"];

	var _getIterator = __webpack_require__(40)["default"];

	var _regeneratorRuntime = __webpack_require__(54)["default"];

	var _Object$keys = __webpack_require__(80)["default"];

	var _Set = __webpack_require__(84)["default"];

	var _Promise = __webpack_require__(65)["default"];

	var wu = module.exports = function wu(iterable) {
	  if (!isIterable(iterable)) {
	    throw new Error("wu: `" + iterable + "` is not iterable!");
	  }
	  return new Wu(iterable);
	};

	function Wu(iterable) {
	  var iterator = getIterator(iterable);
	  this.next = iterator.next.bind(iterator);
	}
	wu.prototype = Wu.prototype;

	wu.prototype[_Symbol$iterator] = function () {
	  return this;
	};

	/*
	 * Internal utilities
	 */

	// An internal placeholder value.
	var MISSING = {};

	// Return whether a thing is iterable.
	var isIterable = function isIterable(thing) {
	  return thing && typeof thing[_Symbol$iterator] === "function";
	};

	// Get the iterator for the thing or throw an error.
	var getIterator = function getIterator(thing) {
	  if (isIterable(thing)) {
	    return _getIterator(thing);
	  }
	  throw new TypeError("Not iterable: " + thing);
	};

	// Define a static method on `wu` and set its prototype to the shared
	// `Wu.prototype`.
	var staticMethod = function staticMethod(name, fn) {
	  fn.prototype = Wu.prototype;
	  wu[name] = fn;
	};

	// Define a function that is attached as both a `Wu.prototype` method and a
	// curryable static method on `wu` directly that takes an iterable as its last
	// parameter.
	var prototypeAndStatic = function prototypeAndStatic(name, fn) {
	  var expectedArgs = arguments.length <= 2 || arguments[2] === undefined ? fn.length : arguments[2];
	  return (function () {
	    fn.prototype = Wu.prototype;
	    Wu.prototype[name] = fn;

	    // +1 for the iterable, which is the `this` value of the function so it
	    // isn't reflected by the length property.
	    expectedArgs += 1;

	    wu[name] = wu.curryable(function () {
	      var _wu;

	      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
	      }

	      var iterable = args.pop();
	      return (_wu = wu(iterable))[name].apply(_wu, args);
	    }, expectedArgs);
	  })();
	};

	// A decorator for rewrapping a method's returned iterable in wu to maintain
	// chainability.
	var rewrap = function rewrap(fn) {
	  return function () {
	    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	      args[_key2] = arguments[_key2];
	    }

	    return wu(fn.call.apply(fn, [this].concat(args)));
	  };
	};

	var rewrapStaticMethod = function rewrapStaticMethod(name, fn) {
	  return staticMethod(name, rewrap(fn));
	};
	var rewrapPrototypeAndStatic = function rewrapPrototypeAndStatic(name, fn, expectedArgs) {
	  return prototypeAndStatic(name, rewrap(fn), expectedArgs);
	};

	// Return a wrapped version of `fn` bound with the initial arguments
	// `...args`.
	function curry(fn, args) {
	  return function () {
	    for (var _len3 = arguments.length, moreArgs = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	      moreArgs[_key3] = arguments[_key3];
	    }

	    return fn.call.apply(fn, [this].concat(_toConsumableArray(args), moreArgs));
	  };
	}

	/*
	 * Public utilities
	 */

	staticMethod("curryable", function (fn) {
	  var expected = arguments.length <= 1 || arguments[1] === undefined ? fn.length : arguments[1];
	  return (function () {
	    return function f() {
	      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	        args[_key4] = arguments[_key4];
	      }

	      return args.length >= expected ? fn.apply(this, args) : curry(f, args);
	    };
	  })();
	});

	rewrapStaticMethod("entries", _regeneratorRuntime.mark(function callee$0$0(obj) {
	  var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, k;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion = true;
	        _didIteratorError = false;
	        _iteratorError = undefined;
	        context$1$0.prev = 3;
	        _iterator = _getIterator(_Object$keys(obj));

	      case 5:
	        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        k = _step.value;
	        context$1$0.next = 9;
	        return [k, obj[k]];

	      case 9:
	        _iteratorNormalCompletion = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError = true;
	        _iteratorError = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion && _iterator["return"]) {
	          _iterator["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapStaticMethod("keys", _regeneratorRuntime.mark(function callee$0$0(obj) {
	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_Object$keys(obj), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapStaticMethod("values", _regeneratorRuntime.mark(function callee$0$0(obj) {
	  var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, k;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion2 = true;
	        _didIteratorError2 = false;
	        _iteratorError2 = undefined;
	        context$1$0.prev = 3;
	        _iterator2 = _getIterator(_Object$keys(obj));

	      case 5:
	        if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        k = _step2.value;
	        context$1$0.next = 9;
	        return obj[k];

	      case 9:
	        _iteratorNormalCompletion2 = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError2 = true;
	        _iteratorError2 = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
	          _iterator2["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError2) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError2;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	/*
	 * Infinite iterators
	 */

	rewrapPrototypeAndStatic("cycle", _regeneratorRuntime.mark(function callee$0$0() {
	  var saved, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        saved = [];
	        _iteratorNormalCompletion3 = true;
	        _didIteratorError3 = false;
	        _iteratorError3 = undefined;
	        context$1$0.prev = 4;
	        _iterator3 = _getIterator(this);

	      case 6:
	        if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
	          context$1$0.next = 14;
	          break;
	        }

	        x = _step3.value;
	        context$1$0.next = 10;
	        return x;

	      case 10:
	        saved.push(x);

	      case 11:
	        _iteratorNormalCompletion3 = true;
	        context$1$0.next = 6;
	        break;

	      case 14:
	        context$1$0.next = 20;
	        break;

	      case 16:
	        context$1$0.prev = 16;
	        context$1$0.t0 = context$1$0["catch"](4);
	        _didIteratorError3 = true;
	        _iteratorError3 = context$1$0.t0;

	      case 20:
	        context$1$0.prev = 20;
	        context$1$0.prev = 21;

	        if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
	          _iterator3["return"]();
	        }

	      case 23:
	        context$1$0.prev = 23;

	        if (!_didIteratorError3) {
	          context$1$0.next = 26;
	          break;
	        }

	        throw _iteratorError3;

	      case 26:
	        return context$1$0.finish(23);

	      case 27:
	        return context$1$0.finish(20);

	      case 28:
	        if (!saved) {
	          context$1$0.next = 32;
	          break;
	        }

	        return context$1$0.delegateYield(saved, "t1", 30);

	      case 30:
	        context$1$0.next = 28;
	        break;

	      case 32:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[4, 16, 20, 28], [21,, 23, 27]]);
	}));

	rewrapStaticMethod("count", _regeneratorRuntime.mark(function callee$0$0() {
	  var start = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
	  var step = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
	  var n;
	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        n = start;

	      case 1:
	        if (false) {
	          context$1$0.next = 7;
	          break;
	        }

	        context$1$0.next = 4;
	        return n;

	      case 4:
	        n += step;
	        context$1$0.next = 1;
	        break;

	      case 7:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapStaticMethod("repeat", _regeneratorRuntime.mark(function callee$0$0(thing) {
	  var times = arguments.length <= 1 || arguments[1] === undefined ? Infinity : arguments[1];
	  var i;
	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        if (!(times === Infinity)) {
	          context$1$0.next = 8;
	          break;
	        }

	      case 1:
	        if (false) {
	          context$1$0.next = 6;
	          break;
	        }

	        context$1$0.next = 4;
	        return thing;

	      case 4:
	        context$1$0.next = 1;
	        break;

	      case 6:
	        context$1$0.next = 15;
	        break;

	      case 8:
	        i = 0;

	      case 9:
	        if (!(i < times)) {
	          context$1$0.next = 15;
	          break;
	        }

	        context$1$0.next = 12;
	        return thing;

	      case 12:
	        i++;
	        context$1$0.next = 9;
	        break;

	      case 15:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	/*
	 * Iterators that terminate once the input sequence has been exhausted
	 */

	rewrapStaticMethod("chain", _regeneratorRuntime.mark(function callee$0$0() {
	  var _iteratorNormalCompletion4,
	      _didIteratorError4,
	      _iteratorError4,
	      _len5,
	      iterables,
	      _key5,
	      _iterator4,
	      _step4,
	      it,
	      args$1$0 = arguments;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion4 = true;
	        _didIteratorError4 = false;
	        _iteratorError4 = undefined;
	        context$1$0.prev = 3;

	        for (_len5 = args$1$0.length, iterables = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
	          iterables[_key5] = args$1$0[_key5];
	        }

	        _iterator4 = _getIterator(iterables);

	      case 6:
	        if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        it = _step4.value;
	        return context$1$0.delegateYield(it, "t0", 9);

	      case 9:
	        _iteratorNormalCompletion4 = true;
	        context$1$0.next = 6;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t1 = context$1$0["catch"](3);
	        _didIteratorError4 = true;
	        _iteratorError4 = context$1$0.t1;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion4 && _iterator4["return"]) {
	          _iterator4["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError4) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError4;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapPrototypeAndStatic("chunk", _regeneratorRuntime.mark(function callee$0$0() {
	  var n = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];

	  var items, index, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, item;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        items = [];
	        index = 0;
	        _iteratorNormalCompletion5 = true;
	        _didIteratorError5 = false;
	        _iteratorError5 = undefined;
	        context$1$0.prev = 5;
	        _iterator5 = _getIterator(this);

	      case 7:
	        if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
	          context$1$0.next = 18;
	          break;
	        }

	        item = _step5.value;

	        items[index++] = item;

	        if (!(index === n)) {
	          context$1$0.next = 15;
	          break;
	        }

	        context$1$0.next = 13;
	        return items;

	      case 13:
	        items = [];
	        index = 0;

	      case 15:
	        _iteratorNormalCompletion5 = true;
	        context$1$0.next = 7;
	        break;

	      case 18:
	        context$1$0.next = 24;
	        break;

	      case 20:
	        context$1$0.prev = 20;
	        context$1$0.t0 = context$1$0["catch"](5);
	        _didIteratorError5 = true;
	        _iteratorError5 = context$1$0.t0;

	      case 24:
	        context$1$0.prev = 24;
	        context$1$0.prev = 25;

	        if (!_iteratorNormalCompletion5 && _iterator5["return"]) {
	          _iterator5["return"]();
	        }

	      case 27:
	        context$1$0.prev = 27;

	        if (!_didIteratorError5) {
	          context$1$0.next = 30;
	          break;
	        }

	        throw _iteratorError5;

	      case 30:
	        return context$1$0.finish(27);

	      case 31:
	        return context$1$0.finish(24);

	      case 32:
	        if (!index) {
	          context$1$0.next = 35;
	          break;
	        }

	        context$1$0.next = 35;
	        return items;

	      case 35:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[5, 20, 24, 32], [25,, 27, 31]]);
	}), 1);

	rewrapPrototypeAndStatic("concatMap", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  var _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion6 = true;
	        _didIteratorError6 = false;
	        _iteratorError6 = undefined;
	        context$1$0.prev = 3;
	        _iterator6 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
	          context$1$0.next = 11;
	          break;
	        }

	        x = _step6.value;
	        return context$1$0.delegateYield(fn(x), "t0", 8);

	      case 8:
	        _iteratorNormalCompletion6 = true;
	        context$1$0.next = 5;
	        break;

	      case 11:
	        context$1$0.next = 17;
	        break;

	      case 13:
	        context$1$0.prev = 13;
	        context$1$0.t1 = context$1$0["catch"](3);
	        _didIteratorError6 = true;
	        _iteratorError6 = context$1$0.t1;

	      case 17:
	        context$1$0.prev = 17;
	        context$1$0.prev = 18;

	        if (!_iteratorNormalCompletion6 && _iterator6["return"]) {
	          _iterator6["return"]();
	        }

	      case 20:
	        context$1$0.prev = 20;

	        if (!_didIteratorError6) {
	          context$1$0.next = 23;
	          break;
	        }

	        throw _iteratorError6;

	      case 23:
	        return context$1$0.finish(20);

	      case 24:
	        return context$1$0.finish(17);

	      case 25:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 13, 17, 25], [18,, 20, 24]]);
	}));

	rewrapPrototypeAndStatic("drop", _regeneratorRuntime.mark(function callee$0$0(n) {
	  var i, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        i = 0;
	        _iteratorNormalCompletion7 = true;
	        _didIteratorError7 = false;
	        _iteratorError7 = undefined;
	        context$1$0.prev = 4;
	        _iterator7 = _getIterator(this);

	      case 6:
	        if (_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done) {
	          context$1$0.next = 16;
	          break;
	        }

	        x = _step7.value;

	        if (!(i++ < n)) {
	          context$1$0.next = 10;
	          break;
	        }

	        return context$1$0.abrupt("continue", 13);

	      case 10:
	        context$1$0.next = 12;
	        return x;

	      case 12:
	        return context$1$0.abrupt("break", 16);

	      case 13:
	        _iteratorNormalCompletion7 = true;
	        context$1$0.next = 6;
	        break;

	      case 16:
	        context$1$0.next = 22;
	        break;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.t0 = context$1$0["catch"](4);
	        _didIteratorError7 = true;
	        _iteratorError7 = context$1$0.t0;

	      case 22:
	        context$1$0.prev = 22;
	        context$1$0.prev = 23;

	        if (!_iteratorNormalCompletion7 && _iterator7["return"]) {
	          _iterator7["return"]();
	        }

	      case 25:
	        context$1$0.prev = 25;

	        if (!_didIteratorError7) {
	          context$1$0.next = 28;
	          break;
	        }

	        throw _iteratorError7;

	      case 28:
	        return context$1$0.finish(25);

	      case 29:
	        return context$1$0.finish(22);

	      case 30:
	        return context$1$0.delegateYield(this, "t1", 31);

	      case 31:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[4, 18, 22, 30], [23,, 25, 29]]);
	}));

	rewrapPrototypeAndStatic("dropWhile", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];

	  var _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion8 = true;
	        _didIteratorError8 = false;
	        _iteratorError8 = undefined;
	        context$1$0.prev = 3;
	        _iterator8 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done) {
	          context$1$0.next = 15;
	          break;
	        }

	        x = _step8.value;

	        if (!fn(x)) {
	          context$1$0.next = 9;
	          break;
	        }

	        return context$1$0.abrupt("continue", 12);

	      case 9:
	        context$1$0.next = 11;
	        return x;

	      case 11:
	        return context$1$0.abrupt("break", 15);

	      case 12:
	        _iteratorNormalCompletion8 = true;
	        context$1$0.next = 5;
	        break;

	      case 15:
	        context$1$0.next = 21;
	        break;

	      case 17:
	        context$1$0.prev = 17;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError8 = true;
	        _iteratorError8 = context$1$0.t0;

	      case 21:
	        context$1$0.prev = 21;
	        context$1$0.prev = 22;

	        if (!_iteratorNormalCompletion8 && _iterator8["return"]) {
	          _iterator8["return"]();
	        }

	      case 24:
	        context$1$0.prev = 24;

	        if (!_didIteratorError8) {
	          context$1$0.next = 27;
	          break;
	        }

	        throw _iteratorError8;

	      case 27:
	        return context$1$0.finish(24);

	      case 28:
	        return context$1$0.finish(21);

	      case 29:
	        return context$1$0.delegateYield(this, "t1", 30);

	      case 30:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 17, 21, 29], [22,, 24, 28]]);
	}), 1);

	rewrapPrototypeAndStatic("enumerate", _regeneratorRuntime.mark(function callee$0$0() {
	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_zip([this, wu.count()]), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapPrototypeAndStatic("filter", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];

	  var _iteratorNormalCompletion9, _didIteratorError9, _iteratorError9, _iterator9, _step9, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion9 = true;
	        _didIteratorError9 = false;
	        _iteratorError9 = undefined;
	        context$1$0.prev = 3;
	        _iterator9 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done) {
	          context$1$0.next = 13;
	          break;
	        }

	        x = _step9.value;

	        if (!fn(x)) {
	          context$1$0.next = 10;
	          break;
	        }

	        context$1$0.next = 10;
	        return x;

	      case 10:
	        _iteratorNormalCompletion9 = true;
	        context$1$0.next = 5;
	        break;

	      case 13:
	        context$1$0.next = 19;
	        break;

	      case 15:
	        context$1$0.prev = 15;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError9 = true;
	        _iteratorError9 = context$1$0.t0;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.prev = 20;

	        if (!_iteratorNormalCompletion9 && _iterator9["return"]) {
	          _iterator9["return"]();
	        }

	      case 22:
	        context$1$0.prev = 22;

	        if (!_didIteratorError9) {
	          context$1$0.next = 25;
	          break;
	        }

	        throw _iteratorError9;

	      case 25:
	        return context$1$0.finish(22);

	      case 26:
	        return context$1$0.finish(19);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
	}), 1);

	rewrapPrototypeAndStatic("flatten", _regeneratorRuntime.mark(function callee$0$0() {
	  var shallow = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

	  var _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion10 = true;
	        _didIteratorError10 = false;
	        _iteratorError10 = undefined;
	        context$1$0.prev = 3;
	        _iterator10 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done) {
	          context$1$0.next = 16;
	          break;
	        }

	        x = _step10.value;

	        if (!(typeof x !== "string" && isIterable(x))) {
	          context$1$0.next = 11;
	          break;
	        }

	        return context$1$0.delegateYield(shallow ? x : wu(x).flatten(), "t0", 9);

	      case 9:
	        context$1$0.next = 13;
	        break;

	      case 11:
	        context$1$0.next = 13;
	        return x;

	      case 13:
	        _iteratorNormalCompletion10 = true;
	        context$1$0.next = 5;
	        break;

	      case 16:
	        context$1$0.next = 22;
	        break;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.t1 = context$1$0["catch"](3);
	        _didIteratorError10 = true;
	        _iteratorError10 = context$1$0.t1;

	      case 22:
	        context$1$0.prev = 22;
	        context$1$0.prev = 23;

	        if (!_iteratorNormalCompletion10 && _iterator10["return"]) {
	          _iterator10["return"]();
	        }

	      case 25:
	        context$1$0.prev = 25;

	        if (!_didIteratorError10) {
	          context$1$0.next = 28;
	          break;
	        }

	        throw _iteratorError10;

	      case 28:
	        return context$1$0.finish(25);

	      case 29:
	        return context$1$0.finish(22);

	      case 30:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 18, 22, 30], [23,, 25, 29]]);
	}), 1);

	rewrapPrototypeAndStatic("invoke", _regeneratorRuntime.mark(function callee$0$0(name) {
	  var _iteratorNormalCompletion11,
	      _didIteratorError11,
	      _iteratorError11,
	      _len6,
	      args,
	      _key6,
	      _iterator11,
	      _step11,
	      x,
	      args$1$0 = arguments;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion11 = true;
	        _didIteratorError11 = false;
	        _iteratorError11 = undefined;
	        context$1$0.prev = 3;

	        for (_len6 = args$1$0.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
	          args[_key6 - 1] = args$1$0[_key6];
	        }

	        _iterator11 = _getIterator(this);

	      case 6:
	        if (_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done) {
	          context$1$0.next = 13;
	          break;
	        }

	        x = _step11.value;
	        context$1$0.next = 10;
	        return x[name].apply(x, args);

	      case 10:
	        _iteratorNormalCompletion11 = true;
	        context$1$0.next = 6;
	        break;

	      case 13:
	        context$1$0.next = 19;
	        break;

	      case 15:
	        context$1$0.prev = 15;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError11 = true;
	        _iteratorError11 = context$1$0.t0;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.prev = 20;

	        if (!_iteratorNormalCompletion11 && _iterator11["return"]) {
	          _iterator11["return"]();
	        }

	      case 22:
	        context$1$0.prev = 22;

	        if (!_didIteratorError11) {
	          context$1$0.next = 25;
	          break;
	        }

	        throw _iteratorError11;

	      case 25:
	        return context$1$0.finish(22);

	      case 26:
	        return context$1$0.finish(19);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
	}));

	rewrapPrototypeAndStatic("map", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  var _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion12 = true;
	        _didIteratorError12 = false;
	        _iteratorError12 = undefined;
	        context$1$0.prev = 3;
	        _iterator12 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        x = _step12.value;
	        context$1$0.next = 9;
	        return fn(x);

	      case 9:
	        _iteratorNormalCompletion12 = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError12 = true;
	        _iteratorError12 = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion12 && _iterator12["return"]) {
	          _iterator12["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError12) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError12;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapPrototypeAndStatic("pluck", _regeneratorRuntime.mark(function callee$0$0(name) {
	  var _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion13 = true;
	        _didIteratorError13 = false;
	        _iteratorError13 = undefined;
	        context$1$0.prev = 3;
	        _iterator13 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        x = _step13.value;
	        context$1$0.next = 9;
	        return x[name];

	      case 9:
	        _iteratorNormalCompletion13 = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError13 = true;
	        _iteratorError13 = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion13 && _iterator13["return"]) {
	          _iterator13["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError13) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError13;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapPrototypeAndStatic("reductions", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  var initial = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

	  var val, _iteratorNormalCompletion14, _didIteratorError14, _iteratorError14, _iterator14, _step14, x, _iteratorNormalCompletion15, _didIteratorError15, _iteratorError15, _iterator15, _step15;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        val = initial;

	        if (!(val === undefined)) {
	          context$1$0.next = 28;
	          break;
	        }

	        _iteratorNormalCompletion14 = true;
	        _didIteratorError14 = false;
	        _iteratorError14 = undefined;
	        context$1$0.prev = 5;
	        _iterator14 = _getIterator(this);

	      case 7:
	        if (_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done) {
	          context$1$0.next = 14;
	          break;
	        }

	        x = _step14.value;

	        val = x;
	        return context$1$0.abrupt("break", 14);

	      case 11:
	        _iteratorNormalCompletion14 = true;
	        context$1$0.next = 7;
	        break;

	      case 14:
	        context$1$0.next = 20;
	        break;

	      case 16:
	        context$1$0.prev = 16;
	        context$1$0.t0 = context$1$0["catch"](5);
	        _didIteratorError14 = true;
	        _iteratorError14 = context$1$0.t0;

	      case 20:
	        context$1$0.prev = 20;
	        context$1$0.prev = 21;

	        if (!_iteratorNormalCompletion14 && _iterator14["return"]) {
	          _iterator14["return"]();
	        }

	      case 23:
	        context$1$0.prev = 23;

	        if (!_didIteratorError14) {
	          context$1$0.next = 26;
	          break;
	        }

	        throw _iteratorError14;

	      case 26:
	        return context$1$0.finish(23);

	      case 27:
	        return context$1$0.finish(20);

	      case 28:
	        context$1$0.next = 30;
	        return val;

	      case 30:
	        _iteratorNormalCompletion15 = true;
	        _didIteratorError15 = false;
	        _iteratorError15 = undefined;
	        context$1$0.prev = 33;
	        _iterator15 = _getIterator(this);

	      case 35:
	        if (_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done) {
	          context$1$0.next = 42;
	          break;
	        }

	        x = _step15.value;
	        context$1$0.next = 39;
	        return val = fn(val, x);

	      case 39:
	        _iteratorNormalCompletion15 = true;
	        context$1$0.next = 35;
	        break;

	      case 42:
	        context$1$0.next = 48;
	        break;

	      case 44:
	        context$1$0.prev = 44;
	        context$1$0.t1 = context$1$0["catch"](33);
	        _didIteratorError15 = true;
	        _iteratorError15 = context$1$0.t1;

	      case 48:
	        context$1$0.prev = 48;
	        context$1$0.prev = 49;

	        if (!_iteratorNormalCompletion15 && _iterator15["return"]) {
	          _iterator15["return"]();
	        }

	      case 51:
	        context$1$0.prev = 51;

	        if (!_didIteratorError15) {
	          context$1$0.next = 54;
	          break;
	        }

	        throw _iteratorError15;

	      case 54:
	        return context$1$0.finish(51);

	      case 55:
	        return context$1$0.finish(48);

	      case 56:
	        return context$1$0.abrupt("return", val);

	      case 57:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[5, 16, 20, 28], [21,, 23, 27], [33, 44, 48, 56], [49,, 51, 55]]);
	}), 2);

	rewrapPrototypeAndStatic("reject", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];

	  var _iteratorNormalCompletion16, _didIteratorError16, _iteratorError16, _iterator16, _step16, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion16 = true;
	        _didIteratorError16 = false;
	        _iteratorError16 = undefined;
	        context$1$0.prev = 3;
	        _iterator16 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done) {
	          context$1$0.next = 13;
	          break;
	        }

	        x = _step16.value;

	        if (fn(x)) {
	          context$1$0.next = 10;
	          break;
	        }

	        context$1$0.next = 10;
	        return x;

	      case 10:
	        _iteratorNormalCompletion16 = true;
	        context$1$0.next = 5;
	        break;

	      case 13:
	        context$1$0.next = 19;
	        break;

	      case 15:
	        context$1$0.prev = 15;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError16 = true;
	        _iteratorError16 = context$1$0.t0;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.prev = 20;

	        if (!_iteratorNormalCompletion16 && _iterator16["return"]) {
	          _iterator16["return"]();
	        }

	      case 22:
	        context$1$0.prev = 22;

	        if (!_didIteratorError16) {
	          context$1$0.next = 25;
	          break;
	        }

	        throw _iteratorError16;

	      case 25:
	        return context$1$0.finish(22);

	      case 26:
	        return context$1$0.finish(19);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
	}), 1);

	rewrapPrototypeAndStatic("slice", _regeneratorRuntime.mark(function callee$0$0() {
	  var start = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
	  var stop = arguments.length <= 1 || arguments[1] === undefined ? Infinity : arguments[1];

	  var _iteratorNormalCompletion17, _didIteratorError17, _iteratorError17, _iterator17, _step17, _step17$value, x, i;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        if (!(stop < start)) {
	          context$1$0.next = 2;
	          break;
	        }

	        throw new RangeError("parameter `stop` (= " + stop + ") must be >= `start` (= " + start + ")");

	      case 2:
	        _iteratorNormalCompletion17 = true;
	        _didIteratorError17 = false;
	        _iteratorError17 = undefined;
	        context$1$0.prev = 5;
	        _iterator17 = _getIterator(this.enumerate());

	      case 7:
	        if (_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done) {
	          context$1$0.next = 20;
	          break;
	        }

	        _step17$value = _slicedToArray(_step17.value, 2);
	        x = _step17$value[0];
	        i = _step17$value[1];

	        if (!(i < start)) {
	          context$1$0.next = 13;
	          break;
	        }

	        return context$1$0.abrupt("continue", 17);

	      case 13:
	        if (!(i >= stop)) {
	          context$1$0.next = 15;
	          break;
	        }

	        return context$1$0.abrupt("break", 20);

	      case 15:
	        context$1$0.next = 17;
	        return x;

	      case 17:
	        _iteratorNormalCompletion17 = true;
	        context$1$0.next = 7;
	        break;

	      case 20:
	        context$1$0.next = 26;
	        break;

	      case 22:
	        context$1$0.prev = 22;
	        context$1$0.t0 = context$1$0["catch"](5);
	        _didIteratorError17 = true;
	        _iteratorError17 = context$1$0.t0;

	      case 26:
	        context$1$0.prev = 26;
	        context$1$0.prev = 27;

	        if (!_iteratorNormalCompletion17 && _iterator17["return"]) {
	          _iterator17["return"]();
	        }

	      case 29:
	        context$1$0.prev = 29;

	        if (!_didIteratorError17) {
	          context$1$0.next = 32;
	          break;
	        }

	        throw _iteratorError17;

	      case 32:
	        return context$1$0.finish(29);

	      case 33:
	        return context$1$0.finish(26);

	      case 34:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[5, 22, 26, 34], [27,, 29, 33]]);
	}), 2);

	rewrapPrototypeAndStatic("spreadMap", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  var _iteratorNormalCompletion18, _didIteratorError18, _iteratorError18, _iterator18, _step18, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion18 = true;
	        _didIteratorError18 = false;
	        _iteratorError18 = undefined;
	        context$1$0.prev = 3;
	        _iterator18 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done) {
	          context$1$0.next = 12;
	          break;
	        }

	        x = _step18.value;
	        context$1$0.next = 9;
	        return fn.apply(undefined, _toConsumableArray(x));

	      case 9:
	        _iteratorNormalCompletion18 = true;
	        context$1$0.next = 5;
	        break;

	      case 12:
	        context$1$0.next = 18;
	        break;

	      case 14:
	        context$1$0.prev = 14;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError18 = true;
	        _iteratorError18 = context$1$0.t0;

	      case 18:
	        context$1$0.prev = 18;
	        context$1$0.prev = 19;

	        if (!_iteratorNormalCompletion18 && _iterator18["return"]) {
	          _iterator18["return"]();
	        }

	      case 21:
	        context$1$0.prev = 21;

	        if (!_didIteratorError18) {
	          context$1$0.next = 24;
	          break;
	        }

	        throw _iteratorError18;

	      case 24:
	        return context$1$0.finish(21);

	      case 25:
	        return context$1$0.finish(18);

	      case 26:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	}));

	rewrapPrototypeAndStatic("take", _regeneratorRuntime.mark(function callee$0$0(n) {
	  var i, _iteratorNormalCompletion19, _didIteratorError19, _iteratorError19, _iterator19, _step19, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        if (!(n < 1)) {
	          context$1$0.next = 2;
	          break;
	        }

	        return context$1$0.abrupt("return");

	      case 2:
	        i = 0;
	        _iteratorNormalCompletion19 = true;
	        _didIteratorError19 = false;
	        _iteratorError19 = undefined;
	        context$1$0.prev = 6;
	        _iterator19 = _getIterator(this);

	      case 8:
	        if (_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done) {
	          context$1$0.next = 17;
	          break;
	        }

	        x = _step19.value;
	        context$1$0.next = 12;
	        return x;

	      case 12:
	        if (!(++i >= n)) {
	          context$1$0.next = 14;
	          break;
	        }

	        return context$1$0.abrupt("break", 17);

	      case 14:
	        _iteratorNormalCompletion19 = true;
	        context$1$0.next = 8;
	        break;

	      case 17:
	        context$1$0.next = 23;
	        break;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.t0 = context$1$0["catch"](6);
	        _didIteratorError19 = true;
	        _iteratorError19 = context$1$0.t0;

	      case 23:
	        context$1$0.prev = 23;
	        context$1$0.prev = 24;

	        if (!_iteratorNormalCompletion19 && _iterator19["return"]) {
	          _iterator19["return"]();
	        }

	      case 26:
	        context$1$0.prev = 26;

	        if (!_didIteratorError19) {
	          context$1$0.next = 29;
	          break;
	        }

	        throw _iteratorError19;

	      case 29:
	        return context$1$0.finish(26);

	      case 30:
	        return context$1$0.finish(23);

	      case 31:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[6, 19, 23, 31], [24,, 26, 30]]);
	}));

	rewrapPrototypeAndStatic("takeWhile", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];

	  var _iteratorNormalCompletion20, _didIteratorError20, _iteratorError20, _iterator20, _step20, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion20 = true;
	        _didIteratorError20 = false;
	        _iteratorError20 = undefined;
	        context$1$0.prev = 3;
	        _iterator20 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done) {
	          context$1$0.next = 14;
	          break;
	        }

	        x = _step20.value;

	        if (fn(x)) {
	          context$1$0.next = 9;
	          break;
	        }

	        return context$1$0.abrupt("break", 14);

	      case 9:
	        context$1$0.next = 11;
	        return x;

	      case 11:
	        _iteratorNormalCompletion20 = true;
	        context$1$0.next = 5;
	        break;

	      case 14:
	        context$1$0.next = 20;
	        break;

	      case 16:
	        context$1$0.prev = 16;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError20 = true;
	        _iteratorError20 = context$1$0.t0;

	      case 20:
	        context$1$0.prev = 20;
	        context$1$0.prev = 21;

	        if (!_iteratorNormalCompletion20 && _iterator20["return"]) {
	          _iterator20["return"]();
	        }

	      case 23:
	        context$1$0.prev = 23;

	        if (!_didIteratorError20) {
	          context$1$0.next = 26;
	          break;
	        }

	        throw _iteratorError20;

	      case 26:
	        return context$1$0.finish(23);

	      case 27:
	        return context$1$0.finish(20);

	      case 28:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 16, 20, 28], [21,, 23, 27]]);
	}), 1);

	rewrapPrototypeAndStatic("tap", _regeneratorRuntime.mark(function callee$0$0() {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? console.log.bind(console) : arguments[0];

	  var _iteratorNormalCompletion21, _didIteratorError21, _iteratorError21, _iterator21, _step21, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        _iteratorNormalCompletion21 = true;
	        _didIteratorError21 = false;
	        _iteratorError21 = undefined;
	        context$1$0.prev = 3;
	        _iterator21 = _getIterator(this);

	      case 5:
	        if (_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done) {
	          context$1$0.next = 13;
	          break;
	        }

	        x = _step21.value;

	        fn(x);
	        context$1$0.next = 10;
	        return x;

	      case 10:
	        _iteratorNormalCompletion21 = true;
	        context$1$0.next = 5;
	        break;

	      case 13:
	        context$1$0.next = 19;
	        break;

	      case 15:
	        context$1$0.prev = 15;
	        context$1$0.t0 = context$1$0["catch"](3);
	        _didIteratorError21 = true;
	        _iteratorError21 = context$1$0.t0;

	      case 19:
	        context$1$0.prev = 19;
	        context$1$0.prev = 20;

	        if (!_iteratorNormalCompletion21 && _iterator21["return"]) {
	          _iterator21["return"]();
	        }

	      case 22:
	        context$1$0.prev = 22;

	        if (!_didIteratorError21) {
	          context$1$0.next = 25;
	          break;
	        }

	        throw _iteratorError21;

	      case 25:
	        return context$1$0.finish(22);

	      case 26:
	        return context$1$0.finish(19);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
	}), 1);

	rewrapPrototypeAndStatic("unique", _regeneratorRuntime.mark(function callee$0$0() {
	  var seen, _iteratorNormalCompletion22, _didIteratorError22, _iteratorError22, _iterator22, _step22, x;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        seen = new _Set();
	        _iteratorNormalCompletion22 = true;
	        _didIteratorError22 = false;
	        _iteratorError22 = undefined;
	        context$1$0.prev = 4;
	        _iterator22 = _getIterator(this);

	      case 6:
	        if (_iteratorNormalCompletion22 = (_step22 = _iterator22.next()).done) {
	          context$1$0.next = 15;
	          break;
	        }

	        x = _step22.value;

	        if (seen.has(x)) {
	          context$1$0.next = 12;
	          break;
	        }

	        context$1$0.next = 11;
	        return x;

	      case 11:
	        seen.add(x);

	      case 12:
	        _iteratorNormalCompletion22 = true;
	        context$1$0.next = 6;
	        break;

	      case 15:
	        context$1$0.next = 21;
	        break;

	      case 17:
	        context$1$0.prev = 17;
	        context$1$0.t0 = context$1$0["catch"](4);
	        _didIteratorError22 = true;
	        _iteratorError22 = context$1$0.t0;

	      case 21:
	        context$1$0.prev = 21;
	        context$1$0.prev = 22;

	        if (!_iteratorNormalCompletion22 && _iterator22["return"]) {
	          _iterator22["return"]();
	        }

	      case 24:
	        context$1$0.prev = 24;

	        if (!_didIteratorError22) {
	          context$1$0.next = 27;
	          break;
	        }

	        throw _iteratorError22;

	      case 27:
	        return context$1$0.finish(24);

	      case 28:
	        return context$1$0.finish(21);

	      case 29:
	        seen.clear();

	      case 30:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[4, 17, 21, 29], [22,, 24, 28]]);
	}));

	var _zip = rewrap(_regeneratorRuntime.mark(function callee$0$0(iterables) {
	  var longest = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

	  var iters, numIters, numFinished, finished, zipped, _iteratorNormalCompletion23, _didIteratorError23, _iteratorError23, _iterator23, _step23, it, _it$next, value, done;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        if (iterables.length) {
	          context$1$0.next = 2;
	          break;
	        }

	        return context$1$0.abrupt("return");

	      case 2:
	        iters = iterables.map(getIterator);
	        numIters = iterables.length;
	        numFinished = 0;
	        finished = false;

	      case 6:
	        if (finished) {
	          context$1$0.next = 44;
	          break;
	        }

	        zipped = [];
	        _iteratorNormalCompletion23 = true;
	        _didIteratorError23 = false;
	        _iteratorError23 = undefined;
	        context$1$0.prev = 11;
	        _iterator23 = _getIterator(iters);

	      case 13:
	        if (_iteratorNormalCompletion23 = (_step23 = _iterator23.next()).done) {
	          context$1$0.next = 26;
	          break;
	        }

	        it = _step23.value;
	        _it$next = it.next();
	        value = _it$next.value;
	        done = _it$next.done;

	        if (!done) {
	          context$1$0.next = 22;
	          break;
	        }

	        if (longest) {
	          context$1$0.next = 21;
	          break;
	        }

	        return context$1$0.abrupt("return");

	      case 21:
	        if (++numFinished == numIters) {
	          finished = true;
	        }

	      case 22:
	        if (value === undefined) {
	          // Leave a hole in the array so that you can distinguish an iterable
	          // that's done (via `index in array == false`) from an iterable
	          // yielding `undefined`.
	          zipped.length++;
	        } else {
	          zipped.push(value);
	        }

	      case 23:
	        _iteratorNormalCompletion23 = true;
	        context$1$0.next = 13;
	        break;

	      case 26:
	        context$1$0.next = 32;
	        break;

	      case 28:
	        context$1$0.prev = 28;
	        context$1$0.t0 = context$1$0["catch"](11);
	        _didIteratorError23 = true;
	        _iteratorError23 = context$1$0.t0;

	      case 32:
	        context$1$0.prev = 32;
	        context$1$0.prev = 33;

	        if (!_iteratorNormalCompletion23 && _iterator23["return"]) {
	          _iterator23["return"]();
	        }

	      case 35:
	        context$1$0.prev = 35;

	        if (!_didIteratorError23) {
	          context$1$0.next = 38;
	          break;
	        }

	        throw _iteratorError23;

	      case 38:
	        return context$1$0.finish(35);

	      case 39:
	        return context$1$0.finish(32);

	      case 40:
	        context$1$0.next = 42;
	        return zipped;

	      case 42:
	        context$1$0.next = 6;
	        break;

	      case 44:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this, [[11, 28, 32, 40], [33,, 35, 39]]);
	}));

	rewrapStaticMethod("zip", _regeneratorRuntime.mark(function callee$0$0() {
	  for (var _len7 = arguments.length, iterables = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
	    iterables[_key7] = arguments[_key7];
	  }

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_zip(iterables), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapStaticMethod("zipLongest", _regeneratorRuntime.mark(function callee$0$0() {
	  for (var _len8 = arguments.length, iterables = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
	    iterables[_key8] = arguments[_key8];
	  }

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_zip(iterables, true), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	rewrapStaticMethod("zipWith", _regeneratorRuntime.mark(function callee$0$0(fn) {
	  for (var _len9 = arguments.length, iterables = Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
	    iterables[_key9 - 1] = arguments[_key9];
	  }

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        return context$1$0.delegateYield(_zip(iterables).spreadMap(fn), "t0", 1);

	      case 1:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));

	/*
	 * Functions that force iteration to completion and return a value.
	 */

	// The maximum number of milliseconds we will block the main thread at a time
	// while in `asyncEach`.
	wu.MAX_BLOCK = 15;
	// The number of milliseconds to yield to the main thread between bursts of
	// work.
	wu.TIMEOUT = 1;

	prototypeAndStatic("asyncEach", function (fn) {
	  var maxBlock = arguments.length <= 1 || arguments[1] === undefined ? wu.MAX_BLOCK : arguments[1];
	  var timeout = arguments.length <= 2 || arguments[2] === undefined ? wu.TIMEOUT : arguments[2];

	  var iter = getIterator(this);

	  return new _Promise(function (resolve, reject) {
	    (function loop() {
	      var start = Date.now();

	      var _iteratorNormalCompletion24 = true;
	      var _didIteratorError24 = false;
	      var _iteratorError24 = undefined;

	      try {
	        for (var _iterator24 = _getIterator(iter), _step24; !(_iteratorNormalCompletion24 = (_step24 = _iterator24.next()).done); _iteratorNormalCompletion24 = true) {
	          var x = _step24.value;

	          try {
	            fn(x);
	          } catch (e) {
	            reject(e);
	            return;
	          }

	          if (Date.now() - start > maxBlock) {
	            setTimeout(loop, timeout);
	            return;
	          }
	        }
	      } catch (err) {
	        _didIteratorError24 = true;
	        _iteratorError24 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion24 && _iterator24["return"]) {
	            _iterator24["return"]();
	          }
	        } finally {
	          if (_didIteratorError24) {
	            throw _iteratorError24;
	          }
	        }
	      }

	      resolve();
	    })();
	  });
	}, 3);

	prototypeAndStatic("every", function () {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
	  var _iteratorNormalCompletion25 = true;
	  var _didIteratorError25 = false;
	  var _iteratorError25 = undefined;

	  try {
	    for (var _iterator25 = _getIterator(this), _step25; !(_iteratorNormalCompletion25 = (_step25 = _iterator25.next()).done); _iteratorNormalCompletion25 = true) {
	      var x = _step25.value;

	      if (!fn(x)) {
	        return false;
	      }
	    }
	  } catch (err) {
	    _didIteratorError25 = true;
	    _iteratorError25 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion25 && _iterator25["return"]) {
	        _iterator25["return"]();
	      }
	    } finally {
	      if (_didIteratorError25) {
	        throw _iteratorError25;
	      }
	    }
	  }

	  return true;
	}, 1);

	prototypeAndStatic("find", function (fn) {
	  var _iteratorNormalCompletion26 = true;
	  var _didIteratorError26 = false;
	  var _iteratorError26 = undefined;

	  try {
	    for (var _iterator26 = _getIterator(this), _step26; !(_iteratorNormalCompletion26 = (_step26 = _iterator26.next()).done); _iteratorNormalCompletion26 = true) {
	      var x = _step26.value;

	      if (fn(x)) {
	        return x;
	      }
	    }
	  } catch (err) {
	    _didIteratorError26 = true;
	    _iteratorError26 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion26 && _iterator26["return"]) {
	        _iterator26["return"]();
	      }
	    } finally {
	      if (_didIteratorError26) {
	        throw _iteratorError26;
	      }
	    }
	  }
	});

	prototypeAndStatic("forEach", function (fn) {
	  var _iteratorNormalCompletion27 = true;
	  var _didIteratorError27 = false;
	  var _iteratorError27 = undefined;

	  try {
	    for (var _iterator27 = _getIterator(this), _step27; !(_iteratorNormalCompletion27 = (_step27 = _iterator27.next()).done); _iteratorNormalCompletion27 = true) {
	      var x = _step27.value;

	      fn(x);
	    }
	  } catch (err) {
	    _didIteratorError27 = true;
	    _iteratorError27 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion27 && _iterator27["return"]) {
	        _iterator27["return"]();
	      }
	    } finally {
	      if (_didIteratorError27) {
	        throw _iteratorError27;
	      }
	    }
	  }
	});

	prototypeAndStatic("has", function (thing) {
	  return this.some(function (x) {
	    return x === thing;
	  });
	});

	prototypeAndStatic("reduce", function (fn) {
	  var initial = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

	  var val = initial;
	  if (val === undefined) {
	    var _iteratorNormalCompletion28 = true;
	    var _didIteratorError28 = false;
	    var _iteratorError28 = undefined;

	    try {
	      for (var _iterator28 = _getIterator(this), _step28; !(_iteratorNormalCompletion28 = (_step28 = _iterator28.next()).done); _iteratorNormalCompletion28 = true) {
	        var x = _step28.value;

	        val = x;
	        break;
	      }
	    } catch (err) {
	      _didIteratorError28 = true;
	      _iteratorError28 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion28 && _iterator28["return"]) {
	          _iterator28["return"]();
	        }
	      } finally {
	        if (_didIteratorError28) {
	          throw _iteratorError28;
	        }
	      }
	    }
	  }

	  var _iteratorNormalCompletion29 = true;
	  var _didIteratorError29 = false;
	  var _iteratorError29 = undefined;

	  try {
	    for (var _iterator29 = _getIterator(this), _step29; !(_iteratorNormalCompletion29 = (_step29 = _iterator29.next()).done); _iteratorNormalCompletion29 = true) {
	      var x = _step29.value;

	      val = fn(val, x);
	    }
	  } catch (err) {
	    _didIteratorError29 = true;
	    _iteratorError29 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion29 && _iterator29["return"]) {
	        _iterator29["return"]();
	      }
	    } finally {
	      if (_didIteratorError29) {
	        throw _iteratorError29;
	      }
	    }
	  }

	  return val;
	}, 2);

	prototypeAndStatic("some", function () {
	  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
	  var _iteratorNormalCompletion30 = true;
	  var _didIteratorError30 = false;
	  var _iteratorError30 = undefined;

	  try {
	    for (var _iterator30 = _getIterator(this), _step30; !(_iteratorNormalCompletion30 = (_step30 = _iterator30.next()).done); _iteratorNormalCompletion30 = true) {
	      var x = _step30.value;

	      if (fn(x)) {
	        return true;
	      }
	    }
	  } catch (err) {
	    _didIteratorError30 = true;
	    _iteratorError30 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion30 && _iterator30["return"]) {
	        _iterator30["return"]();
	      }
	    } finally {
	      if (_didIteratorError30) {
	        throw _iteratorError30;
	      }
	    }
	  }

	  return false;
	}, 1);

	prototypeAndStatic("toArray", function () {
	  return [].concat(_toConsumableArray(this));
	});

	/*
	 * Methods that return an array of iterables.
	 */

	var MAX_CACHE = 500;

	var _tee = rewrap(_regeneratorRuntime.mark(function callee$0$0(iterator, cache) {
	  var items, index, _iterator$next, done, value;

	  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
	    while (1) switch (context$1$0.prev = context$1$0.next) {
	      case 0:
	        items = cache.items;
	        index = 0;

	      case 2:
	        if (false) {
	          context$1$0.next = 25;
	          break;
	        }

	        if (!(index === items.length)) {
	          context$1$0.next = 14;
	          break;
	        }

	        _iterator$next = iterator.next();
	        done = _iterator$next.done;
	        value = _iterator$next.value;

	        if (!done) {
	          context$1$0.next = 10;
	          break;
	        }

	        if (cache.returned === MISSING) {
	          cache.returned = value;
	        }
	        return context$1$0.abrupt("break", 25);

	      case 10:
	        context$1$0.next = 12;
	        return items[index++] = value;

	      case 12:
	        context$1$0.next = 23;
	        break;

	      case 14:
	        if (!(index === cache.tail)) {
	          context$1$0.next = 21;
	          break;
	        }

	        value = items[index];

	        if (index === MAX_CACHE) {
	          items = cache.items = items.slice(index);
	          index = 0;
	          cache.tail = 0;
	        } else {
	          items[index] = undefined;
	          cache.tail = ++index;
	        }
	        context$1$0.next = 19;
	        return value;

	      case 19:
	        context$1$0.next = 23;
	        break;

	      case 21:
	        context$1$0.next = 23;
	        return items[index++];

	      case 23:
	        context$1$0.next = 2;
	        break;

	      case 25:

	        if (cache.tail === index) {
	          items.length = 0;
	        }

	        return context$1$0.abrupt("return", cache.returned);

	      case 27:
	      case "end":
	        return context$1$0.stop();
	    }
	  }, callee$0$0, this);
	}));
	_tee.prototype = Wu.prototype;

	prototypeAndStatic("tee", function () {
	  var n = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];

	  var iterables = new Array(n);
	  var cache = { tail: 0, items: [], returned: MISSING };

	  while (n--) {
	    iterables[n] = _tee(this, cache);
	  }

	  return iterables;
	}, 1);

	prototypeAndStatic("unzip", function () {
	  var n = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];

	  return this.tee(n).map(function (iter, i) {
	    return iter.pluck(i);
	  });
	}, 1);

	/*
	 * Number of chambers.
	 */

	wu.tang = { clan: 36 };

	// We don't have a cached item for this index, we need to force its
	// evaluation.

	// If we are the last iterator to use a cached value, clean up after
	// ourselves.

	// We have an item in the cache for this index, so yield it.

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _Array$from = __webpack_require__(2)["default"];

	exports["default"] = function (arr) {
	  if (Array.isArray(arr)) {
	    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

	    return arr2;
	  } else {
	    return _Array$from(arr);
	  }
	};

	exports.__esModule = true;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(3), __esModule: true };

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(4);
	__webpack_require__(26);
	module.exports = __webpack_require__(12).Array.from;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $at  = __webpack_require__(5)(true);

	// 21.1.3.27 String.prototype[@@iterator]()
	__webpack_require__(8)(String, 'String', function(iterated){
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , index = this._i
	    , point;
	  if(index >= O.length)return {value: undefined, done: true};
	  point = $at(O, index);
	  this._i += point.length;
	  return {value: point, done: false};
	});

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// true  -> String#at
	// false -> String#codePointAt
	var toInteger = __webpack_require__(6)
	  , defined   = __webpack_require__(7);
	module.exports = function(TO_STRING){
	  return function(that, pos){
	    var s = String(defined(that))
	      , i = toInteger(pos)
	      , l = s.length
	      , a, b;
	    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l
	      || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	        ? TO_STRING ? s.charAt(i) : a
	        : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

/***/ },
/* 6 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 7 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY         = __webpack_require__(9)
	  , $def            = __webpack_require__(10)
	  , $redef          = __webpack_require__(13)
	  , hide            = __webpack_require__(14)
	  , has             = __webpack_require__(19)
	  , SYMBOL_ITERATOR = __webpack_require__(20)('iterator')
	  , Iterators       = __webpack_require__(23)
	  , BUGGY           = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR     = '@@iterator'
	  , KEYS            = 'keys'
	  , VALUES          = 'values';
	var returnThis = function(){ return this; };
	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE){
	  __webpack_require__(24)(Constructor, NAME, next);
	  var createMethod = function(kind){
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG      = NAME + ' Iterator'
	    , proto    = Base.prototype
	    , _native  = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , _default = _native || createMethod(DEFAULT)
	    , methods, key;
	  // Fix native
	  if(_native){
	    var IteratorPrototype = __webpack_require__(15).getProto(_default.call(new Base));
	    // Set @@toStringTag to native iterators
	    __webpack_require__(25)(IteratorPrototype, TAG, true);
	    // FF fix
	    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, SYMBOL_ITERATOR, returnThis);
	  }
	  // Define iterator
	  if(!LIBRARY || FORCE)hide(proto, SYMBOL_ITERATOR, _default);
	  // Plug for library
	  Iterators[NAME] = _default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      keys:    IS_SET            ? _default : createMethod(KEYS),
	      values:  DEFAULT == VALUES ? _default : createMethod(VALUES),
	      entries: DEFAULT != VALUES ? _default : createMethod('entries')
	    };
	    if(FORCE)for(key in methods){
	      if(!(key in proto))$redef(proto, key, methods[key]);
	    } else $def($def.P + $def.F * BUGGY, NAME, methods);
	  }
	};

/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports = true;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(11)
	  , core      = __webpack_require__(12)
	  , PROTOTYPE = 'prototype';
	var ctx = function(fn, that){
	  return function(){
	    return fn.apply(that, arguments);
	  };
	};
	var $def = function(type, name, source){
	  var key, own, out, exp
	    , isGlobal = type & $def.G
	    , isProto  = type & $def.P
	    , target   = isGlobal ? global : type & $def.S
	        ? global[name] : (global[name] || {})[PROTOTYPE]
	    , exports  = isGlobal ? core : core[name] || (core[name] = {});
	  if(isGlobal)source = name;
	  for(key in source){
	    // contains in native
	    own = !(type & $def.F) && target && key in target;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    if(isGlobal && typeof target[key] != 'function')exp = source[key];
	    // bind timers to global for call from export context
	    else if(type & $def.B && own)exp = ctx(out, global);
	    // wrap global constructors for prevent change them in library
	    else if(type & $def.W && target[key] == out)!function(C){
	      exp = function(param){
	        return this instanceof C ? new C(param) : C(param);
	      };
	      exp[PROTOTYPE] = C[PROTOTYPE];
	    }(out);
	    else exp = isProto && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // export
	    exports[key] = exp;
	    if(isProto)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
	  }
	};
	// type bitmap
	$def.F = 1;  // forced
	$def.G = 2;  // global
	$def.S = 4;  // static
	$def.P = 8;  // proto
	$def.B = 16; // bind
	$def.W = 32; // wrap
	module.exports = $def;

/***/ },
/* 11 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var UNDEFINED = 'undefined';
	var global = module.exports = typeof window != UNDEFINED && window.Math == Math
	  ? window : typeof self != UNDEFINED && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 12 */
/***/ function(module, exports) {

	var core = module.exports = {version: '1.2.0'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(14);

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var $          = __webpack_require__(15)
	  , createDesc = __webpack_require__(16);
	module.exports = __webpack_require__(17) ? function(object, key, value){
	  return $.setDesc(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 15 */
/***/ function(module, exports) {

	var $Object = Object;
	module.exports = {
	  create:     $Object.create,
	  getProto:   $Object.getPrototypeOf,
	  isEnum:     {}.propertyIsEnumerable,
	  getDesc:    $Object.getOwnPropertyDescriptor,
	  setDesc:    $Object.defineProperty,
	  setDescs:   $Object.defineProperties,
	  getKeys:    $Object.keys,
	  getNames:   $Object.getOwnPropertyNames,
	  getSymbols: $Object.getOwnPropertySymbols,
	  each:       [].forEach
	};

/***/ },
/* 16 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(18)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 18 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 19 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var store  = __webpack_require__(21)('wks')
	  , Symbol = __webpack_require__(11).Symbol;
	module.exports = function(name){
	  return store[name] || (store[name] =
	    Symbol && Symbol[name] || (Symbol || __webpack_require__(22))('Symbol.' + name));
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(11)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 22 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 23 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $ = __webpack_require__(15)
	  , IteratorPrototype = {};

	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(14)(IteratorPrototype, __webpack_require__(20)('iterator'), function(){ return this; });

	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = $.create(IteratorPrototype, {next: __webpack_require__(16)(1,next)});
	  __webpack_require__(25)(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var has  = __webpack_require__(19)
	  , hide = __webpack_require__(14)
	  , TAG  = __webpack_require__(20)('toStringTag');

	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))hide(it, TAG, tag);
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx         = __webpack_require__(27)
	  , $def        = __webpack_require__(10)
	  , toObject    = __webpack_require__(29)
	  , call        = __webpack_require__(30)
	  , isArrayIter = __webpack_require__(33)
	  , toLength    = __webpack_require__(34)
	  , getIterFn   = __webpack_require__(35);
	$def($def.S + $def.F * !__webpack_require__(38)(function(iter){ Array.from(iter); }), 'Array', {
	  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
	  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
	    var O       = toObject(arrayLike)
	      , C       = typeof this == 'function' ? this : Array
	      , mapfn   = arguments[1]
	      , mapping = mapfn !== undefined
	      , index   = 0
	      , iterFn  = getIterFn(O)
	      , length, result, step, iterator;
	    if(mapping)mapfn = ctx(mapfn, arguments[2], 2);
	    // if object isn't iterable or it's array with default iterator - use simple case
	    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
	      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
	        result[index] = mapping ? call(iterator, mapfn, [step.value, index], true) : step.value;
	      }
	    } else {
	      length = toLength(O.length);
	      for(result = new C(length); length > index; index++){
	        result[index] = mapping ? mapfn(O[index], index) : O[index];
	      }
	    }
	    result.length = index;
	    return result;
	  }
	});


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(28);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 28 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(7);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(31);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(32);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 32 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators = __webpack_require__(23)
	  , ITERATOR  = __webpack_require__(20)('iterator');
	module.exports = function(it){
	  return (Iterators.Array || Array.prototype[ITERATOR]) === it;
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(6)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(36)
	  , ITERATOR  = __webpack_require__(20)('iterator')
	  , Iterators = __webpack_require__(23);
	module.exports = __webpack_require__(12).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
	};

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(37)
	  , TAG = __webpack_require__(20)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 37 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var SYMBOL_ITERATOR = __webpack_require__(20)('iterator')
	  , SAFE_CLOSING    = false;
	try {
	  var riter = [7][SYMBOL_ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }
	module.exports = function(exec){
	  if(!SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[SYMBOL_ITERATOR]();
	    iter.next = function(){ safe = true; };
	    arr[SYMBOL_ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _getIterator = __webpack_require__(40)["default"];

	var _isIterable = __webpack_require__(49)["default"];

	exports["default"] = (function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;

	    try {
	      for (var _i = _getIterator(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);

	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }

	    return _arr;
	  }

	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (_isIterable(Object(arr))) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	})();

	exports.__esModule = true;

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(41), __esModule: true };

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(42);
	__webpack_require__(4);
	module.exports = __webpack_require__(48);

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(43);
	var Iterators = __webpack_require__(23);
	Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var setUnscope = __webpack_require__(44)
	  , step       = __webpack_require__(45)
	  , Iterators  = __webpack_require__(23)
	  , toIObject  = __webpack_require__(46);

	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	__webpack_require__(8)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');

	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;

	setUnscope('keys');
	setUnscope('values');
	setUnscope('entries');

/***/ },
/* 44 */
/***/ function(module, exports) {

	module.exports = function(){ /* empty */ };

/***/ },
/* 45 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(47)
	  , defined = __webpack_require__(7);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	// indexed object, fallback for non-array-like ES3 strings
	var cof = __webpack_require__(37);
	module.exports = 0 in Object('z') ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(31)
	  , get      = __webpack_require__(35);
	module.exports = __webpack_require__(12).getIterator = function(it){
	  var iterFn = get(it);
	  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
	  return anObject(iterFn.call(it));
	};

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(50), __esModule: true };

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(42);
	__webpack_require__(4);
	module.exports = __webpack_require__(51);

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(36)
	  , ITERATOR  = __webpack_require__(20)('iterator')
	  , Iterators = __webpack_require__(23);
	module.exports = __webpack_require__(12).isIterable = function(it){
	  var O = Object(it);
	  return ITERATOR in O || '@@iterator' in O || Iterators.hasOwnProperty(classof(O));
	};

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(53), __esModule: true };

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(4);
	__webpack_require__(42);
	module.exports = __webpack_require__(20)('iterator');

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {// This method of obtaining a reference to the global object needs to be
	// kept identical to the way it is obtained in runtime.js
	var g =
	  typeof global === "object" ? global :
	  typeof window === "object" ? window :
	  typeof self === "object" ? self : this;

	// Use `getOwnPropertyNames` because not all browsers support calling
	// `hasOwnProperty` on the global `self` object in a worker. See #183.
	var hadRuntime = g.regeneratorRuntime &&
	  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

	// Save the old regeneratorRuntime in case it needs to be restored later.
	var oldRuntime = hadRuntime && g.regeneratorRuntime;

	// Force reevalutation of runtime.js.
	g.regeneratorRuntime = undefined;

	module.exports = __webpack_require__(55);

	if (hadRuntime) {
	  // Restore the original runtime.
	  g.regeneratorRuntime = oldRuntime;
	} else {
	  // Remove the global property added by runtime.js.
	  try {
	    delete g.regeneratorRuntime;
	  } catch(e) {
	    g.regeneratorRuntime = undefined;
	  }
	}

	module.exports = { "default": module.exports, __esModule: true };

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {/**
	 * Copyright (c) 2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
	 * additional grant of patent rights can be found in the PATENTS file in
	 * the same directory.
	 */

	"use strict";

	var _Symbol = __webpack_require__(57)["default"];

	var _Symbol$iterator = __webpack_require__(52)["default"];

	var _Object$create = __webpack_require__(63)["default"];

	var _Promise = __webpack_require__(65)["default"];

	!(function (global) {
	  "use strict";

	  var hasOwn = Object.prototype.hasOwnProperty;
	  var undefined; // More compressible than void 0.
	  var iteratorSymbol = typeof _Symbol === "function" && _Symbol$iterator || "@@iterator";

	  var inModule = typeof module === "object";
	  var runtime = global.regeneratorRuntime;
	  if (runtime) {
	    if (inModule) {
	      // If regeneratorRuntime is defined globally and we're in a module,
	      // make the exports object identical to regeneratorRuntime.
	      module.exports = runtime;
	    }
	    // Don't bother evaluating the rest of this file if the runtime was
	    // already defined globally.
	    return;
	  }

	  // Define the runtime globally (as expected by generated code) as either
	  // module.exports (if we're in a module) or a new, empty object.
	  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

	  function wrap(innerFn, outerFn, self, tryLocsList) {
	    // If outerFn provided, then outerFn.prototype instanceof Generator.
	    var generator = _Object$create((outerFn || Generator).prototype);

	    generator._invoke = makeInvokeMethod(innerFn, self || null, new Context(tryLocsList || []));

	    return generator;
	  }
	  runtime.wrap = wrap;

	  // Try/catch helper to minimize deoptimizations. Returns a completion
	  // record like context.tryEntries[i].completion. This interface could
	  // have been (and was previously) designed to take a closure to be
	  // invoked without arguments, but in all the cases we care about we
	  // already have an existing method we want to call, so there's no need
	  // to create a new function object. We can even get away with assuming
	  // the method takes exactly one argument, since that happens to be true
	  // in every case, so we don't have to touch the arguments object. The
	  // only additional allocation required is the completion record, which
	  // has a stable shape and so hopefully should be cheap to allocate.
	  function tryCatch(fn, obj, arg) {
	    try {
	      return { type: "normal", arg: fn.call(obj, arg) };
	    } catch (err) {
	      return { type: "throw", arg: err };
	    }
	  }

	  var GenStateSuspendedStart = "suspendedStart";
	  var GenStateSuspendedYield = "suspendedYield";
	  var GenStateExecuting = "executing";
	  var GenStateCompleted = "completed";

	  // Returning this object from the innerFn has the same effect as
	  // breaking out of the dispatch switch statement.
	  var ContinueSentinel = {};

	  // Dummy constructor functions that we use as the .constructor and
	  // .constructor.prototype properties for functions that return Generator
	  // objects. For full spec compliance, you may wish to configure your
	  // minifier not to mangle the names of these two functions.
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}

	  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
	  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	  GeneratorFunctionPrototype.constructor = GeneratorFunction;
	  GeneratorFunction.displayName = "GeneratorFunction";

	  // Helper for defining the .next, .throw, and .return methods of the
	  // Iterator interface in terms of a single ._invoke method.
	  function defineIteratorMethods(prototype) {
	    ["next", "throw", "return"].forEach(function (method) {
	      prototype[method] = function (arg) {
	        return this._invoke(method, arg);
	      };
	    });
	  }

	  runtime.isGeneratorFunction = function (genFun) {
	    var ctor = typeof genFun === "function" && genFun.constructor;
	    return ctor ? ctor === GeneratorFunction ||
	    // For the native GeneratorFunction constructor, the best we can
	    // do is to check its .name property.
	    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
	  };

	  runtime.mark = function (genFun) {
	    genFun.__proto__ = GeneratorFunctionPrototype;
	    genFun.prototype = _Object$create(Gp);
	    return genFun;
	  };

	  // Within the body of any async function, `await x` is transformed to
	  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	  // `value instanceof AwaitArgument` to determine if the yielded value is
	  // meant to be awaited. Some may consider the name of this method too
	  // cutesy, but they are curmudgeons.
	  runtime.awrap = function (arg) {
	    return new AwaitArgument(arg);
	  };

	  function AwaitArgument(arg) {
	    this.arg = arg;
	  }

	  function AsyncIterator(generator) {
	    // This invoke function is written in a style that assumes some
	    // calling function (or Promise) will handle exceptions.
	    function invoke(method, arg) {
	      var result = generator[method](arg);
	      var value = result.value;
	      return value instanceof AwaitArgument ? _Promise.resolve(value.arg).then(invokeNext, invokeThrow) : _Promise.resolve(value).then(function (unwrapped) {
	        // When a yielded Promise is resolved, its final value becomes
	        // the .value of the Promise<{value,done}> result for the
	        // current iteration. If the Promise is rejected, however, the
	        // result for this iteration will be rejected with the same
	        // reason. Note that rejections of yielded Promises are not
	        // thrown back into the generator function, as is the case
	        // when an awaited Promise is rejected. This difference in
	        // behavior between yield and await is important, because it
	        // allows the consumer to decide what to do with the yielded
	        // rejection (swallow it and continue, manually .throw it back
	        // into the generator, abandon iteration, whatever). With
	        // await, by contrast, there is no opportunity to examine the
	        // rejection reason outside the generator function, so the
	        // only option is to throw it from the await expression, and
	        // let the generator function handle the exception.
	        result.value = unwrapped;
	        return result;
	      });
	    }

	    if (typeof process === "object" && process.domain) {
	      invoke = process.domain.bind(invoke);
	    }

	    var invokeNext = invoke.bind(generator, "next");
	    var invokeThrow = invoke.bind(generator, "throw");
	    var invokeReturn = invoke.bind(generator, "return");
	    var previousPromise;

	    function enqueue(method, arg) {
	      var enqueueResult =
	      // If enqueue has been called before, then we want to wait until
	      // all previous Promises have been resolved before calling invoke,
	      // so that results are always delivered in the correct order. If
	      // enqueue has not been called before, then it is important to
	      // call invoke immediately, without waiting on a callback to fire,
	      // so that the async generator function has the opportunity to do
	      // any necessary setup in a predictable way. This predictability
	      // is why the Promise constructor synchronously invokes its
	      // executor callback, and why async functions synchronously
	      // execute code before the first await. Since we implement simple
	      // async functions in terms of async generators, it is especially
	      // important to get this right, even though it requires care.
	      previousPromise ? previousPromise.then(function () {
	        return invoke(method, arg);
	      }) : new _Promise(function (resolve) {
	        resolve(invoke(method, arg));
	      });

	      // Avoid propagating enqueueResult failures to Promises returned by
	      // later invocations of the iterator.
	      previousPromise = enqueueResult["catch"](function (ignored) {});

	      return enqueueResult;
	    }

	    // Define the unified helper method that is used to implement .next,
	    // .throw, and .return (see defineIteratorMethods).
	    this._invoke = enqueue;
	  }

	  defineIteratorMethods(AsyncIterator.prototype);

	  // Note that simple async functions are implemented on top of
	  // AsyncIterator objects; they just return a Promise for the value of
	  // the final result produced by the iterator.
	  runtime.async = function (innerFn, outerFn, self, tryLocsList) {
	    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));

	    return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
	    : iter.next().then(function (result) {
	      return result.done ? result.value : iter.next();
	    });
	  };

	  function makeInvokeMethod(innerFn, self, context) {
	    var state = GenStateSuspendedStart;

	    return function invoke(method, arg) {
	      if (state === GenStateExecuting) {
	        throw new Error("Generator is already running");
	      }

	      if (state === GenStateCompleted) {
	        if (method === "throw") {
	          throw arg;
	        }

	        // Be forgiving, per 25.3.3.3.3 of the spec:
	        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
	        return doneResult();
	      }

	      while (true) {
	        var delegate = context.delegate;
	        if (delegate) {
	          if (method === "return" || method === "throw" && delegate.iterator[method] === undefined) {
	            // A return or throw (when the delegate iterator has no throw
	            // method) always terminates the yield* loop.
	            context.delegate = null;

	            // If the delegate iterator has a return method, give it a
	            // chance to clean up.
	            var returnMethod = delegate.iterator["return"];
	            if (returnMethod) {
	              var record = tryCatch(returnMethod, delegate.iterator, arg);
	              if (record.type === "throw") {
	                // If the return method threw an exception, let that
	                // exception prevail over the original return or throw.
	                method = "throw";
	                arg = record.arg;
	                continue;
	              }
	            }

	            if (method === "return") {
	              // Continue with the outer return, now that the delegate
	              // iterator has been terminated.
	              continue;
	            }
	          }

	          var record = tryCatch(delegate.iterator[method], delegate.iterator, arg);

	          if (record.type === "throw") {
	            context.delegate = null;

	            // Like returning generator.throw(uncaught), but without the
	            // overhead of an extra function call.
	            method = "throw";
	            arg = record.arg;
	            continue;
	          }

	          // Delegate generator ran and handled its own exceptions so
	          // regardless of what the method was, we continue as if it is
	          // "next" with an undefined arg.
	          method = "next";
	          arg = undefined;

	          var info = record.arg;
	          if (info.done) {
	            context[delegate.resultName] = info.value;
	            context.next = delegate.nextLoc;
	          } else {
	            state = GenStateSuspendedYield;
	            return info;
	          }

	          context.delegate = null;
	        }

	        if (method === "next") {
	          if (state === GenStateSuspendedYield) {
	            context.sent = arg;
	          } else {
	            context.sent = undefined;
	          }
	        } else if (method === "throw") {
	          if (state === GenStateSuspendedStart) {
	            state = GenStateCompleted;
	            throw arg;
	          }

	          if (context.dispatchException(arg)) {
	            // If the dispatched exception was caught by a catch block,
	            // then let that catch block handle the exception normally.
	            method = "next";
	            arg = undefined;
	          }
	        } else if (method === "return") {
	          context.abrupt("return", arg);
	        }

	        state = GenStateExecuting;

	        var record = tryCatch(innerFn, self, context);
	        if (record.type === "normal") {
	          // If an exception is thrown from innerFn, we leave state ===
	          // GenStateExecuting and loop back for another invocation.
	          state = context.done ? GenStateCompleted : GenStateSuspendedYield;

	          var info = {
	            value: record.arg,
	            done: context.done
	          };

	          if (record.arg === ContinueSentinel) {
	            if (context.delegate && method === "next") {
	              // Deliberately forget the last sent value so that we don't
	              // accidentally pass it on to the delegate.
	              arg = undefined;
	            }
	          } else {
	            return info;
	          }
	        } else if (record.type === "throw") {
	          state = GenStateCompleted;
	          // Dispatch the exception by looping back around to the
	          // context.dispatchException(arg) call above.
	          method = "throw";
	          arg = record.arg;
	        }
	      }
	    };
	  }

	  // Define Generator.prototype.{next,throw,return} in terms of the
	  // unified ._invoke helper method.
	  defineIteratorMethods(Gp);

	  Gp[iteratorSymbol] = function () {
	    return this;
	  };

	  Gp.toString = function () {
	    return "[object Generator]";
	  };

	  function pushTryEntry(locs) {
	    var entry = { tryLoc: locs[0] };

	    if (1 in locs) {
	      entry.catchLoc = locs[1];
	    }

	    if (2 in locs) {
	      entry.finallyLoc = locs[2];
	      entry.afterLoc = locs[3];
	    }

	    this.tryEntries.push(entry);
	  }

	  function resetTryEntry(entry) {
	    var record = entry.completion || {};
	    record.type = "normal";
	    delete record.arg;
	    entry.completion = record;
	  }

	  function Context(tryLocsList) {
	    // The root entry object (effectively a try statement without a catch
	    // or a finally block) gives us a place to store values thrown from
	    // locations where there is no enclosing try statement.
	    this.tryEntries = [{ tryLoc: "root" }];
	    tryLocsList.forEach(pushTryEntry, this);
	    this.reset(true);
	  }

	  runtime.keys = function (object) {
	    var keys = [];
	    for (var key in object) {
	      keys.push(key);
	    }
	    keys.reverse();

	    // Rather than returning an object with a next method, we keep
	    // things simple and return the next function itself.
	    return function next() {
	      while (keys.length) {
	        var key = keys.pop();
	        if (key in object) {
	          next.value = key;
	          next.done = false;
	          return next;
	        }
	      }

	      // To avoid creating an additional object, we just hang the .value
	      // and .done properties off the next function object itself. This
	      // also ensures that the minifier will not anonymize the function.
	      next.done = true;
	      return next;
	    };
	  };

	  function values(iterable) {
	    if (iterable) {
	      var iteratorMethod = iterable[iteratorSymbol];
	      if (iteratorMethod) {
	        return iteratorMethod.call(iterable);
	      }

	      if (typeof iterable.next === "function") {
	        return iterable;
	      }

	      if (!isNaN(iterable.length)) {
	        var i = -1,
	            next = function next() {
	          while (++i < iterable.length) {
	            if (hasOwn.call(iterable, i)) {
	              next.value = iterable[i];
	              next.done = false;
	              return next;
	            }
	          }

	          next.value = undefined;
	          next.done = true;

	          return next;
	        };

	        return next.next = next;
	      }
	    }

	    // Return an iterator with no values.
	    return { next: doneResult };
	  }
	  runtime.values = values;

	  function doneResult() {
	    return { value: undefined, done: true };
	  }

	  Context.prototype = {
	    constructor: Context,

	    reset: function reset(skipTempReset) {
	      this.prev = 0;
	      this.next = 0;
	      this.sent = undefined;
	      this.done = false;
	      this.delegate = null;

	      this.tryEntries.forEach(resetTryEntry);

	      if (!skipTempReset) {
	        for (var name in this) {
	          // Not sure about the optimal order of these conditions:
	          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
	            this[name] = undefined;
	          }
	        }
	      }
	    },

	    stop: function stop() {
	      this.done = true;

	      var rootEntry = this.tryEntries[0];
	      var rootRecord = rootEntry.completion;
	      if (rootRecord.type === "throw") {
	        throw rootRecord.arg;
	      }

	      return this.rval;
	    },

	    dispatchException: function dispatchException(exception) {
	      if (this.done) {
	        throw exception;
	      }

	      var context = this;
	      function handle(loc, caught) {
	        record.type = "throw";
	        record.arg = exception;
	        context.next = loc;
	        return !!caught;
	      }

	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        var record = entry.completion;

	        if (entry.tryLoc === "root") {
	          // Exception thrown outside of any try block that could handle
	          // it, so set the completion value of the entire function to
	          // throw the exception.
	          return handle("end");
	        }

	        if (entry.tryLoc <= this.prev) {
	          var hasCatch = hasOwn.call(entry, "catchLoc");
	          var hasFinally = hasOwn.call(entry, "finallyLoc");

	          if (hasCatch && hasFinally) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            } else if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }
	          } else if (hasCatch) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            }
	          } else if (hasFinally) {
	            if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }
	          } else {
	            throw new Error("try statement without catch or finally");
	          }
	        }
	      }
	    },

	    abrupt: function abrupt(type, arg) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
	          var finallyEntry = entry;
	          break;
	        }
	      }

	      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
	        // Ignore the finally entry if control is not jumping to a
	        // location outside the try/catch block.
	        finallyEntry = null;
	      }

	      var record = finallyEntry ? finallyEntry.completion : {};
	      record.type = type;
	      record.arg = arg;

	      if (finallyEntry) {
	        this.next = finallyEntry.finallyLoc;
	      } else {
	        this.complete(record);
	      }

	      return ContinueSentinel;
	    },

	    complete: function complete(record, afterLoc) {
	      if (record.type === "throw") {
	        throw record.arg;
	      }

	      if (record.type === "break" || record.type === "continue") {
	        this.next = record.arg;
	      } else if (record.type === "return") {
	        this.rval = record.arg;
	        this.next = "end";
	      } else if (record.type === "normal" && afterLoc) {
	        this.next = afterLoc;
	      }
	    },

	    finish: function finish(finallyLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.finallyLoc === finallyLoc) {
	          this.complete(entry.completion, entry.afterLoc);
	          resetTryEntry(entry);
	          return ContinueSentinel;
	        }
	      }
	    },

	    "catch": function _catch(tryLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc === tryLoc) {
	          var record = entry.completion;
	          if (record.type === "throw") {
	            var thrown = record.arg;
	            resetTryEntry(entry);
	          }
	          return thrown;
	        }
	      }

	      // The context.catch method must only be called with a location
	      // argument that corresponds to a known catch block.
	      throw new Error("illegal catch attempt");
	    },

	    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
	      this.delegate = {
	        iterator: values(iterable),
	        resultName: resultName,
	        nextLoc: nextLoc
	      };

	      return ContinueSentinel;
	    }
	  };
	})(
	// Among the various tricks for obtaining a reference to the global
	// object, this seems to be the most reliable technique that does not
	// use indirect eval (which violates Content Security Policy).
	typeof global === "object" ? global : typeof window === "object" ? window : typeof self === "object" ? self : undefined);
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(56)))

/***/ },
/* 56 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(58), __esModule: true };

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(59);
	module.exports = __webpack_require__(12).Symbol;

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// ECMAScript 6 symbols shim
	var $              = __webpack_require__(15)
	  , global         = __webpack_require__(11)
	  , has            = __webpack_require__(19)
	  , SUPPORT_DESC   = __webpack_require__(17)
	  , $def           = __webpack_require__(10)
	  , $redef         = __webpack_require__(13)
	  , $fails         = __webpack_require__(18)
	  , shared         = __webpack_require__(21)
	  , setTag         = __webpack_require__(25)
	  , uid            = __webpack_require__(22)
	  , wks            = __webpack_require__(20)
	  , keyOf          = __webpack_require__(60)
	  , $names         = __webpack_require__(61)
	  , enumKeys       = __webpack_require__(62)
	  , isObject       = __webpack_require__(32)
	  , anObject       = __webpack_require__(31)
	  , toIObject      = __webpack_require__(46)
	  , createDesc     = __webpack_require__(16)
	  , getDesc        = $.getDesc
	  , setDesc        = $.setDesc
	  , _create        = $.create
	  , getNames       = $names.get
	  , $Symbol        = global.Symbol
	  , setter         = false
	  , HIDDEN         = wks('_hidden')
	  , isEnum         = $.isEnum
	  , SymbolRegistry = shared('symbol-registry')
	  , AllSymbols     = shared('symbols')
	  , useNative      = typeof $Symbol == 'function'
	  , ObjectProto    = Object.prototype;

	// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
	var setSymbolDesc = SUPPORT_DESC && $fails(function(){
	  return _create(setDesc({}, 'a', {
	    get: function(){ return setDesc(this, 'a', {value: 7}).a; }
	  })).a != 7;
	}) ? function(it, key, D){
	  var protoDesc = getDesc(ObjectProto, key);
	  if(protoDesc)delete ObjectProto[key];
	  setDesc(it, key, D);
	  if(protoDesc && it !== ObjectProto)setDesc(ObjectProto, key, protoDesc);
	} : setDesc;

	var wrap = function(tag){
	  var sym = AllSymbols[tag] = _create($Symbol.prototype);
	  sym._k = tag;
	  SUPPORT_DESC && setter && setSymbolDesc(ObjectProto, tag, {
	    configurable: true,
	    set: function(value){
	      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
	      setSymbolDesc(this, tag, createDesc(1, value));
	    }
	  });
	  return sym;
	};

	var $defineProperty = function defineProperty(it, key, D){
	  if(D && has(AllSymbols, key)){
	    if(!D.enumerable){
	      if(!has(it, HIDDEN))setDesc(it, HIDDEN, createDesc(1, {}));
	      it[HIDDEN][key] = true;
	    } else {
	      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
	      D = _create(D, {enumerable: createDesc(0, false)});
	    } return setSymbolDesc(it, key, D);
	  } return setDesc(it, key, D);
	};
	var $defineProperties = function defineProperties(it, P){
	  anObject(it);
	  var keys = enumKeys(P = toIObject(P))
	    , i    = 0
	    , l = keys.length
	    , key;
	  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
	  return it;
	};
	var $create = function create(it, P){
	  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
	};
	var $propertyIsEnumerable = function propertyIsEnumerable(key){
	  var E = isEnum.call(this, key);
	  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key]
	    ? E : true;
	};
	var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
	  var D = getDesc(it = toIObject(it), key);
	  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
	  return D;
	};
	var $getOwnPropertyNames = function getOwnPropertyNames(it){
	  var names  = getNames(toIObject(it))
	    , result = []
	    , i      = 0
	    , key;
	  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN)result.push(key);
	  return result;
	};
	var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
	  var names  = getNames(toIObject(it))
	    , result = []
	    , i      = 0
	    , key;
	  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
	  return result;
	};

	// 19.4.1.1 Symbol([description])
	if(!useNative){
	  $Symbol = function Symbol(){
	    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor');
	    return wrap(uid(arguments[0]));
	  };
	  $redef($Symbol.prototype, 'toString', function toString(){
	    return this._k;
	  });

	  $.create     = $create;
	  $.isEnum     = $propertyIsEnumerable;
	  $.getDesc    = $getOwnPropertyDescriptor;
	  $.setDesc    = $defineProperty;
	  $.setDescs   = $defineProperties;
	  $.getNames   = $names.get = $getOwnPropertyNames;
	  $.getSymbols = $getOwnPropertySymbols;

	  if(SUPPORT_DESC && !__webpack_require__(9)){
	    $redef(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
	  }
	}

	// MS Edge converts symbol values to JSON as {}
	if(!useNative || $fails(function(){
	  return JSON.stringify([$Symbol()]) != '[null]';
	}))$redef($Symbol.prototype, 'toJSON', function toJSON(){
	  if(useNative && isObject(this))return this;
	});

	var symbolStatics = {
	  // 19.4.2.1 Symbol.for(key)
	  'for': function(key){
	    return has(SymbolRegistry, key += '')
	      ? SymbolRegistry[key]
	      : SymbolRegistry[key] = $Symbol(key);
	  },
	  // 19.4.2.5 Symbol.keyFor(sym)
	  keyFor: function keyFor(key){
	    return keyOf(SymbolRegistry, key);
	  },
	  useSetter: function(){ setter = true; },
	  useSimple: function(){ setter = false; }
	};
	// 19.4.2.2 Symbol.hasInstance
	// 19.4.2.3 Symbol.isConcatSpreadable
	// 19.4.2.4 Symbol.iterator
	// 19.4.2.6 Symbol.match
	// 19.4.2.8 Symbol.replace
	// 19.4.2.9 Symbol.search
	// 19.4.2.10 Symbol.species
	// 19.4.2.11 Symbol.split
	// 19.4.2.12 Symbol.toPrimitive
	// 19.4.2.13 Symbol.toStringTag
	// 19.4.2.14 Symbol.unscopables
	$.each.call((
	    'hasInstance,isConcatSpreadable,iterator,match,replace,search,' +
	    'species,split,toPrimitive,toStringTag,unscopables'
	  ).split(','), function(it){
	    var sym = wks(it);
	    symbolStatics[it] = useNative ? sym : wrap(sym);
	  }
	);

	setter = true;

	$def($def.G + $def.W, {Symbol: $Symbol});

	$def($def.S, 'Symbol', symbolStatics);

	$def($def.S + $def.F * !useNative, 'Object', {
	  // 19.1.2.2 Object.create(O [, Properties])
	  create: $create,
	  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
	  defineProperty: $defineProperty,
	  // 19.1.2.3 Object.defineProperties(O, Properties)
	  defineProperties: $defineProperties,
	  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
	  // 19.1.2.7 Object.getOwnPropertyNames(O)
	  getOwnPropertyNames: $getOwnPropertyNames,
	  // 19.1.2.8 Object.getOwnPropertySymbols(O)
	  getOwnPropertySymbols: $getOwnPropertySymbols
	});

	// 19.4.3.5 Symbol.prototype[@@toStringTag]
	setTag($Symbol, 'Symbol');
	// 20.2.1.9 Math[@@toStringTag]
	setTag(Math, 'Math', true);
	// 24.3.3 JSON[@@toStringTag]
	setTag(global.JSON, 'JSON', true);

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var $         = __webpack_require__(15)
	  , toIObject = __webpack_require__(46);
	module.exports = function(object, el){
	  var O      = toIObject(object)
	    , keys   = $.getKeys(O)
	    , length = keys.length
	    , index  = 0
	    , key;
	  while(length > index)if(O[key = keys[index++]] === el)return key;
	};

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
	var toString  = {}.toString
	  , toIObject = __webpack_require__(46)
	  , getNames  = __webpack_require__(15).getNames;

	var windowNames = typeof window == 'object' && Object.getOwnPropertyNames
	  ? Object.getOwnPropertyNames(window) : [];

	var getWindowNames = function(it){
	  try {
	    return getNames(it);
	  } catch(e){
	    return windowNames.slice();
	  }
	};

	module.exports.get = function getOwnPropertyNames(it){
	  if(windowNames && toString.call(it) == '[object Window]')return getWindowNames(it);
	  return getNames(toIObject(it));
	};

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	// all enumerable object keys, includes symbols
	var $ = __webpack_require__(15);
	module.exports = function(it){
	  var keys       = $.getKeys(it)
	    , getSymbols = $.getSymbols;
	  if(getSymbols){
	    var symbols = getSymbols(it)
	      , isEnum  = $.isEnum
	      , i       = 0
	      , key;
	    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))keys.push(key);
	  }
	  return keys;
	};

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(64), __esModule: true };

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(15);
	module.exports = function create(P, D){
	  return $.create(P, D);
	};

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(66), __esModule: true };

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(67);
	__webpack_require__(4);
	__webpack_require__(42);
	__webpack_require__(68);
	module.exports = __webpack_require__(12).Promise;

/***/ },
/* 67 */
/***/ function(module, exports) {

	

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $          = __webpack_require__(15)
	  , LIBRARY    = __webpack_require__(9)
	  , global     = __webpack_require__(11)
	  , ctx        = __webpack_require__(27)
	  , classof    = __webpack_require__(36)
	  , $def       = __webpack_require__(10)
	  , isObject   = __webpack_require__(32)
	  , anObject   = __webpack_require__(31)
	  , aFunction  = __webpack_require__(28)
	  , strictNew  = __webpack_require__(69)
	  , forOf      = __webpack_require__(70)
	  , setProto   = __webpack_require__(71).set
	  , same       = __webpack_require__(72)
	  , species    = __webpack_require__(73)
	  , SPECIES    = __webpack_require__(20)('species')
	  , RECORD     = __webpack_require__(22)('record')
	  , asap       = __webpack_require__(74)
	  , PROMISE    = 'Promise'
	  , process    = global.process
	  , isNode     = classof(process) == 'process'
	  , P          = global[PROMISE]
	  , Wrapper;

	var testResolve = function(sub){
	  var test = new P(function(){});
	  if(sub)test.constructor = Object;
	  return P.resolve(test) === test;
	};

	var useNative = function(){
	  var works = false;
	  function P2(x){
	    var self = new P(x);
	    setProto(self, P2.prototype);
	    return self;
	  }
	  try {
	    works = P && P.resolve && testResolve();
	    setProto(P2, P);
	    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
	    // actual Firefox has broken subclass support, test that
	    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
	      works = false;
	    }
	    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
	    if(works && __webpack_require__(17)){
	      var thenableThenGotten = false;
	      P.resolve($.setDesc({}, 'then', {
	        get: function(){ thenableThenGotten = true; }
	      }));
	      works = thenableThenGotten;
	    }
	  } catch(e){ works = false; }
	  return works;
	}();

	// helpers
	var isPromise = function(it){
	  return isObject(it) && (useNative ? classof(it) == 'Promise' : RECORD in it);
	};
	var sameConstructor = function(a, b){
	  // library wrapper special case
	  if(LIBRARY && a === P && b === Wrapper)return true;
	  return same(a, b);
	};
	var getConstructor = function(C){
	  var S = anObject(C)[SPECIES];
	  return S != undefined ? S : C;
	};
	var isThenable = function(it){
	  var then;
	  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
	};
	var notify = function(record, isReject){
	  if(record.n)return;
	  record.n = true;
	  var chain = record.c;
	  asap(function(){
	    var value = record.v
	      , ok    = record.s == 1
	      , i     = 0;
	    var run = function(react){
	      var cb = ok ? react.ok : react.fail
	        , ret, then;
	      try {
	        if(cb){
	          if(!ok)record.h = true;
	          ret = cb === true ? value : cb(value);
	          if(ret === react.P){
	            react.rej(TypeError('Promise-chain cycle'));
	          } else if(then = isThenable(ret)){
	            then.call(ret, react.res, react.rej);
	          } else react.res(ret);
	        } else react.rej(value);
	      } catch(err){
	        react.rej(err);
	      }
	    };
	    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
	    chain.length = 0;
	    record.n = false;
	    if(isReject)setTimeout(function(){
	      var promise = record.p
	        , handler, console;
	      if(isUnhandled(promise)){
	        if(isNode){
	          process.emit('unhandledRejection', value, promise);
	        } else if(handler = global.onunhandledrejection){
	          handler({promise: promise, reason: value});
	        } else if((console = global.console) && console.error){
	          console.error('Unhandled promise rejection', value);
	        }
	      } record.a = undefined;
	    }, 1);
	  });
	};
	var isUnhandled = function(promise){
	  var record = promise[RECORD]
	    , chain  = record.a || record.c
	    , i      = 0
	    , react;
	  if(record.h)return false;
	  while(chain.length > i){
	    react = chain[i++];
	    if(react.fail || !isUnhandled(react.P))return false;
	  } return true;
	};
	var $reject = function(value){
	  var record = this;
	  if(record.d)return;
	  record.d = true;
	  record = record.r || record; // unwrap
	  record.v = value;
	  record.s = 2;
	  record.a = record.c.slice();
	  notify(record, true);
	};
	var $resolve = function(value){
	  var record = this
	    , then;
	  if(record.d)return;
	  record.d = true;
	  record = record.r || record; // unwrap
	  try {
	    if(then = isThenable(value)){
	      asap(function(){
	        var wrapper = {r: record, d: false}; // wrap
	        try {
	          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
	        } catch(e){
	          $reject.call(wrapper, e);
	        }
	      });
	    } else {
	      record.v = value;
	      record.s = 1;
	      notify(record, false);
	    }
	  } catch(e){
	    $reject.call({r: record, d: false}, e); // wrap
	  }
	};

	// constructor polyfill
	if(!useNative){
	  // 25.4.3.1 Promise(executor)
	  P = function Promise(executor){
	    aFunction(executor);
	    var record = {
	      p: strictNew(this, P, PROMISE),         // <- promise
	      c: [],                                  // <- awaiting reactions
	      a: undefined,                           // <- checked in isUnhandled reactions
	      s: 0,                                   // <- state
	      d: false,                               // <- done
	      v: undefined,                           // <- value
	      h: false,                               // <- handled rejection
	      n: false                                // <- notify
	    };
	    this[RECORD] = record;
	    try {
	      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
	    } catch(err){
	      $reject.call(record, err);
	    }
	  };
	  __webpack_require__(79)(P.prototype, {
	    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
	    then: function then(onFulfilled, onRejected){
	      var S = anObject(anObject(this).constructor)[SPECIES];
	      var react = {
	        ok:   typeof onFulfilled == 'function' ? onFulfilled : true,
	        fail: typeof onRejected == 'function'  ? onRejected  : false
	      };
	      var promise = react.P = new (S != undefined ? S : P)(function(res, rej){
	        react.res = res;
	        react.rej = rej;
	      });
	      aFunction(react.res);
	      aFunction(react.rej);
	      var record = this[RECORD];
	      record.c.push(react);
	      if(record.a)record.a.push(react);
	      if(record.s)notify(record, false);
	      return promise;
	    },
	    // 25.4.5.1 Promise.prototype.catch(onRejected)
	    'catch': function(onRejected){
	      return this.then(undefined, onRejected);
	    }
	  });
	}

	// export
	$def($def.G + $def.W + $def.F * !useNative, {Promise: P});
	__webpack_require__(25)(P, PROMISE);
	species(P);
	species(Wrapper = __webpack_require__(12)[PROMISE]);

	// statics
	$def($def.S + $def.F * !useNative, PROMISE, {
	  // 25.4.4.5 Promise.reject(r)
	  reject: function reject(r){
	    return new this(function(res, rej){ rej(r); });
	  }
	});
	$def($def.S + $def.F * (!useNative || testResolve(true)), PROMISE, {
	  // 25.4.4.6 Promise.resolve(x)
	  resolve: function resolve(x){
	    return isPromise(x) && sameConstructor(x.constructor, this)
	      ? x : new this(function(res){ res(x); });
	  }
	});
	$def($def.S + $def.F * !(useNative && __webpack_require__(38)(function(iter){
	  P.all(iter)['catch'](function(){});
	})), PROMISE, {
	  // 25.4.4.1 Promise.all(iterable)
	  all: function all(iterable){
	    var C      = getConstructor(this)
	      , values = [];
	    return new C(function(res, rej){
	      forOf(iterable, false, values.push, values);
	      var remaining = values.length
	        , results   = Array(remaining);
	      if(remaining)$.each.call(values, function(promise, index){
	        C.resolve(promise).then(function(value){
	          results[index] = value;
	          --remaining || res(results);
	        }, rej);
	      });
	      else res(results);
	    });
	  },
	  // 25.4.4.4 Promise.race(iterable)
	  race: function race(iterable){
	    var C = getConstructor(this);
	    return new C(function(res, rej){
	      forOf(iterable, false, function(promise){
	        C.resolve(promise).then(res, rej);
	      });
	    });
	  }
	});

/***/ },
/* 69 */
/***/ function(module, exports) {

	module.exports = function(it, Constructor, name){
	  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
	  return it;
	};

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var ctx         = __webpack_require__(27)
	  , call        = __webpack_require__(30)
	  , isArrayIter = __webpack_require__(33)
	  , anObject    = __webpack_require__(31)
	  , toLength    = __webpack_require__(34)
	  , getIterFn   = __webpack_require__(35);
	module.exports = function(iterable, entries, fn, that){
	  var iterFn = getIterFn(iterable)
	    , f      = ctx(fn, that, entries ? 2 : 1)
	    , index  = 0
	    , length, step, iterator;
	  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
	    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
	    call(iterator, f, step.value, entries);
	  }
	};

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	// Works with __proto__ only. Old v8 can't work with null proto objects.
	/* eslint-disable no-proto */
	var getDesc  = __webpack_require__(15).getDesc
	  , isObject = __webpack_require__(32)
	  , anObject = __webpack_require__(31);
	var check = function(O, proto){
	  anObject(O);
	  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
	};
	module.exports = {
	  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line no-proto
	    function(test, buggy, set){
	      try {
	        set = __webpack_require__(27)(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
	        set(test, []);
	        buggy = !(test instanceof Array);
	      } catch(e){ buggy = true; }
	      return function setPrototypeOf(O, proto){
	        check(O, proto);
	        if(buggy)O.__proto__ = proto;
	        else set(O, proto);
	        return O;
	      };
	    }({}, false) : undefined),
	  check: check
	};

/***/ },
/* 72 */
/***/ function(module, exports) {

	module.exports = Object.is || function is(x, y){
	  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
	};

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $       = __webpack_require__(15)
	  , SPECIES = __webpack_require__(20)('species');
	module.exports = function(C){
	  if(__webpack_require__(17) && !(SPECIES in C))$.setDesc(C, SPECIES, {
	    configurable: true,
	    get: function(){ return this; }
	  });
	};

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(11)
	  , macrotask = __webpack_require__(75).set
	  , Observer  = global.MutationObserver || global.WebKitMutationObserver
	  , process   = global.process
	  , isNode    = __webpack_require__(37)(process) == 'process'
	  , head, last, notify;

	var flush = function(){
	  var parent, domain;
	  if(isNode && (parent = process.domain)){
	    process.domain = null;
	    parent.exit();
	  }
	  while(head){
	    domain = head.domain;
	    if(domain)domain.enter();
	    head.fn.call(); // <- currently we use it only for Promise - try / catch not required
	    if(domain)domain.exit();
	    head = head.next;
	  } last = undefined;
	  if(parent)parent.enter();
	}

	// Node.js
	if(isNode){
	  notify = function(){
	    process.nextTick(flush);
	  };
	// browsers with MutationObserver
	} else if(Observer){
	  var toggle = 1
	    , node   = document.createTextNode('');
	  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
	  notify = function(){
	    node.data = toggle = -toggle;
	  };
	// for other environments - macrotask based on:
	// - setImmediate
	// - MessageChannel
	// - window.postMessag
	// - onreadystatechange
	// - setTimeout
	} else {
	  notify = function(){
	    // strange IE + webpack dev server bug - use .call(global)
	    macrotask.call(global, flush);
	  };
	}

	module.exports = function asap(fn){
	  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
	  if(last)last.next = task;
	  if(!head){
	    head = task;
	    notify();
	  } last = task;
	};

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx                = __webpack_require__(27)
	  , invoke             = __webpack_require__(76)
	  , html               = __webpack_require__(77)
	  , cel                = __webpack_require__(78)
	  , global             = __webpack_require__(11)
	  , process            = global.process
	  , setTask            = global.setImmediate
	  , clearTask          = global.clearImmediate
	  , MessageChannel     = global.MessageChannel
	  , counter            = 0
	  , queue              = {}
	  , ONREADYSTATECHANGE = 'onreadystatechange'
	  , defer, channel, port;
	var run = function(){
	  var id = +this;
	  if(queue.hasOwnProperty(id)){
	    var fn = queue[id];
	    delete queue[id];
	    fn();
	  }
	};
	var listner = function(event){
	  run.call(event.data);
	};
	// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
	if(!setTask || !clearTask){
	  setTask = function setImmediate(fn){
	    var args = [], i = 1;
	    while(arguments.length > i)args.push(arguments[i++]);
	    queue[++counter] = function(){
	      invoke(typeof fn == 'function' ? fn : Function(fn), args);
	    };
	    defer(counter);
	    return counter;
	  };
	  clearTask = function clearImmediate(id){
	    delete queue[id];
	  };
	  // Node.js 0.8-
	  if(__webpack_require__(37)(process) == 'process'){
	    defer = function(id){
	      process.nextTick(ctx(run, id, 1));
	    };
	  // Browsers with MessageChannel, includes WebWorkers
	  } else if(MessageChannel){
	    channel = new MessageChannel;
	    port    = channel.port2;
	    channel.port1.onmessage = listner;
	    defer = ctx(port.postMessage, port, 1);
	  // Browsers with postMessage, skip WebWorkers
	  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
	  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScript){
	    defer = function(id){
	      global.postMessage(id + '', '*');
	    };
	    global.addEventListener('message', listner, false);
	  // IE8-
	  } else if(ONREADYSTATECHANGE in cel('script')){
	    defer = function(id){
	      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
	        html.removeChild(this);
	        run.call(id);
	      };
	    };
	  // Rest old browsers
	  } else {
	    defer = function(id){
	      setTimeout(ctx(run, id, 1), 0);
	    };
	  }
	}
	module.exports = {
	  set:   setTask,
	  clear: clearTask
	};

/***/ },
/* 76 */
/***/ function(module, exports) {

	// fast apply, http://jsperf.lnkit.com/fast-apply/5
	module.exports = function(fn, args, that){
	  var un = that === undefined;
	  switch(args.length){
	    case 0: return un ? fn()
	                      : fn.call(that);
	    case 1: return un ? fn(args[0])
	                      : fn.call(that, args[0]);
	    case 2: return un ? fn(args[0], args[1])
	                      : fn.call(that, args[0], args[1]);
	    case 3: return un ? fn(args[0], args[1], args[2])
	                      : fn.call(that, args[0], args[1], args[2]);
	    case 4: return un ? fn(args[0], args[1], args[2], args[3])
	                      : fn.call(that, args[0], args[1], args[2], args[3]);
	  } return              fn.apply(that, args);
	};

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(11).document && document.documentElement;

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(32)
	  , document = __webpack_require__(11).document
	  // in old IE typeof document.createElement is 'object'
	  , is = isObject(document) && isObject(document.createElement);
	module.exports = function(it){
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	var $redef = __webpack_require__(13);
	module.exports = function(target, src){
	  for(var key in src)$redef(target, key, src[key]);
	  return target;
	};

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(81), __esModule: true };

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(82);
	module.exports = __webpack_require__(12).Object.keys;

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 Object.keys(O)
	var toObject = __webpack_require__(29);

	__webpack_require__(83)('keys', function($keys){
	  return function keys(it){
	    return $keys(toObject(it));
	  };
	});

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	// most Object methods by ES6 should accept primitives
	module.exports = function(KEY, exec){
	  var $def = __webpack_require__(10)
	    , fn   = (__webpack_require__(12).Object || {})[KEY] || Object[KEY]
	    , exp  = {};
	  exp[KEY] = exec(fn);
	  $def($def.S + $def.F * __webpack_require__(18)(function(){ fn(1); }), 'Object', exp);
	};

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(85), __esModule: true };

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(67);
	__webpack_require__(4);
	__webpack_require__(42);
	__webpack_require__(86);
	__webpack_require__(89);
	module.exports = __webpack_require__(12).Set;

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var strong = __webpack_require__(87);

	// 23.2 Set Objects
	__webpack_require__(88)('Set', function(get){
	  return function Set(){ return get(this, arguments[0]); };
	}, {
	  // 23.2.3.1 Set.prototype.add(value)
	  add: function add(value){
	    return strong.def(this, value = value === 0 ? 0 : value, value);
	  }
	}, strong);

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $            = __webpack_require__(15)
	  , hide         = __webpack_require__(14)
	  , ctx          = __webpack_require__(27)
	  , species      = __webpack_require__(73)
	  , strictNew    = __webpack_require__(69)
	  , defined      = __webpack_require__(7)
	  , forOf        = __webpack_require__(70)
	  , step         = __webpack_require__(45)
	  , ID           = __webpack_require__(22)('id')
	  , $has         = __webpack_require__(19)
	  , isObject     = __webpack_require__(32)
	  , isExtensible = Object.isExtensible || isObject
	  , SUPPORT_DESC = __webpack_require__(17)
	  , SIZE         = SUPPORT_DESC ? '_s' : 'size'
	  , id           = 0;

	var fastKey = function(it, create){
	  // return primitive with prefix
	  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
	  if(!$has(it, ID)){
	    // can't set id to frozen object
	    if(!isExtensible(it))return 'F';
	    // not necessary to add id
	    if(!create)return 'E';
	    // add missing object id
	    hide(it, ID, ++id);
	  // return object id with prefix
	  } return 'O' + it[ID];
	};

	var getEntry = function(that, key){
	  // fast case
	  var index = fastKey(key), entry;
	  if(index !== 'F')return that._i[index];
	  // frozen object case
	  for(entry = that._f; entry; entry = entry.n){
	    if(entry.k == key)return entry;
	  }
	};

	module.exports = {
	  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
	    var C = wrapper(function(that, iterable){
	      strictNew(that, C, NAME);
	      that._i = $.create(null); // index
	      that._f = undefined;      // first entry
	      that._l = undefined;      // last entry
	      that[SIZE] = 0;           // size
	      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
	    });
	    __webpack_require__(79)(C.prototype, {
	      // 23.1.3.1 Map.prototype.clear()
	      // 23.2.3.2 Set.prototype.clear()
	      clear: function clear(){
	        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
	          entry.r = true;
	          if(entry.p)entry.p = entry.p.n = undefined;
	          delete data[entry.i];
	        }
	        that._f = that._l = undefined;
	        that[SIZE] = 0;
	      },
	      // 23.1.3.3 Map.prototype.delete(key)
	      // 23.2.3.4 Set.prototype.delete(value)
	      'delete': function(key){
	        var that  = this
	          , entry = getEntry(that, key);
	        if(entry){
	          var next = entry.n
	            , prev = entry.p;
	          delete that._i[entry.i];
	          entry.r = true;
	          if(prev)prev.n = next;
	          if(next)next.p = prev;
	          if(that._f == entry)that._f = next;
	          if(that._l == entry)that._l = prev;
	          that[SIZE]--;
	        } return !!entry;
	      },
	      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
	      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
	      forEach: function forEach(callbackfn /*, that = undefined */){
	        var f = ctx(callbackfn, arguments[1], 3)
	          , entry;
	        while(entry = entry ? entry.n : this._f){
	          f(entry.v, entry.k, this);
	          // revert to the last existing entry
	          while(entry && entry.r)entry = entry.p;
	        }
	      },
	      // 23.1.3.7 Map.prototype.has(key)
	      // 23.2.3.7 Set.prototype.has(value)
	      has: function has(key){
	        return !!getEntry(this, key);
	      }
	    });
	    if(SUPPORT_DESC)$.setDesc(C.prototype, 'size', {
	      get: function(){
	        return defined(this[SIZE]);
	      }
	    });
	    return C;
	  },
	  def: function(that, key, value){
	    var entry = getEntry(that, key)
	      , prev, index;
	    // change existing entry
	    if(entry){
	      entry.v = value;
	    // create new entry
	    } else {
	      that._l = entry = {
	        i: index = fastKey(key, true), // <- index
	        k: key,                        // <- key
	        v: value,                      // <- value
	        p: prev = that._l,             // <- previous entry
	        n: undefined,                  // <- next entry
	        r: false                       // <- removed
	      };
	      if(!that._f)that._f = entry;
	      if(prev)prev.n = entry;
	      that[SIZE]++;
	      // add to index
	      if(index !== 'F')that._i[index] = entry;
	    } return that;
	  },
	  getEntry: getEntry,
	  setStrong: function(C, NAME, IS_MAP){
	    // add .keys, .values, .entries, [@@iterator]
	    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
	    __webpack_require__(8)(C, NAME, function(iterated, kind){
	      this._t = iterated;  // target
	      this._k = kind;      // kind
	      this._l = undefined; // previous
	    }, function(){
	      var that  = this
	        , kind  = that._k
	        , entry = that._l;
	      // revert to the last existing entry
	      while(entry && entry.r)entry = entry.p;
	      // get next entry
	      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
	        // or finish the iteration
	        that._t = undefined;
	        return step(1);
	      }
	      // return step by kind
	      if(kind == 'keys'  )return step(0, entry.k);
	      if(kind == 'values')return step(0, entry.v);
	      return step(0, [entry.k, entry.v]);
	    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);

	    // add [@@species], 23.1.2.2, 23.2.2.2
	    species(C);
	    species(__webpack_require__(12)[NAME]); // for wrapper
	  }
	};

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $          = __webpack_require__(15)
	  , $def       = __webpack_require__(10)
	  , hide       = __webpack_require__(14)
	  , forOf      = __webpack_require__(70)
	  , strictNew  = __webpack_require__(69);

	module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
	  var Base  = __webpack_require__(11)[NAME]
	    , C     = Base
	    , ADDER = IS_MAP ? 'set' : 'add'
	    , proto = C && C.prototype
	    , O     = {};
	  if(!__webpack_require__(17) || typeof C != 'function'
	    || !(IS_WEAK || proto.forEach && !__webpack_require__(18)(function(){ new C().entries().next(); }))
	  ){
	    // create collection constructor
	    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
	    __webpack_require__(79)(C.prototype, methods);
	  } else {
	    C = wrapper(function(target, iterable){
	      strictNew(target, C, NAME);
	      target._c = new Base;
	      if(iterable != undefined)forOf(iterable, IS_MAP, target[ADDER], target);
	    });
	    $.each.call('add,clear,delete,forEach,get,has,set,keys,values,entries'.split(','),function(KEY){
	      var chain = KEY == 'add' || KEY == 'set';
	      if(KEY in proto && !(IS_WEAK && KEY == 'clear'))hide(C.prototype, KEY, function(a, b){
	        var result = this._c[KEY](a === 0 ? 0 : a, b);
	        return chain ? this : result;
	      });
	    });
	    if('size' in proto)$.setDesc(C.prototype, 'size', {
	      get: function(){
	        return this._c.size;
	      }
	    });
	  }

	  __webpack_require__(25)(C, NAME);

	  O[NAME] = C;
	  $def($def.G + $def.W + $def.F, O);

	  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);

	  return C;
	};

/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var $def  = __webpack_require__(10);

	$def($def.P, 'Set', {toJSON: __webpack_require__(90)('Set')});

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var forOf   = __webpack_require__(70)
	  , classof = __webpack_require__(36);
	module.exports = function(NAME){
	  return function toJSON(){
	    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
	    var arr = [];
	    forOf(this, false, arr.push, arr);
	    return arr;
	  };
	};

/***/ }
/******/ ])
});
;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = debounce;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)))

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

const urlparse = __webpack_require__(43);
const {dom, rule, ruleset} = __webpack_require__(17);

function makeUrlAbsolute(base, relative) {
  const relativeParsed = urlparse.parse(relative);

  if (relativeParsed.host === null) {
    return urlparse.resolve(base, relative);
  }

  return relative;
}

function getProvider(url) {
  return urlparse.parse(url)
    .hostname
    .replace(/www[a-zA-Z0-9]*\./, '')
    .replace('.co.', '.')
    .split('.')
    .slice(0, -1)
    .join(' ');
}

function buildRuleset(name, rules, processors, scorers) {
  const reversedRules = Array.from(rules).reverse();
  const builtRuleset = ruleset(...reversedRules.map(([query, handler], order) => rule(
    dom(query),
    node => {
      let score = order;

      if (scorers) {
        scorers.forEach(scorer => {
          const newScore = scorer(node, score);

          if (newScore) {
            score = newScore;
          }
        });
      }

      return [{
        flavor: name,
        score: score,
        notes: handler(node),
      }];
    }
  )));

  return (doc, context) => {
    const kb = builtRuleset.score(doc);
    const maxNode = kb.max(name);

    if (maxNode) {
      let value = maxNode.flavors.get(name);

      if (processors) {
        processors.forEach(processor => {
          value = processor(value, context);
        });
      }

      if (value) {
        if (value.trim) {
          return value.trim();
        }
        return value;
      }
    }
  };
}

const metadataRules = {
  description: {
    rules: [
      ['meta[property="og:description"]', node => node.element.getAttribute('content')],
      ['meta[name="description"]', node => node.element.getAttribute('content')],
    ],
  },

  icon_url: {
    rules: [
      ['link[rel="apple-touch-icon"]', node => node.element.getAttribute('href')],
      ['link[rel="apple-touch-icon-precomposed"]', node => node.element.getAttribute('href')],
      ['link[rel="icon"]', node => node.element.getAttribute('href')],
      ['link[rel="fluid-icon"]', node => node.element.getAttribute('href')],
      ['link[rel="shortcut icon"]', node => node.element.getAttribute('href')],
      ['link[rel="Shortcut Icon"]', node => node.element.getAttribute('href')],
      ['link[rel="mask-icon"]', node => node.element.getAttribute('href')],
    ],
    scorers: [
      // Handles the case where multiple icons are listed with specific sizes ie
      // <link rel="icon" href="small.png" sizes="16x16">
      // <link rel="icon" href="large.png" sizes="32x32">
      (node, score) => {
        const sizes = node.element.getAttribute('sizes');

        if (sizes) {
          const sizeMatches = sizes.match(/\d+/g);

          if (sizeMatches) {
            return sizeMatches.reduce((a, b) => a * b);
          }
        }
      }
    ],
    processors: [
      (icon_url, context) => makeUrlAbsolute(context.url, icon_url)
    ]
  },

  image_url: {
    rules: [
      ['meta[property="og:image:secure_url"]', node => node.element.getAttribute('content')],
      ['meta[property="og:image:url"]', node => node.element.getAttribute('content')],
      ['meta[property="og:image"]', node => node.element.getAttribute('content')],
      ['meta[name="twitter:image"]', node => node.element.getAttribute('content')],
      ['meta[property="twitter:image"]', node => node.element.getAttribute('content')],
      ['meta[name="thumbnail"]', node => node.element.getAttribute('content')],
    ],
    processors: [
      (image_url, context) => makeUrlAbsolute(context.url, image_url)
    ],
  },

  keywords: {
    rules: [
      ['meta[name="keywords"]', node => node.element.getAttribute('content')],
    ],
    processors: [
      (keywords) => keywords.split(',').map((keyword) => keyword.trim()),
    ]
  },

  title: {
    rules: [
      ['meta[property="og:title"]', node => node.element.getAttribute('content')],
      ['meta[name="twitter:title"]', node => node.element.getAttribute('content')],
      ['meta[property="twitter:title"]', node => node.element.getAttribute('content')],
      ['meta[name="hdl"]', node => node.element.getAttribute('content')],
      ['title', node => node.element.text],
    ],
  },

  type: {
    rules: [
      ['meta[property="og:type"]', node => node.element.getAttribute('content')],
    ],
  },

  url: {
    rules: [
      ['meta[property="og:url"]', node => node.element.getAttribute('content')],
      ['link[rel="canonical"]', node => node.element.getAttribute('href')],
    ],
    processors: [
      (url, context) => makeUrlAbsolute(context.url, url)
    ]
  },

  provider: {
    rules: [
      ['meta[property="og:site_name"]', node => node.element.getAttribute('content')]
    ]
  },
};

function getMetadata(doc, url, rules) {
  const metadata = {};
  const context = {url};
  const ruleSet = rules || metadataRules;

  Object.keys(ruleSet).map(metadataKey => {
    const metadataRule = ruleSet[metadataKey];

    if(Array.isArray(metadataRule.rules)) {
      const builtRule = buildRuleset(
        metadataKey,
        metadataRule.rules,
        metadataRule.processors,
        metadataRule.scorers
      );

      metadata[metadataKey] = builtRule(doc, context);
    } else {
      metadata[metadataKey] = getMetadata(doc, url, metadataRule);
    }
  });

  if(!metadata.url) {
    metadata.url = url;
  }

  if(url && !metadata.provider) {
    metadata.provider = getProvider(url);
  }

  if(url && !metadata.icon_url) {
    metadata.icon_url = makeUrlAbsolute(url, '/favicon.ico');
  }

  return metadata;
}

module.exports = {
  buildRuleset,
  getMetadata,
  getProvider,
  makeUrlAbsolute,
  metadataRules
};


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
function createThunkMiddleware(extraArgument) {
  return function (_ref) {
    var dispatch = _ref.dispatch;
    var getState = _ref.getState;
    return function (next) {
      return function (action) {
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);
        }

        return next(action);
      };
    };
  };
}

var thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

exports['default'] = thunk;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var getValue = __webpack_require__(28).get

function defaultCompare (a, b) {
  return a === b
}

function watch (getState, objectPath, compare) {
  compare = compare || defaultCompare
  var currentValue = getValue(getState(), objectPath)
  return function w (fn) {
    return function () {
      var newValue = getValue(getState(), objectPath)
      if (!compare(currentValue, newValue)) {
        var oldValue = currentValue
        currentValue = newValue
        fn(newValue, oldValue, objectPath)
      }
    }
  }
}

module.exports = watch


/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__createStore__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__combineReducers__ = __webpack_require__(36);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__bindActionCreators__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__applyMiddleware__ = __webpack_require__(34);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__compose__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__utils_warning__ = __webpack_require__(7);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "createStore", function() { return __WEBPACK_IMPORTED_MODULE_0__createStore__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "combineReducers", function() { return __WEBPACK_IMPORTED_MODULE_1__combineReducers__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "bindActionCreators", function() { return __WEBPACK_IMPORTED_MODULE_2__bindActionCreators__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "applyMiddleware", function() { return __WEBPACK_IMPORTED_MODULE_3__applyMiddleware__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "compose", function() { return __WEBPACK_IMPORTED_MODULE_4__compose__["a"]; });







/*
* This is a dummy function to check if the function name has been altered by minification.
* If the function has been minified and NODE_ENV !== 'production', warn the user.
*/
function isCrushed() {}

if (process.env.NODE_ENV !== 'production' && typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__utils_warning__["a" /* default */])('You are currently using minified code outside of NODE_ENV === \'production\'. ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' + 'to ensure you have the correct code for your production build.');
}


/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(4)))

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
exports.defaultMemoize = defaultMemoize;
exports.createSelectorCreator = createSelectorCreator;
exports.createStructuredSelector = createStructuredSelector;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function defaultEqualityCheck(a, b) {
  return a === b;
}

function defaultMemoize(func) {
  var equalityCheck = arguments.length <= 1 || arguments[1] === undefined ? defaultEqualityCheck : arguments[1];

  var lastArgs = null;
  var lastResult = null;
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (lastArgs === null || lastArgs.length !== args.length || !args.every(function (value, index) {
      return equalityCheck(value, lastArgs[index]);
    })) {
      lastResult = func.apply(undefined, args);
    }
    lastArgs = args;
    return lastResult;
  };
}

function getDependencies(funcs) {
  var dependencies = Array.isArray(funcs[0]) ? funcs[0] : funcs;

  if (!dependencies.every(function (dep) {
    return typeof dep === 'function';
  })) {
    var dependencyTypes = dependencies.map(function (dep) {
      return typeof dep;
    }).join(', ');
    throw new Error('Selector creators expect all input-selectors to be functions, ' + ('instead received the following types: [' + dependencyTypes + ']'));
  }

  return dependencies;
}

function createSelectorCreator(memoize) {
  for (var _len2 = arguments.length, memoizeOptions = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    memoizeOptions[_key2 - 1] = arguments[_key2];
  }

  return function () {
    for (var _len3 = arguments.length, funcs = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      funcs[_key3] = arguments[_key3];
    }

    var recomputations = 0;
    var resultFunc = funcs.pop();
    var dependencies = getDependencies(funcs);

    var memoizedResultFunc = memoize.apply(undefined, [function () {
      recomputations++;
      return resultFunc.apply(undefined, arguments);
    }].concat(memoizeOptions));

    var selector = function selector(state, props) {
      for (var _len4 = arguments.length, args = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
        args[_key4 - 2] = arguments[_key4];
      }

      var params = dependencies.map(function (dependency) {
        return dependency.apply(undefined, [state, props].concat(args));
      });
      return memoizedResultFunc.apply(undefined, _toConsumableArray(params));
    };

    selector.resultFunc = resultFunc;
    selector.recomputations = function () {
      return recomputations;
    };
    selector.resetRecomputations = function () {
      return recomputations = 0;
    };
    return selector;
  };
}

var createSelector = exports.createSelector = createSelectorCreator(defaultMemoize);

function createStructuredSelector(selectors) {
  var selectorCreator = arguments.length <= 1 || arguments[1] === undefined ? createSelector : arguments[1];

  if (typeof selectors !== 'object') {
    throw new Error('createStructuredSelector expects first argument to be an object ' + ('where each property is a selector, instead received a ' + typeof selectors));
  }
  var objectKeys = Object.keys(selectors);
  return selectorCreator(objectKeys.map(function (key) {
    return selectors[key];
  }), function () {
    for (var _len5 = arguments.length, values = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      values[_key5] = arguments[_key5];
    }

    return values.reduce(function (composition, value, index) {
      composition[objectKeys[index]] = value;
      return composition;
    }, {});
  });
}

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// What is the size of the images, in pixels?
const IMAGE_SIZE = 128;

const hexToRgb = __webpack_require__(19);
const urlParse = __webpack_require__(1);

const sites = __webpack_require__(41).map(site => {
  return Object.assign({}, site, {background_color_rgb: hexToRgb(site.background_color)});
});

function getDomain(url) {
  let domain = urlParse(url, false).host;
  if (domain && domain.startsWith("www.")) {
    domain = domain.slice(4);
  }
  return domain;
}

const sitesByDomain = {};
sites.forEach(site => {
  if ("url" in site) {
    sitesByDomain[getDomain(site.url)] = site;
  }
  if ("urls" in site) {
    for (let url of site.urls) {
      sitesByDomain[getDomain(url)] = site;
    }
  }
});

/**
 * Get the site data for the given url.
 * Returns and empty object if there is no match.
 */
function getSiteData(url) {
  let siteData = {};
  let key;
  try {
    key = getDomain(url);
  } catch (e) {
    key = null;
  }
  if (key && key in sitesByDomain) {
    siteData = sitesByDomain[key];
  }
  return siteData;
}

module.exports.sites = sites;
module.exports.getSiteData = getSiteData;
module.exports.IMAGE_SIZE = IMAGE_SIZE;


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



const {forEach} = __webpack_require__(9);
const {max} = __webpack_require__(18);


// Get a key of a map, first setting it to a default value if it's missing.
function getDefault(map, key, defaultMaker) {
    if (map.has(key)) {
        return map.get(key);
    }
    const defaultValue = defaultMaker();
    map.set(key, defaultValue);
    return defaultValue;
}


// Construct a filtration network of rules.
function ruleset(...rules) {
    const rulesByInputFlavor = new Map();  // [someInputFlavor: [rule, ...]]

    // File each rule under its input flavor:
    forEach(rule => getDefault(rulesByInputFlavor, rule.source.inputFlavor, () => []).push(rule),
            rules);

    return {
        // Iterate over a DOM tree or subtree, building up a knowledgebase, a
        // data structure holding scores and annotations for interesting
        // elements. Return the knowledgebase.
        //
        // This is the "rank" portion of the rank-and-yank algorithm.
        score: function (tree) {
            const kb = knowledgebase();

            // Introduce the whole DOM into the KB as flavor 'dom' to get
            // things started:
            const nonterminals = [[{tree}, 'dom']];  // [[node, flavor], [node, flavor], ...]

            // While there are new facts, run the applicable rules over them to
            // generate even newer facts. Repeat until everything's fully
            // digested. Rules run in no particular guaranteed order.
            while (nonterminals.length) {
                const [inNode, inFlavor] = nonterminals.pop();
                for (let rule of getDefault(rulesByInputFlavor, inFlavor, () => [])) {
                    const outFacts = resultsOf(rule, inNode, inFlavor, kb);
                    for (let fact of outFacts) {
                        const outNode = kb.nodeForElement(fact.element);

                        // No matter whether or not this flavor has been
                        // emitted before for this node, we multiply the score.
                        // We want to be able to add rules that refine the
                        // scoring of a node, without having to rewire the path
                        // of flavors that winds through the ruleset.
                        //
                        // 1 score per Node is plenty. That simplifies our
                        // data, our rankers, our flavor system (since we don't
                        // need to represent score axes), and our engine. If
                        // somebody wants more score axes, they can fake it
                        // themselves with notes, thus paying only for what
                        // they eat. (We can even provide functions that help
                        // with that.) Most rulesets will probably be concerned
                        // with scoring only 1 thing at a time anyway. So,
                        // rankers return a score multiplier + 0 or more new
                        // flavors with optional notes. Facts can never be
                        // deleted from the KB by rankers (or order would start
                        // to matter); after all, they're *facts*.
                        outNode.score *= fact.score;

                        // Add a new annotation to a node--but only if there
                        // wasn't already one of the given flavor already
                        // there; otherwise there's no point.
                        //
                        // You might argue that we might want to modify an
                        // existing note here, but that would be a bad
                        // idea. Notes of a given flavor should be
                        // considered immutable once laid down. Otherwise, the
                        // order of execution of same-flavored rules could
                        // matter, hurting pluggability. Emit a new flavor and
                        // a new note if you want to do that.
                        //
                        // Also, choosing not to add a new fact to nonterminals
                        // when we're not adding a new flavor saves the work of
                        // running the rules against it, which would be
                        // entirely redundant and perform no new work (unless
                        // the rankers were nondeterministic, but don't do
                        // that).
                        if (!outNode.flavors.has(fact.flavor)) {
                            outNode.flavors.set(fact.flavor, fact.notes);
                            kb.indexNodeByFlavor(outNode, fact.flavor);  // TODO: better encapsulation rather than indexing explicitly
                            nonterminals.push([outNode, fact.flavor]);
                        }
                    }
                }
            }
            return kb;
        }
    };
}


// Construct a container for storing and querying facts, where a fact has a
// flavor (used to dispatch further rules upon), a corresponding DOM element, a
// score, and some other arbitrary notes opaque to fathom.
function knowledgebase() {
    const nodesByFlavor = new Map();  // Map{'texty' -> [NodeA],
                                      //     'spiffy' -> [NodeA, NodeB]}
                                      // NodeA = {element: <someElement>,
                                      //
                                      //          // Global nodewide score. Add
                                      //          // custom ones with notes if
                                      //          // you want.
                                      //          score: 8,
                                      //
                                      //          // Flavors is a map of flavor names to notes:
                                      //          flavors: Map{'texty' -> {ownText: 'blah',
                                      //                                   someOtherNote: 'foo',
                                      //                                   someCustomScore: 10},
                                      //                       // This is an empty note:
                                      //                       'fluffy' -> undefined}}
    const nodesByElement = new Map();

    return {
        // Return the "node" (our own data structure that we control) that
        // corresponds to a given DOM element, creating one if necessary.
        nodeForElement: function (element) {
            return getDefault(nodesByElement,
                              element,
                              () => ({element,
                                      score: 1,
                                      flavors: new Map()}));
        },

        // Return the highest-scored node of the given flavor, undefined if
        // there is none.
        max: function (flavor) {
            const nodes = nodesByFlavor.get(flavor);
            return nodes === undefined ? undefined : max(nodes, node => node.score);
        },

        // Let the KB know that a new flavor has been added to an element.
        indexNodeByFlavor: function (node, flavor) {
            getDefault(nodesByFlavor, flavor, () => []).push(node);
        },

        nodesOfFlavor: function (flavor) {
            return getDefault(nodesByFlavor, flavor, () => []);
        }
    };
}


// Apply a rule (as returned by a call to rule()) to a fact, and return the
// new facts that result.
function resultsOf(rule, node, flavor, kb) {
    // If more types of rule pop up someday, do fancier dispatching here.
    return rule.source.flavor === 'flavor' ? resultsOfFlavorRule(rule, node, flavor) : resultsOfDomRule(rule, node, kb);
}


// Pull the DOM tree off the special property of the root "dom" fact, and query
// against it.
function *resultsOfDomRule(rule, specialDomNode, kb) {
    // Use the special "tree" property of the special starting node:
    const matches = specialDomNode.tree.querySelectorAll(rule.source.selector);

    for (let i = 0; i < matches.length; i++) {  // matches is a NodeList, which doesn't conform to iterator protocol
        const element = matches[i];
        const newFacts = explicitFacts(rule.ranker(kb.nodeForElement(element)));
        for (let fact of newFacts) {
            if (fact.element === undefined) {
                fact.element = element;
            }
            if (fact.flavor === undefined) {
                throw new Error('Rankers of dom() rules must return a flavor in each fact. Otherwise, there is no way for that fact to be used later.');
            }
            yield fact;
        }
    }
}


function *resultsOfFlavorRule(rule, node, flavor) {
    const newFacts = explicitFacts(rule.ranker(node));

    for (let fact of newFacts) {
        // If the ranker didn't specify a different element, assume it's
        // talking about the one we passed in:
        if (fact.element === undefined) {
            fact.element = node.element;
        }
        if (fact.flavor === undefined) {
            fact.flavor = flavor;
        }
        yield fact;
    }
}


// Take the possibly abbreviated output of a ranker function, and make it
// explicitly an iterable with a defined score.
//
// Rankers can return undefined, which means "no facts", a single fact, or an
// array of facts.
function *explicitFacts(rankerResult) {
    const array = (rankerResult === undefined) ? [] : (Array.isArray(rankerResult) ? rankerResult : [rankerResult]);
    for (let fact of array) {
        if (fact.score === undefined) {
            fact.score = 1;
        }
        yield fact;
    }
}


// TODO: For the moment, a lot of responsibility is on the rankers to return a
// pretty big data structure of up to 4 properties. This is a bit verbose for
// an arrow function (as I hope we can use most of the time) and the usual case
// will probably be returning just a score multiplier. Make that case more
// concise.

// TODO: It is likely that rankers should receive the notes of their input type
// as a 2nd arg, for brevity.


// Return a condition that uses a DOM selector to find its matches from the
// original DOM tree.
//
// For consistency, Nodes will still be delivered to the transformers, but
// they'll have empty flavors and score = 1.
//
// Condition constructors like dom() and flavor() build stupid, introspectable
// objects that the query engine can read. They don't actually do the query
// themselves. That way, the query planner can be smarter than them, figuring
// out which indices to use based on all of them. (We'll probably keep a heap
// by each dimension's score and a hash by flavor name, for starters.) Someday,
// fancy things like this may be possible: rule(and(tag('p'), klass('snork')),
// ...)
function dom(selector) {
    return {
        flavor: 'dom',
        inputFlavor: 'dom',
        selector
    };
}


// Return a condition that discriminates on nodes of the knowledgebase by flavor.
function flavor(inputFlavor) {
    return {
        flavor: 'flavor',
        inputFlavor
    };
}


function rule(source, ranker) {
    return {
        source,
        ranker
    };
}


module.exports = {
    dom,
    rule,
    ruleset,
    flavor
};


// TODO: Integrate jkerim's static-scored, short-circuiting rules into the design. We can make rankers more introspectable. Rankers become hashes. If you return a static score for all matches, just stick an int in there like {score: 5}. Then the ruleset can be smart enough to run the rules emitting a given type in order of decreasing possible score. (Dynamically scored rules will always be run.) Of course, we'll also have to declare what types a rule can emit: {emits: ['titley']}. Move to a more declarative ranker also moves us closer to a machine-learning-based rule deriver (or at least tuner).


// Future possible fanciness:
// * Metarules, e.g. specific rules for YouTube if it's extremely weird. Maybe they can just take simple predicates over the DOM: metarule(dom => !isEmpty(dom.querySelectorAll('body[youtube]')), rule(...)). Maybe they'll have to be worse: the result of a full rank-and-yank process themselves. Or maybe we can somehow implement them without having to have a special "meta" kind of rule at all.
// * Different kinds of "mixing" than just multiplication, though this makes us care even more that rules execute in order and in series. An alternative may be to have rankers lay down the component numbers and a yanker do the fancier math.
// * Fancy combinators for rule sources, along with something like a Rete tree for more efficiently dispatching them. For example, rule(and(flavor('foo'), flavor('bar')), ...) would match only a node having both the foo and bar flavors.
// * If a ranker returns 0 (i.e. this thing has no chance of being in the category that I'm thinking about), delete the fact from the KB: a performance optimization.
// * I'm not sure about constraining us to execute the rules in order. It hurts efficiency and is going to lead us into a monkeypatching nightmare as third parties contribute rules. What if we instead used subflavors to order where necessary, where a subflavor is "(explicit-flavor, rule that touched me, rule that touched me next, ...)". A second approach: Ordinarily, if we were trying to order rules, we'd have them operate on different flavors, each rule spitting out a fact of a new flavor and the next rule taking it as input. Inserting a third-party rule into a ruleset like that would require rewriting the whole thing to interpose a new flavor. But what if we instead did something like declaring dependencies on certain rules but without mentioning them (in case the set of rules in the ruleset changes later). This draws a clear line between the ruleset's private implementation and its public, hookable API. Think: why would 3rd-party rule B want to fire between A and C? Because it requires some data A lays down and wants to muck with it before C uses it as input. That data would be part of facts of a certain flavor (if the ruleset designer is competent), and rules that want to hook in could specify where in terms of "I want to fire right after facts of flavor FOO are made." They can then mess with the fact before C sees it.
// * We could even defer actually multiplying the ranks together, preserving the individual factors, in case we can get any interesting results out of comparing the results with and without certain rules' effects.
// * Probably fact flavors and the score axes should be separate: fact flavors state what flavor of notes are available about nodes (and might affect rule order if they want to use each other's notes). Score axes talk about the degree to which a node is in a category. Each fact would be linked to a proxy for a DOM node, and all scores would live on those proxies.
// * It probably could use a declarative yanking system to go with the ranking one: the "reduce" to its "map". We may want to implement a few imperatively first, though, and see what patterns shake out.

// Yankers:
// max score (of some flavor)
// max-scored sibling cluster (maybe a contiguous span of containers around high-scoring ones, like a blur algo allowing occasional flecks of low-scoring noise)
// adjacent max-scored sibling clusters (like for Readability's remove-extra-paragraphs test, which has 2 divs, each containing <p>s)
//
// Yanking:
// * Block-level containers at the smallest. (Any smaller, and you're pulling out parts of paragraphs, not entire paragraphs.) mergedInnerTextNakedOrInInInlineTags might make this superfluous.
//
//
// Advantages over readability:
// * State clearly contained
// * Should work fine with ideographic languages and others that lack space-delimited words
// * Pluggable
// * Potential to have rules generated or tuned by training
// * Adaptable to find things other than the main body text
// * Potential to perform better since it doesn't have to run over and over, loosening constraints each time, if it fails


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

const {flatten, forEach, map} = __webpack_require__(9);


function identity(x) {
    return x;
}


// From an iterable return the best item, according to an arbitrary comparator
// function. In case of a tie, the first item wins.
function best(iterable, by, isBetter) {
    let bestSoFar, bestKeySoFar;
    let isFirst = true;
    forEach(
        function (item) {
            const key = by(item);
            if (isBetter(key, bestKeySoFar) || isFirst) {
                bestSoFar = item;
                bestKeySoFar = key;
                isFirst = false;
            }
        },
        iterable);
    if (isFirst) {
        throw new Error('Tried to call best() on empty iterable');
    }
    return bestSoFar;
}


// Return the maximum item from an iterable, as defined by >.
//
// Works with any type that works with >. If multiple items are equally great,
// return the first.
//
// by: a function that, given an item of the iterable, returns a value to
//     compare
function max(iterable, by = identity) {
    return best(iterable, by, (a, b) => a > b);
}


function min(iterable, by = identity) {
    return best(iterable, by, (a, b) => a < b);
}


// Return the sum of an iterable, as defined by the + operator.
function sum(iterable) {
    let total;
    let isFirst = true;
    forEach(
        function assignOrAdd(addend) {
            if (isFirst) {
                total = addend;
                isFirst = false;
            } else {
                total += addend;
            }
        },
        iterable);
    return total;
}


function length(iterable) {
    let num = 0;
    for (let item of iterable) {
        num++;
    }
    return num;
}


// Iterate, depth first, over a DOM node. Return the original node first.
// shouldTraverse - a function on a node saying whether we should include it
//     and its children
function *walk(element, shouldTraverse) {
    yield element;
    for (let child of element.childNodes) {
        if (shouldTraverse(child)) {
            for (let w of walk(child, shouldTraverse)) {
                yield w;
            }
        }
    }
}


const blockTags = new Set();
forEach(blockTags.add.bind(blockTags),
        ['ADDRESS', 'BLOCKQUOTE', 'BODY', 'CENTER', 'DIR', 'DIV', 'DL',
         'FIELDSET', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR',
         'ISINDEX', 'MENU', 'NOFRAMES', 'NOSCRIPT', 'OL', 'P', 'PRE',
         'TABLE', 'UL', 'DD', 'DT', 'FRAMESET', 'LI', 'TBODY', 'TD',
         'TFOOT', 'TH', 'THEAD', 'TR', 'HTML']);
// Return whether a DOM element is a block element by default (rather
// than by styling).
function isBlock(element) {
    return blockTags.has(element.tagName);
}


// Yield strings of text nodes within a normalized DOM node and its
// children, without venturing into any contained block elements.
//
// shouldTraverse: A function that specifies additional elements to
//     exclude by returning false
function *inlineTexts(element, shouldTraverse = element => true) {
    // TODO: Could we just use querySelectorAll() with a really long
    // selector rather than walk(), for speed?
    for (let child of walk(element,
                             element => !(isBlock(element) ||
                                          element.tagName === 'SCRIPT' &&
                                          element.tagName === 'STYLE')
                                        && shouldTraverse(element))) {
        if (child.nodeType === child.TEXT_NODE) {
            // wholeText() is not implemented by jsdom, so we use
            // textContent(). The result should be the same, since
            // we're calling it on only text nodes, but it may be
            // slower. On the positive side, it means we don't need to
            // normalize the DOM tree first.
            yield child.textContent;
        }
    }
}


function inlineTextLength(element, shouldTraverse = element => true) {
    return sum(map(text => collapseWhitespace(text).length,
                   inlineTexts(element, shouldTraverse)));
}


function collapseWhitespace(str) {
    return str.replace(/\s{2,}/g, ' ');
}


// Return the ratio of the inline text length of the links in an
// element to the inline text length of the entire element.
function linkDensity(node) {
    const length = node.flavors.get('paragraphish').inlineLength;
    const lengthWithoutLinks = inlineTextLength(node.element,
                                                element => element.tagName !== 'A');
    return (length - lengthWithoutLinks) / length;
}


// Return the next sibling node of `element`, skipping over text nodes that
// consist wholly of whitespace.
function isWhitespace(element) {
    return (element.nodeType === element.TEXT_NODE &&
            element.textContent.trim().length === 0);
}


// Return the number of stride nodes between 2 DOM nodes *at the same
// level of the tree*, without going up or down the tree.
//
// Stride nodes are {(1) siblings or (2) siblings of ancestors} that lie
// between the 2 nodes. These interposed nodes make it less likely that the 2
// nodes should be together in a cluster.
//
// left xor right may also be undefined.
function numStrides(left, right) {
    let num = 0;

    // Walk right from left node until we hit the right node or run out:
    let sibling = left;
    let shouldContinue = sibling && sibling !== right;
    while (shouldContinue) {
        sibling = sibling.nextSibling;
        if ((shouldContinue = sibling && sibling !== right) &&
            !isWhitespace(sibling)) {
            num += 1;
        }
    }
    if (sibling !== right) {  // Don't double-punish if left and right are siblings.
        // Walk left from right node:
        sibling = right;
        while (sibling) {
            sibling = sibling.previousSibling;
            if (sibling && !isWhitespace(sibling)) {
                num += 1;
            }
        }
    }
    return num;
}


// Return a distance measurement between 2 DOM nodes.
//
// I was thinking of something that adds little cost for siblings.
// Up should probably be more expensive than down (see middle example in the Nokia paper).
// O(n log n)
function distance(elementA, elementB) {
    // TODO: Test and tune these costs. They're off-the-cuff at the moment.
    //
    // Cost for each level deeper one node is than the other below their common
    // ancestor:
    const DIFFERENT_DEPTH_COST = 2;
    // Cost for a level below the common ancestor where tagNames differ:
    const DIFFERENT_TAG_COST = 2;
    // Cost for a level below the common ancestor where tagNames are the same:
    const SAME_TAG_COST = 1;
    // Cost for each stride node between A and B:
    const STRIDE_COST = 1;

    if (elementA === elementB) {
        return 0;
    }

    // Stacks that go from the common ancestor all the way to A and B:
    const aAncestors = [elementA];
    const bAncestors = [elementB];

    let aAncestor = elementA;
    let bAncestor = elementB;

    // Ascend to common parent, stacking them up for later reference:
    while (!aAncestor.contains(elementB)) {
        aAncestor = aAncestor.parentNode;
        aAncestors.push(aAncestor);
    }

    // Make an ancestor stack for the right node too so we can walk
    // efficiently down to it:
    do {
        bAncestor = bAncestor.parentNode;  // Assumes we've early-returned above if A === B.
        bAncestors.push(bAncestor);
    } while (bAncestor !== aAncestor);

    // Figure out which node is left and which is right, so we can follow
    // sibling links in the appropriate directions when looking for stride
    // nodes:
    let left = aAncestors;
    let right = bAncestors;
    // In compareDocumentPosition()'s opinion, inside implies after. Basically,
    // before and after pertain to opening tags.
    const comparison = elementA.compareDocumentPosition(elementB);
    let cost = 0;
    let mightStride;
    if (comparison & elementA.DOCUMENT_POSITION_FOLLOWING) {
        // A is before, so it could contain the other node.
        mightStride = !(comparison & elementA.DOCUMENT_POSITION_CONTAINED_BY)
        left = aAncestors;
        right = bAncestors;
    } else if (comparison & elementA.DOCUMENT_POSITION_PRECEDING) {
        // A is after, so it might be contained by the other node.
        mightStride = !(comparison & elementA.DOCUMENT_POSITION_CONTAINS)
        left = bAncestors;
        right = aAncestors;
    }

    // Descend to both nodes in parallel, discounting the traversal
    // cost iff the nodes we hit look similar, implying the nodes dwell
    // within similar structures.
    while (left.length || right.length) {
        const l = left.pop();
        const r = right.pop();
        if (l === undefined || r === undefined) {
            // Punishment for being at different depths: same as ordinary
            // dissimilarity punishment for now
            cost += DIFFERENT_DEPTH_COST;
        } else {
            // TODO: Consider similarity of classList.
            cost += l.tagName === r.tagName ? SAME_TAG_COST : DIFFERENT_TAG_COST;
        }
        // Optimization: strides might be a good dimension to eliminate.
        if (mightStride) {
            cost += numStrides(l, r) * STRIDE_COST;
        }
    }

    return cost;
}


// A lower-triangular matrix of inter-cluster distances
// TODO: Allow distance function to be passed in, making this generally useful
// and not tied to the DOM.
class DistanceMatrix {
    constructor (elements) {
        // A sparse adjacency matrix:
        // {A => {},
        //  B => {A => 4},
        //  C => {A => 4, B => 4},
        //  D => {A => 4, B => 4, C => 4}
        //  E => {A => 4, B => 4, C => 4, D => 4}}
        //
        // A, B, etc. are arrays of [arrays of arrays of...] DOM nodes, each
        // array being a cluster. In this way, they not only accumulate a
        // cluster but retain the steps along the way.
        //
        // This is an efficient data structure in terms of CPU and memory, in
        // that we don't have to slide a lot of memory around when we delete a
        // row or column from the middle of the matrix while merging. Of
        // course, we lose some practical efficiency by using hash tables, and
        // maps in particular are slow in their early implementations.
        this._matrix = new Map();

        // Convert elements to clusters:
        const clusters = elements.map(el => [el]);

        // Init matrix:
        for (let outerCluster of clusters) {
            const innerMap = new Map();
            for (let innerCluster of this._matrix.keys()) {
                innerMap.set(innerCluster, distance(outerCluster[0],
                                                    innerCluster[0]));
            }
            this._matrix.set(outerCluster, innerMap);
        }
        this._numClusters = clusters.length;
    }

    // Return (distance, a: clusterA, b: clusterB) of closest-together clusters.
    // Replace this to change linkage criterion.
    closest () {
        const self = this;

        if (this._numClusters < 2) {
            throw new Error('There must be at least 2 clusters in order to return the closest() ones.');
        }

        // Return the distances between every pair of clusters.
        function *clustersAndDistances() {
            for (let [outerKey, row] of self._matrix.entries()) {
                for (let [innerKey, storedDistance] of row.entries()) {
                    yield {a: outerKey, b: innerKey, distance: storedDistance};
                }
            }
        }
        return min(clustersAndDistances(), x => x.distance);
    }

    // Look up the distance between 2 clusters in me. Try the lookup in the
    // other direction if the first one falls in the nonexistent half of the
    // triangle.
    _cachedDistance (clusterA, clusterB) {
        let ret = this._matrix.get(clusterA).get(clusterB);
        if (ret === undefined) {
            ret = this._matrix.get(clusterB).get(clusterA);
        }
        return ret;
    }

    // Merge two clusters.
    merge (clusterA, clusterB) {
        // An example showing how rows merge:
        //  A: {}
        //  B: {A: 1}
        //  C: {A: 4, B: 4},
        //  D: {A: 4, B: 4, C: 4}
        //  E: {A: 4, B: 4, C: 2, D: 4}}
        //
        // Step 2:
        //  C: {}
        //  D: {C: 4}
        //  E: {C: 2, D: 4}}
        //  AB: {C: 4, D: 4, E: 4}
        //
        // Step 3:
        //  D:  {}
        //  AB: {D: 4}
        //  CE: {D: 4, AB: 4}

        // Construct new row, finding min distances from either subcluster of
        // the new cluster to old clusters.
        //
        // There will be no repetition in the matrix because, after all,
        // nothing pointed to this new cluster before it existed.
        const newRow = new Map();
        for (let outerKey of this._matrix.keys()) {
            if (outerKey !== clusterA && outerKey !== clusterB) {
                newRow.set(outerKey, Math.min(this._cachedDistance(clusterA, outerKey),
                                              this._cachedDistance(clusterB, outerKey)));
            }
        }

        // Delete the rows of the clusters we're merging.
        this._matrix.delete(clusterA);
        this._matrix.delete(clusterB);

        // Remove inner refs to the clusters we're merging.
        for (let inner of this._matrix.values()) {
            inner.delete(clusterA);
            inner.delete(clusterB);
        }

        // Attach new row.
        this._matrix.set([clusterA, clusterB], newRow);

        // There is a net decrease of 1 cluster:
        this._numClusters -= 1;
    }

    numClusters () {
        return this._numClusters;
    }

    // Return an Array of nodes for each cluster in me.
    clusters () {
        // TODO: Can't get wu.map to work here. Don't know why.
        return Array.from(this._matrix.keys()).map(e => Array.from(flatten(false, e)));
    }
}


// Partition the given nodes into one or more clusters by position in the DOM
// tree.
//
// elements: An Array of DOM nodes
// tooFar: The closest-nodes distance() beyond which we will not attempt to
//     unify 2 clusters
//
// This implements an agglomerative clustering. It uses single linkage, since
// we're talking about adjacency here more than Euclidean proximity: the
// clusters we're talking about in the DOM will tend to be adjacent, not
// overlapping. We haven't tried other linkage criteria yet.
//
// Maybe later we'll consider score or notes.
function clusters(elements, tooFar) {
    const matrix = new DistanceMatrix(elements);
    let closest;

    while (matrix.numClusters() > 1 && (closest = matrix.closest()).distance < tooFar) {
        matrix.merge(closest.a, closest.b);
    }

    return matrix.clusters();
}


module.exports = {
    best,
    collapseWhitespace,
    clusters,
    distance,
    identity,
    inlineTextLength,
    inlineTexts,
    isBlock,
    length,
    linkDensity,
    max,
    min,
    sum,
    walk
};


/***/ }),
/* 19 */
/***/ (function(module, exports) {

module.exports = function hexToRgb (hex) {

  if (hex.charAt && hex.charAt(0) === '#') {
    hex = removeHash(hex)
  }

  if (hex.length === 3) {
    hex = expand(hex)
  }

  var bigint = parseInt(hex, 16)
  var r = (bigint >> 16) & 255
  var g = (bigint >> 8) & 255
  var b = bigint & 255

  return [r, g, b]
}

function removeHash (hex) {

  var arr = hex.split('')
  arr.shift()
  return arr.join('')
}

function expand (hex) {

  return hex
    .split('')
    .reduce(function (accum, value) {

      return accum.concat([value, value])
    }, [])
    .join('')
}


/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getRawTag_js__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__objectToString_js__ = __webpack_require__(24);




/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  value = Object(value);
  return (symToStringTag && symToStringTag in value)
    ? __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__getRawTag_js__["a" /* default */])(value)
    : __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__objectToString_js__["a" /* default */])(value);
}

/* harmony default export */ __webpack_exports__["a"] = baseGetTag;


/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/* harmony default export */ __webpack_exports__["a"] = freeGlobal;

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(0)))

/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__overArg_js__ = __webpack_require__(25);


/** Built-in value references. */
var getPrototype = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__overArg_js__["a" /* default */])(Object.getPrototypeOf, Object);

/* harmony default export */ __webpack_exports__["a"] = getPrototype;


/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(2);


/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = getRawTag;


/***/ }),
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/* harmony default export */ __webpack_exports__["a"] = objectToString;


/***/ }),
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/* harmony default export */ __webpack_exports__["a"] = overArg;


/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__ = __webpack_require__(21);


/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__["a" /* default */] || freeSelf || Function('return this')();

/* harmony default export */ __webpack_exports__["a"] = root;


/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/* harmony default export */ __webpack_exports__["a"] = isObjectLike;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory){
  'use strict';

  /*istanbul ignore next:cant test*/
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else if (true) {
    // AMD. Register as an anonymous module.
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else {
    // Browser globals
    root.objectPath = factory();
  }
})(this, function(){
  'use strict';

  var
    toStr = Object.prototype.toString,
    _hasOwnProperty = Object.prototype.hasOwnProperty;

  function isEmpty(value){
    if (!value) {
      return true;
    }
    if (isArray(value) && value.length === 0) {
        return true;
    } else if (!isString(value)) {
        for (var i in value) {
            if (_hasOwnProperty.call(value, i)) {
                return false;
            }
        }
        return true;
    }
    return false;
  }

  function toString(type){
    return toStr.call(type);
  }

  function isNumber(value){
    return typeof value === 'number' || toString(value) === "[object Number]";
  }

  function isString(obj){
    return typeof obj === 'string' || toString(obj) === "[object String]";
  }

  function isObject(obj){
    return typeof obj === 'object' && toString(obj) === "[object Object]";
  }

  function isArray(obj){
    return typeof obj === 'object' && typeof obj.length === 'number' && toString(obj) === '[object Array]';
  }

  function isBoolean(obj){
    return typeof obj === 'boolean' || toString(obj) === '[object Boolean]';
  }

  function getKey(key){
    var intKey = parseInt(key);
    if (intKey.toString() === key) {
      return intKey;
    }
    return key;
  }

  function set(obj, path, value, doNotReplace){
    if (isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (isString(path)) {
      return set(obj, path.split('.').map(getKey), value, doNotReplace);
    }
    var currentPath = path[0];

    if (path.length === 1) {
      var oldVal = obj[currentPath];
      if (oldVal === void 0 || !doNotReplace) {
        obj[currentPath] = value;
      }
      return oldVal;
    }

    if (obj[currentPath] === void 0) {
      //check if we assume an array
      if(isNumber(path[1])) {
        obj[currentPath] = [];
      } else {
        obj[currentPath] = {};
      }
    }

    return set(obj[currentPath], path.slice(1), value, doNotReplace);
  }

  function del(obj, path) {
    if (isNumber(path)) {
      path = [path];
    }

    if (isEmpty(obj)) {
      return void 0;
    }

    if (isEmpty(path)) {
      return obj;
    }
    if(isString(path)) {
      return del(obj, path.split('.'));
    }

    var currentPath = getKey(path[0]);
    var oldVal = obj[currentPath];

    if(path.length === 1) {
      if (oldVal !== void 0) {
        if (isArray(obj)) {
          obj.splice(currentPath, 1);
        } else {
          delete obj[currentPath];
        }
      }
    } else {
      if (obj[currentPath] !== void 0) {
        return del(obj[currentPath], path.slice(1));
      }
    }

    return obj;
  }

  var objectPath = function(obj) {
    return Object.keys(objectPath).reduce(function(proxy, prop) {
      if (typeof objectPath[prop] === 'function') {
        proxy[prop] = objectPath[prop].bind(objectPath, obj);
      }

      return proxy;
    }, {});
  };

  objectPath.has = function (obj, path) {
    if (isEmpty(obj)) {
      return false;
    }

    if (isNumber(path)) {
      path = [path];
    } else if (isString(path)) {
      path = path.split('.');
    }

    if (isEmpty(path) || path.length === 0) {
      return false;
    }

    for (var i = 0; i < path.length; i++) {
      var j = path[i];
      if ((isObject(obj) || isArray(obj)) && _hasOwnProperty.call(obj, j)) {
        obj = obj[j];
      } else {
        return false;
      }
    }

    return true;
  };

  objectPath.ensureExists = function (obj, path, value){
    return set(obj, path, value, true);
  };

  objectPath.set = function (obj, path, value, doNotReplace){
    return set(obj, path, value, doNotReplace);
  };

  objectPath.insert = function (obj, path, value, at){
    var arr = objectPath.get(obj, path);
    at = ~~at;
    if (!isArray(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }
    arr.splice(at, 0, value);
  };

  objectPath.empty = function(obj, path) {
    if (isEmpty(path)) {
      return obj;
    }
    if (isEmpty(obj)) {
      return void 0;
    }

    var value, i;
    if (!(value = objectPath.get(obj, path))) {
      return obj;
    }

    if (isString(value)) {
      return objectPath.set(obj, path, '');
    } else if (isBoolean(value)) {
      return objectPath.set(obj, path, false);
    } else if (isNumber(value)) {
      return objectPath.set(obj, path, 0);
    } else if (isArray(value)) {
      value.length = 0;
    } else if (isObject(value)) {
      for (i in value) {
        if (_hasOwnProperty.call(value, i)) {
          delete value[i];
        }
      }
    } else {
      return objectPath.set(obj, path, null);
    }
  };

  objectPath.push = function (obj, path /*, values */){
    var arr = objectPath.get(obj, path);
    if (!isArray(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }

    arr.push.apply(arr, Array.prototype.slice.call(arguments, 2));
  };

  objectPath.coalesce = function (obj, paths, defaultValue) {
    var value;

    for (var i = 0, len = paths.length; i < len; i++) {
      if ((value = objectPath.get(obj, paths[i])) !== void 0) {
        return value;
      }
    }

    return defaultValue;
  };

  objectPath.get = function (obj, path, defaultValue){
    if (isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (isEmpty(obj)) {
      return defaultValue;
    }
    if (isString(path)) {
      return objectPath.get(obj, path.split('.'), defaultValue);
    }

    var currentPath = getKey(path[0]);

    if (path.length === 1) {
      if (obj[currentPath] === void 0) {
        return defaultValue;
      }
      return obj[currentPath];
    }

    return objectPath.get(obj[currentPath], path.slice(1), defaultValue);
  };

  objectPath.del = function(obj, path) {
    return del(obj, path);
  };

  return objectPath;
});


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, global) {var __WEBPACK_AMD_DEFINE_RESULT__;/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		true
	) {
		!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
			return punycode;
		}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(8)(module), __webpack_require__(0)))

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.decode = exports.parse = __webpack_require__(30);
exports.encode = exports.stringify = __webpack_require__(31);


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var has = Object.prototype.hasOwnProperty;

/**
 * Simple query string parser.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object}
 * @api public
 */
function querystring(query) {
  var parser = /([^=?&]+)=?([^&]*)/g
    , result = {}
    , part;

  //
  // Little nifty parsing hack, leverage the fact that RegExp.exec increments
  // the lastIndex property so we can continue executing this loop until we've
  // parsed all results.
  //
  for (;
    part = parser.exec(query);
    result[decodeURIComponent(part[1])] = decodeURIComponent(part[2])
  );

  return result;
}

/**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
function querystringify(obj, prefix) {
  prefix = prefix || '';

  var pairs = [];

  //
  // Optionally prefix with a '?' if needed
  //
  if ('string' !== typeof prefix) prefix = '?';

  for (var key in obj) {
    if (has.call(obj, key)) {
      pairs.push(encodeURIComponent(key) +'='+ encodeURIComponent(obj[key]));
    }
  }

  return pairs.length ? prefix + pairs.join('&') : '';
}

//
// Expose the module.
//
exports.stringify = querystringify;
exports.parse = querystring;


/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__compose__ = __webpack_require__(5);
/* harmony export (immutable) */ __webpack_exports__["a"] = applyMiddleware;
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };



/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
function applyMiddleware() {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (createStore) {
    return function (reducer, preloadedState, enhancer) {
      var store = createStore(reducer, preloadedState, enhancer);
      var _dispatch = store.dispatch;
      var chain = [];

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch(action) {
          return _dispatch(action);
        }
      };
      chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = __WEBPACK_IMPORTED_MODULE_0__compose__["a" /* default */].apply(undefined, chain)(store.dispatch);

      return _extends({}, store, {
        dispatch: _dispatch
      });
    };
  };
}

/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = bindActionCreators;
function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  var keys = Object.keys(actionCreators);
  var boundActionCreators = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var actionCreator = actionCreators[key];
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}

/***/ }),
/* 36 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__createStore__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash_es_isPlainObject__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils_warning__ = __webpack_require__(7);
/* harmony export (immutable) */ __webpack_exports__["a"] = combineReducers;




function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

  return 'Given action ' + actionName + ', reducer "' + key + '" returned undefined. ' + 'To ignore an action, you must explicitly return the previous state.';
}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers);
  var argumentName = action && action.type === __WEBPACK_IMPORTED_MODULE_0__createStore__["b" /* ActionTypes */].INIT ? 'preloadedState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_lodash_es_isPlainObject__["a" /* default */])(inputState)) {
    return 'The ' + argumentName + ' has unexpected type of "' + {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] + '". Expected argument to be an object with the following ' + ('keys: "' + reducerKeys.join('", "') + '"');
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key];
  });

  unexpectedKeys.forEach(function (key) {
    unexpectedKeyCache[key] = true;
  });

  if (unexpectedKeys.length > 0) {
    return 'Unexpected ' + (unexpectedKeys.length > 1 ? 'keys' : 'key') + ' ' + ('"' + unexpectedKeys.join('", "') + '" found in ' + argumentName + '. ') + 'Expected to find one of the known reducer keys instead: ' + ('"' + reducerKeys.join('", "') + '". Unexpected keys will be ignored.');
  }
}

function assertReducerSanity(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, { type: __WEBPACK_IMPORTED_MODULE_0__createStore__["b" /* ActionTypes */].INIT });

    if (typeof initialState === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined.');
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type: type }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + __WEBPACK_IMPORTED_MODULE_0__createStore__["b" /* ActionTypes */].INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined.');
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */
function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers);
  var finalReducers = {};
  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i];

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils_warning__["a" /* default */])('No reducer provided for key "' + key + '"');
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }
  var finalReducerKeys = Object.keys(finalReducers);

  if (process.env.NODE_ENV !== 'production') {
    var unexpectedKeyCache = {};
  }

  var sanityError;
  try {
    assertReducerSanity(finalReducers);
  } catch (e) {
    sanityError = e;
  }

  return function combination() {
    var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var action = arguments[1];

    if (sanityError) {
      throw sanityError;
    }

    if (process.env.NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
      if (warningMessage) {
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils_warning__["a" /* default */])(warningMessage);
      }
    }

    var hasChanged = false;
    var nextState = {};
    for (var i = 0; i < finalReducerKeys.length; i++) {
      var key = finalReducerKeys[i];
      var reducer = finalReducers[key];
      var previousStateForKey = state[key];
      var nextStateForKey = reducer(previousStateForKey, action);
      if (typeof nextStateForKey === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    return hasChanged ? nextState : state;
  };
}
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(4)))

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Check if we're required to add a port number.
 *
 * @see https://url.spec.whatwg.org/#default-port
 * @param {Number|String} port Port number we need to check
 * @param {String} protocol Protocol we need to check against.
 * @returns {Boolean} Is it a default port for the given protocol
 * @api private
 */
module.exports = function required(port, protocol) {
  protocol = protocol.split(':')[0];
  port = +port;

  if (!port) return false;

  switch (protocol) {
    case 'http':
    case 'ws':
    return port !== 80;

    case 'https':
    case 'wss':
    return port !== 443;

    case 'ftp':
    return port !== 21;

    case 'gopher':
    return port !== 70;

    case 'file':
    return false;
  }

  return port !== 0;
};


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(39);


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, module) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ponyfill = __webpack_require__(40);

var _ponyfill2 = _interopRequireDefault(_ponyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var root; /* global window */


if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (true) {
  root = module;
} else {
  root = Function('return this')();
}

var result = (0, _ponyfill2['default'])(root);
exports['default'] = result;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0), __webpack_require__(8)(module)))

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});
exports['default'] = symbolObservablePonyfill;
function symbolObservablePonyfill(root) {
	var result;
	var _Symbol = root.Symbol;

	if (typeof _Symbol === 'function') {
		if (_Symbol.observable) {
			result = _Symbol.observable;
		} else {
			result = _Symbol('observable');
			_Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
};

/***/ }),
/* 41 */
/***/ (function(module, exports) {

module.exports = [
	{
		"title": "aa",
		"url": "https://www.aa.com/",
		"image_url": "aa-com.png",
		"background_color": "#FAFAFA",
		"domain": "aa.com"
	},
	{
		"title": "abcnews.go",
		"url": "http://abcnews.go.com/",
		"image_url": "abcnews-go-com.png",
		"background_color": "#FFF",
		"domain": "abcnews.go.com"
	},
	{
		"title": "about",
		"url": "http://www.about.com/",
		"image_url": "about-com.png",
		"background_color": "#FFF",
		"domain": "about.com"
	},
	{
		"title": "accuweather",
		"url": "http://www.accuweather.com/",
		"image_url": "accuweather-com.png",
		"background_color": "#f56b17",
		"domain": "accuweather.com"
	},
	{
		"title": "adobe",
		"url": "http://www.adobe.com/",
		"image_url": "adobe-com.png",
		"background_color": "#e22919",
		"domain": "adobe.com"
	},
	{
		"title": "adp",
		"url": "http://www.adp.com/",
		"image_url": "adp-com.png",
		"background_color": "#f02311",
		"domain": "adp.com"
	},
	{
		"title": "airbnb",
		"url": "https://www.airbnb.com/",
		"image_url": "airbnb-com.png",
		"background_color": "#ff585a",
		"domain": "airbnb.com"
	},
	{
		"title": "allrecipes",
		"url": "http://allrecipes.com/",
		"image_url": "allrecipes-com.png",
		"background_color": "#ffb333",
		"domain": "allrecipes.com"
	},
	{
		"title": "amazon",
		"url": "http://www.amazon.com/",
		"image_url": "amazon-com.png",
		"background_color": "#FFF",
		"domain": "amazon.com"
	},
	{
		"title": "americanexpress",
		"url": "https://www.americanexpress.com",
		"image_url": "americanexpress-com.png",
		"background_color": "#e0e0e0",
		"domain": "americanexpress.com"
	},
	{
		"title": "ancestry",
		"url": "http://www.ancestry.com/",
		"image_url": "ancestry-com.png",
		"background_color": "#9bbf2f",
		"domain": "ancestry.com"
	},
	{
		"title": "answers",
		"url": "http://www.answers.com",
		"image_url": "answers-com.png",
		"background_color": "#3c67d5",
		"domain": "answers.com"
	},
	{
		"title": "aol",
		"url": "http://www.aol.com/",
		"image_url": "aol-com.png",
		"background_color": "#e0e0e0",
		"domain": "aol.com"
	},
	{
		"title": "apple",
		"url": "http://www.apple.com/",
		"image_url": "apple-com.png",
		"background_color": "#6d6e71",
		"domain": "apple.com"
	},
	{
		"title": "ask.com",
		"url": "http://www.ask.com",
		"image_url": "ask-com.png",
		"background_color": "#cf0000",
		"domain": "ask.com"
	},
	{
		"title": "att",
		"url": "https://www.att.com/",
		"image_url": "att-com.png",
		"background_color": "#5ba1ca",
		"domain": "att.com"
	},
	{
		"title": "aws.amazon",
		"url": "https://aws.amazon.com/",
		"image_url": "amazonaws-com.png",
		"background_color": "#FFF",
		"domain": "aws.amazon.com"
	},
	{
		"title": "baidu",
		"url": "http://baidu.com/",
		"image_url": "baidu-com.png",
		"background_color": "#c33302",
		"domain": "baidu.com"
	},
	{
		"title": "bankofamerica",
		"url": "https://www.bankofamerica.com",
		"image_url": "bankofamerica-com.png",
		"background_color": "#eb3146",
		"domain": "bankofamerica.com"
	},
	{
		"title": "bbc",
		"url": "http://www.bbc.com/",
		"image_url": "bbc-com.png",
		"background_color": "#000000",
		"domain": "bbc.com"
	},
	{
		"title": "bestbuy",
		"url": "http://www.bestbuy.com",
		"image_url": "bestbuy-com.png",
		"background_color": "#003a65",
		"domain": "bestbuy.com"
	},
	{
		"title": "bing",
		"url": "http://www.bing.com/",
		"image_url": "bing-com.png",
		"background_color": "#138484",
		"domain": "bing.com"
	},
	{
		"title": "blackboard",
		"url": "http://www.blackboard.com/",
		"image_url": "blackboard-com.png",
		"background_color": "#e6e6e6",
		"domain": "blackboard.com"
	},
	{
		"title": "bleacherreport",
		"url": "http://bleacherreport.com/",
		"image_url": "bleacherreport-com.png",
		"background_color": "#ec412e",
		"domain": "bleacherreport.com"
	},
	{
		"title": "blogger",
		"url": "https://www.blogger.com/home",
		"image_url": "blogger-com.png",
		"background_color": "#ff8822",
		"domain": "blogger.com"
	},
	{
		"title": "box",
		"url": "https://www.box.com/",
		"image_url": "box-com.png",
		"background_color": "#4daee8",
		"domain": "box.com"
	},
	{
		"title": "businessinsider",
		"url": "http://www.businessinsider.com",
		"image_url": "businessinsider-com.png",
		"background_color": "#1d5b7d",
		"domain": "businessinsider.com"
	},
	{
		"title": "buzzfeed",
		"url": "http://www.buzzfeed.com/index",
		"image_url": "buzzfeed-com.png",
		"background_color": "#ee3322",
		"domain": "buzzfeed.com"
	},
	{
		"title": "buzzlie",
		"url": "http://buzzlie.com/",
		"image_url": "buzzlie-com.png",
		"background_color": "#ff68b6",
		"domain": "buzzlie.com"
	},
	{
		"title": "California",
		"url": "http://ca.gov/",
		"image_url": "ca-gov.png",
		"background_color": "#000201",
		"domain": "ca.gov"
	},
	{
		"title": "capitalone",
		"url": "https://www.capitalone.com/",
		"image_url": "capitalone-com.png",
		"background_color": "#303e4f",
		"domain": "capitalone.com"
	},
	{
		"title": "cbsnews",
		"url": "http://www.cbsnews.com/",
		"image_url": "cbsnews-com.png",
		"background_color": "#000",
		"domain": "cbsnews.com"
	},
	{
		"title": "cbssports",
		"url": "http://www.cbssports.com/",
		"image_url": "cbssports-com.png",
		"background_color": "#014a8f",
		"domain": "cbssports.com"
	},
	{
		"title": "chase",
		"url": "https://www.chase.com",
		"image_url": "chase-com.png",
		"background_color": "#0d68c1",
		"domain": "chase.com"
	},
	{
		"title": "cnet",
		"url": "http://www.cnet.com/",
		"image_url": "cnet-com.png",
		"background_color": "#FFF",
		"domain": "cnet.com"
	},
	{
		"title": "cnn",
		"url": "http://www.cnn.com",
		"image_url": "cnn-com.png",
		"background_color": "#d41c1e",
		"domain": "cnn.com"
	},
	{
		"title": "comcast",
		"urls": [
			"http://www.comcast.net/",
			"http://www.xfinity.com/"
		],
		"image_url": "xfinity-com.png",
		"background_color": "#000",
		"domain": "comcast.net"
	},
	{
		"title": "conservativetribune",
		"url": "http://conservativetribune.com/",
		"image_url": "conservativetribune-com.png",
		"background_color": "#ae0001",
		"domain": "conservativetribune.com"
	},
	{
		"title": "costco",
		"url": "http://www.costco.com/",
		"image_url": "costco-com.png",
		"background_color": "#005bad",
		"domain": "costco.com"
	},
	{
		"title": "craigslist",
		"url": "http://craigslist.org/",
		"image_url": "craigslist-org.png",
		"background_color": "#652892",
		"domain": "craigslist.org"
	},
	{
		"title": "dailymail",
		"url": "http://www.dailymail.co.uk/",
		"image_url": "dailymail-co-uk.png",
		"background_color": "#0064c1",
		"domain": "dailymail.co.uk"
	},
	{
		"title": "dailybeast",
		"url": "https://www.thedailybeast.com/",
		"image_url": "dailybeast-com.png",
		"background_color": "#f12c15",
		"domain": "dailybeast.com"
	},
	{
		"title": "delta",
		"url": "https://www.delta.com/",
		"image_url": "delta-com.png",
		"background_color": "#1d649e",
		"domain": "delta.com"
	},
	{
		"title": "deviantart",
		"url": "http://www.deviantart.com/",
		"image_url": "deviantart-com.png",
		"background_color": "#00ce3e",
		"domain": "deviantart.com"
	},
	{
		"title": "digg",
		"url": "http://digg.com/",
		"image_url": "digg-com.png",
		"background_color": "#000",
		"domain": "digg.com"
	},
	{
		"title": "diply",
		"url": "http://diply.com/",
		"image_url": "diply-com.png",
		"background_color": "#2168b3",
		"domain": "diply.com"
	},
	{
		"title": "discover",
		"urls": [
			"https://www.discover.com/",
			"https://www.discovercard.com/"
		],
		"image_url": "discovercard-com.png",
		"background_color": "#d6d6d6",
		"domain": "discover.com"
	},
	{
		"title": "dropbox",
		"url": "https://www.dropbox.com/",
		"image_url": "dropbox-com.png",
		"background_color": "#007fe2",
		"domain": "dropbox.com"
	},
	{
		"title": "drudgereport",
		"url": "http://drudgereport.com/",
		"image_url": "drudgereport-com.png",
		"background_color": "#FFF",
		"domain": "drudgereport.com"
	},
	{
		"title": "ebates",
		"url": "http://www.ebates.com/",
		"image_url": "ebates-com.png",
		"background_color": "#14af44",
		"domain": "ebates.com"
	},
	{
		"title": "ebay",
		"url": "http://www.ebay.com",
		"image_url": "ebay-com.png",
		"background_color": "#ededed",
		"domain": "ebay.com"
	},
	{
		"title": "espn.go",
		"url": "http://espn.go.com",
		"image_url": "espn-go-com.png",
		"background_color": "#4b4b4b",
		"domain": "espn.go.com"
	},
	{
		"title": "etsy",
		"url": "https://www.etsy.com/",
		"image_url": "etsy-com.png",
		"background_color": "#f76300",
		"domain": "etsy.com"
	},
	{
		"title": "eventbrite",
		"url": "https://www.eventbrite.com/",
		"image_url": "eventbrite-com.png",
		"background_color": "#ff8000",
		"domain": "eventbrite.com"
	},
	{
		"title": "expedia",
		"url": "https://www.expedia.com/",
		"image_url": "expedia-com.png",
		"background_color": "#003460",
		"domain": "expedia.com"
	},
	{
		"title": "facebook",
		"url": "https://www.facebook.com/",
		"image_url": "facebook-com.png",
		"background_color": "#3b5998",
		"domain": "facebook.com"
	},
	{
		"title": "faithtap",
		"url": "http://faithtap.com/",
		"image_url": "faithtap-com.png",
		"background_color": "#4c286f",
		"domain": "faithtap.com"
	},
	{
		"title": "fedex",
		"url": "http://www.fedex.com/",
		"image_url": "fedex-com.png",
		"background_color": "#391675",
		"domain": "fedex.com"
	},
	{
		"title": "feedly",
		"url": "http://feedly.com/",
		"image_url": "feedly-com.png",
		"background_color": "#20b447",
		"domain": "feedly.com"
	},
	{
		"title": "fitbit",
		"url": "https://www.fitbit.com/",
		"image_url": "fitbit-com.png",
		"background_color": "#00b0ba",
		"domain": "fitbit.com"
	},
	{
		"title": "flickr",
		"url": "https://www.flickr.com",
		"image_url": "flickr-com.png",
		"background_color": "#dcdcdc",
		"domain": "flickr.com"
	},
	{
		"title": "foodnetwork",
		"url": "http://www.foodnetwork.com/",
		"image_url": "foodnetwork-com.png",
		"background_color": "#f50024",
		"domain": "foodnetwork.com"
	},
	{
		"title": "forbes",
		"url": "http://www.forbes.com/",
		"image_url": "forbes-com.png",
		"background_color": "#4177ab",
		"domain": "forbes.com"
	},
	{
		"title": "foxnews",
		"url": "http://www.foxnews.com",
		"image_url": "foxnews-com.png",
		"background_color": "#9e0b0f",
		"domain": "foxnews.com"
	},
	{
		"title": "gap",
		"url": "http://www.gap.com/",
		"image_url": "gap-com.png",
		"background_color": "#002861",
		"domain": "gap.com"
	},
	{
		"title": "gawker",
		"url": "http://gawker.com/",
		"image_url": "gawker-com.png",
		"background_color": "#d75343",
		"domain": "gawker.com"
	},
	{
		"title": "gfycat",
		"url": "http://gfycat.com/",
		"image_url": "gfycat-com.png",
		"background_color": "#eaeaea",
		"domain": "gfycat.com"
	},
	{
		"title": "GitHub",
		"url": "https://github.com/",
		"image_url": "github-com.png",
		"background_color": "#000",
		"domain": "github.com"
	},
	{
		"title": "gizmodo",
		"url": "http://gizmodo.com/",
		"image_url": "gizmodo-com.png",
		"background_color": "#000",
		"domain": "gizmodo.com"
	},
	{
		"title": "glassdoor",
		"url": "https://www.glassdoor.com/",
		"image_url": "glassdoor-com.png",
		"background_color": "#7aad28",
		"domain": "glassdoor.com"
	},
	{
		"title": "go",
		"url": "http://go.com",
		"image_url": "go-com.png",
		"background_color": "#000",
		"domain": ".com"
	},
	{
		"title": "goodreads",
		"url": "http://www.goodreads.com/",
		"image_url": "goodreads-com.png",
		"background_color": "#382110",
		"domain": "goodreads.com"
	},
	{
		"title": "google",
		"url": "https://www.google.com/",
		"image_url": "google-com.png",
		"background_color": "#FFF",
		"domain": "google.com"
	},
	{
		"title": "admin.google",
		"url": "https://admin.google.com/",
		"image_url": "google-admin.png",
		"background_color": "#FFF",
		"domain": "admin.google.com"
	},
	{
		"title": "calendar.google",
		"url": "https://calendar.google.com/",
		"image_url": "google-calendar.png",
		"background_color": "#FFF",
		"domain": "calendar.google.com"
	},
	{
		"title": "contacts.google",
		"url": "https://contacts.google.com/",
		"image_url": "google-contacts.png",
		"background_color": "#FFF",
		"domain": "contacts.google.com"
	},
	{
		"title": "docs.google",
		"url": "https://docs.google.com/",
		"image_url": "google-docs.png",
		"background_color": "#FFF",
		"domain": "docs.google.com"
	},
	{
		"title": "drive.google",
		"url": "https://drive.google.com/",
		"image_url": "google-drive.png",
		"background_color": "#FFF",
		"domain": "drive.google.com"
	},
	{
		"title": "forms.google",
		"url": "https://forms.google.com/",
		"image_url": "google-forms.png",
		"background_color": "#FFF",
		"domain": "forms.google.com"
	},
	{
		"title": "gmail",
		"urls": [
			"https://mail.google.com/",
			"https://gmail.com"
		],
		"image_url": "google-gmail.png",
		"background_color": "#FFF",
		"domain": "mail.google.com"
	},
	{
		"title": "groups.google",
		"url": "https://groups.google.com/",
		"image_url": "google-groups.png",
		"background_color": "#FFF",
		"domain": "groups.google.com"
	},
	{
		"title": "hangouts.google",
		"url": "https://hangouts.google.com/",
		"image_url": "google-hangouts.png",
		"background_color": "#FFF",
		"domain": "hangouts.google.com"
	},
	{
		"title": "plus.google",
		"url": "https://plus.google.com/",
		"image_url": "google-plus.png",
		"background_color": "#FFF",
		"domain": "plus.google.com"
	},
	{
		"title": "sheets.google",
		"url": "https://sheets.google.com/",
		"image_url": "google-sheets.png",
		"background_color": "#FFF",
		"domain": "sheets.google.com"
	},
	{
		"title": "sites.google",
		"url": "https://sites.google.com/",
		"image_url": "google-sites.png",
		"background_color": "#FFF",
		"domain": "sites.google.com"
	},
	{
		"title": "slides.google",
		"url": "https://slides.google.com/",
		"image_url": "google-slides.png",
		"background_color": "#FFF",
		"domain": "slides.google.com"
	},
	{
		"title": "photos.google",
		"url": "https://photos.google.com/",
		"image_url": "google-photos.png",
		"background_color": "#FFF",
		"domain": "photos.google.com"
	},
	{
		"title": "images.google",
		"url": "https://images.google.com/",
		"image_url": "images-google-com.png",
		"background_color": "#FFF",
		"domain": "images.google.com"
	},
	{
		"title": "groupon",
		"url": "https://www.groupon.com/",
		"image_url": "groupon-com.png",
		"background_color": "#53a318",
		"domain": "groupon.com"
	},
	{
		"title": "homedepot",
		"url": "http://www.homedepot.com/",
		"image_url": "homedepot-com.png",
		"background_color": "#f7d5a4",
		"domain": "homedepot.com"
	},
	{
		"title": "houzz",
		"url": "https://www.houzz.com/",
		"image_url": "houzz-com.png",
		"background_color": "#52a02a",
		"domain": "houzz.com"
	},
	{
		"title": "huffingtonpost",
		"url": "http://www.huffingtonpost.com/",
		"image_url": "huffingtonpost-com.png",
		"background_color": "#7dbdb8",
		"domain": "huffingtonpost.com"
	},
	{
		"title": "hulu",
		"url": "http://www.hulu.com/",
		"image_url": "hulu-com.png",
		"background_color": "#97c64f",
		"domain": "hulu.com"
	},
	{
		"title": "ign",
		"url": "http://www.ign.com/",
		"image_url": "ign-com.png",
		"background_color": "#ff0000",
		"domain": "ign.com"
	},
	{
		"title": "ikea",
		"url": "http://www.ikea.com/",
		"image_url": "ikea-com.png",
		"background_color": "#00329c",
		"domain": "ikea.com"
	},
	{
		"title": "imdb",
		"url": "http://www.imdb.com/",
		"image_url": "imdb-com.png",
		"background_color": "#ffd100",
		"domain": "imdb.com"
	},
	{
		"title": "imgur",
		"url": "http://imgur.com/",
		"image_url": "imgur-com.png",
		"background_color": "#2a2c25",
		"domain": "imgur.com"
	},
	{
		"title": "instagram",
		"url": "https://www.instagram.com/",
		"image_url": "instagram-com.png",
		"background_color": "#0b558a",
		"domain": "instagram.com"
	},
	{
		"title": "instructure",
		"url": "https://www.instructure.com/",
		"image_url": "instructure-com.png",
		"background_color": "#efefef",
		"domain": "instructure.com"
	},
	{
		"title": "intuit",
		"url": "http://www.intuit.com/",
		"image_url": "intuit-com.png",
		"background_color": "#f6f6f6",
		"domain": "intuit.com"
	},
	{
		"title": "irs",
		"url": "https://www.irs.gov/",
		"image_url": "irs-gov.png",
		"background_color": "#efefef",
		"domain": "irs.gov"
	},
	{
		"title": "invision",
		"urls": [
			"https://www.invisionapp.com/",
			"https://mozilla.invisionapp.com/"
		],
		"image_url": "invision-com.png",
		"background_color": "#ff2e63",
		"domain": "invisionapp.com"
	},
	{
		"title": "jcpenney",
		"url": "http://www.jcpenney.com/",
		"image_url": "jcpenney-com.png",
		"background_color": "#fa0026",
		"domain": "jcpenney.com"
	},
	{
		"title": "jd",
		"url": "http://www.jd.com/",
		"image_url": "jd-com.png",
		"background_color": "#e50000",
		"domain": "jd.com"
	},
	{
		"title": "kayak",
		"url": "https://www.kayak.com/",
		"image_url": "kayak-com.png",
		"background_color": "#fff",
		"domain": "kayak.com"
	},
	{
		"title": "kohl's",
		"url": "http://www.kohls.com",
		"image_url": "kohls-com.png",
		"background_color": "#000",
		"domain": "kohls.com"
	},
	{
		"title": "latimes",
		"url": "http://www.latimes.com/",
		"image_url": "latimes-com.png",
		"background_color": "#FFF",
		"domain": "latimes.com"
	},
	{
		"title": "lifehacker",
		"url": "http://lifehacker.com/",
		"image_url": "lifehacker-com.png",
		"background_color": "#94b330",
		"domain": "lifehacker.com"
	},
	{
		"title": "linkedin",
		"url": "https://www.linkedin.com/",
		"image_url": "linkedin-com.png",
		"background_color": "#00659b",
		"domain": "linkedin.com"
	},
	{
		"title": "lowes",
		"url": "http://www.lowes.com/",
		"image_url": "lowes-com.png",
		"background_color": "#004793",
		"domain": "lowes.com"
	},
	{
		"title": "macys",
		"url": "http://www.macys.com/",
		"image_url": "macys-com.png",
		"background_color": "#ea0000",
		"domain": "macys.com"
	},
	{
		"title": "login.microsoftonline",
		"url": "https://login.microsoftonline.com/",
		"image_url": "microsoftonline-com.png",
		"background_color": "#ce4f00",
		"domain": "login.microsoftonline.com"
	},
	{
		"title": "mail.live",
		"url": "https://mail.live.com",
		"image_url": "live-com.png",
		"background_color": "#0070c9",
		"domain": "mail.live.com"
	},
	{
		"title": "mapquest",
		"url": "http://www.mapquest.com/",
		"image_url": "mapquest-com.png",
		"background_color": "#373737",
		"domain": "mapquest.com"
	},
	{
		"title": "mashable",
		"url": "http://mashable.com/stories/",
		"image_url": "mashable-com.png",
		"background_color": "#00aef0",
		"domain": "mashable.com"
	},
	{
		"title": "microsoft",
		"url": "http://www.microsoft.com/",
		"image_url": "microsoft-com.png",
		"background_color": "#FFF",
		"domain": "microsoft.com"
	},
	{
		"title": "mlb",
		"url": "http://mlb.mlb.com/",
		"image_url": "mlb-com.png",
		"background_color": "#ffffff",
		"domain": "mlb.com"
	},
	{
		"title": "msn",
		"url": "http://www.msn.com/",
		"image_url": "msn-com.png",
		"background_color": "#000",
		"domain": "msn.com"
	},
	{
		"title": "nbcnews",
		"url": "http://www.nbcnews.com/",
		"image_url": "nbcnews-com.png",
		"background_color": "#003a51",
		"domain": "nbcnews.com"
	},
	{
		"title": "netflix",
		"url": "https://www.netflix.com/",
		"image_url": "netflix-com.png",
		"background_color": "#000",
		"domain": "netflix.com"
	},
	{
		"title": "newegg",
		"url": "http://www.newegg.com/",
		"image_url": "newegg-com.png",
		"background_color": "#cecece",
		"domain": "newegg.com"
	},
	{
		"title": "news.ycombinator",
		"url": "https://news.ycombinator.com/",
		"image_url": "news-ycombinator-com.png",
		"background_color": "#D46D1D",
		"domain": "news.ycombinator.com"
	},
	{
		"title": "nih",
		"url": "http://www.nih.gov/",
		"image_url": "nih-gov.png",
		"background_color": "#efefef",
		"domain": "nih.gov"
	},
	{
		"title": "nordstrom",
		"url": "http://shop.nordstrom.com/",
		"image_url": "nordstrom-com.png",
		"background_color": "#7f7d7a",
		"domain": "nordstrom.com"
	},
	{
		"title": "npr",
		"url": "http://www.npr.org/",
		"image_url": "npr-org.png",
		"background_color": "#FFF",
		"domain": "npr.org"
	},
	{
		"title": "nypost",
		"url": "http://nypost.com/",
		"image_url": "nypost-com.png",
		"background_color": "#FFF",
		"domain": "nypost.com"
	},
	{
		"title": "nytimes",
		"url": "http://www.nytimes.com",
		"image_url": "nytimes-com.png",
		"background_color": "#FFF",
		"domain": "nytimes.com"
	},
	{
		"title": "office",
		"url": "https://www.office.com/",
		"image_url": "office-com.png",
		"background_color": "#000",
		"domain": "office.com"
	},
	{
		"title": "online.citi",
		"url": "https://online.citi.com/",
		"image_url": "citi-com.png",
		"background_color": "#FFF",
		"domain": "online.citi.com"
	},
	{
		"title": "overstock",
		"url": "http://www.overstock.com/",
		"image_url": "overstock-com.png",
		"background_color": "#fff",
		"domain": "overstock.com"
	},
	{
		"title": "pandora",
		"url": "http://www.pandora.com/",
		"image_url": "pandora-com.png",
		"background_color": "#efefef",
		"domain": "pandora.com"
	},
	{
		"title": "Patch",
		"url": "http://patch.com",
		"image_url": "patch-com.png",
		"background_color": "#519442",
		"domain": "patch.com"
	},
	{
		"title": "paypal",
		"url": "https://www.paypal.com/home",
		"image_url": "paypal-com.png",
		"background_color": "#009cde",
		"domain": "paypal.com"
	},
	{
		"title": "people.com",
		"url": "http://www.people.com/",
		"image_url": "people-com.png",
		"background_color": "#27c4ff",
		"domain": "people.com"
	},
	{
		"title": "pinterest",
		"url": "https://www.pinterest.com/",
		"image_url": "pinterest-com.png",
		"background_color": "#ba212b",
		"domain": "pinterest.com"
	},
	{
		"title": "politico",
		"url": "http://www.politico.com/",
		"image_url": "politico-com.png",
		"background_color": "#9f0000",
		"domain": "politico.com"
	},
	{
		"title": "quora",
		"url": "https://www.quora.com/",
		"image_url": "quora-com.png",
		"background_color": "#bb2920",
		"domain": "quora.com"
	},
	{
		"title": "qq",
		"url": "https://www.qq.com/",
		"image_url": "qq-com.png",
		"background_color": "#2d91da",
		"domain": "qq.com"
	},
	{
		"title": "realtor",
		"url": "http://www.realtor.com/",
		"image_url": "realtor-com.png",
		"background_color": "#fcfcfc",
		"domain": "realtor.com"
	},
	{
		"title": "reddit",
		"url": "https://www.reddit.com/",
		"image_url": "reddit-com.png",
		"background_color": "#cee3f8",
		"domain": "reddit.com"
	},
	{
		"title": "salesforce",
		"url": "http://www.salesforce.com/",
		"image_url": "salesforce-com.png",
		"background_color": "#efefef",
		"domain": "salesforce.com"
	},
	{
		"title": "sears",
		"url": "http://www.sears.com/",
		"image_url": "sears-com.png",
		"background_color": "#00265a",
		"domain": "sears.com"
	},
	{
		"title": "sina",
		"url": "http://www.sina.com/",
		"image_url": "sina-com.png",
		"background_color": "#ff0000",
		"domain": "sina.com"
	},
	{
		"title": "slate",
		"url": "http://www.slate.com/",
		"image_url": "slate-com.png",
		"background_color": "#670033",
		"domain": "slate.com"
	},
	{
		"title": "slickdeals",
		"url": "http://slickdeals.net",
		"image_url": "slickdeals-net.png",
		"background_color": "#0072bd",
		"domain": "slickdeals.net"
	},
	{
		"title": "soundcloud",
		"url": "https://soundcloud.com/",
		"image_url": "soundcloud-com.png",
		"background_color": "#F95300",
		"domain": "soundcloud.com"
	},
	{
		"title": "southwest",
		"url": "https://www.southwest.com/",
		"image_url": "southwest-com.png",
		"background_color": "#3452c1",
		"domain": "southwest.com"
	},
	{
		"title": "spotify",
		"url": "https://www.spotify.com/",
		"image_url": "spotify-com.png",
		"background_color": "#dd08a7",
		"domain": "spotify.com"
	},
	{
		"title": "stackexchange",
		"url": "http://stackexchange.com/",
		"image_url": "stackexchange-com.png",
		"background_color": "#fff",
		"domain": "stackexchange.com"
	},
	{
		"title": "stackoverflow",
		"url": "http://stackoverflow.com/",
		"image_url": "stackoverflow-com.png",
		"background_color": "#f48024",
		"domain": "stackoverflow.com"
	},
	{
		"title": "staples",
		"url": "http://www.staples.com/",
		"image_url": "staples-com.png",
		"background_color": "#F3F1F3",
		"domain": "staples.com"
	},
	{
		"title": "strava",
		"url": "http://www.strava.com/",
		"image_url": "strava-com.png",
		"background_color": "#ff4b00",
		"domain": "strava.com"
	},
	{
		"title": "surveymonkey",
		"url": "https://www.surveymonkey.com/",
		"image_url": "surveymonkey-com.png",
		"background_color": "#a6c32f",
		"domain": "surveymonkey.com"
	},
	{
		"title": "swagbucks",
		"url": "http://www.swagbucks.com/",
		"image_url": "swagbucks-com.png",
		"background_color": "#5fb5d6",
		"domain": "swagbucks.com"
	},
	{
		"title": "talkingpointsmemo",
		"url": "http://talkingpointsmemo.com/",
		"image_url": "talkingpointsmemo-com.png",
		"background_color": "#FFF",
		"domain": "talkingpointsmemo.com"
	},
	{
		"title": "t-mobile",
		"url": "http://www.t-mobile.com/",
		"image_url": "t-mobile-com.png",
		"background_color": "#f32f9d",
		"domain": "t-mobile.com"
	},
	{
		"title": "taboola",
		"url": "https://www.taboola.com/",
		"image_url": "taboola-com.png",
		"background_color": "#1761a8",
		"domain": "taboola.com"
	},
	{
		"title": "taobao",
		"url": "https://www.taobao.com/",
		"image_url": "taobao-com.png",
		"background_color": "#ff8300",
		"domain": "taobao.com"
	},
	{
		"title": "target",
		"url": "http://www.target.com",
		"image_url": "target-com.png",
		"background_color": "#e81530",
		"domain": "target.com"
	},
	{
		"title": "thedailybeast",
		"url": "http://www.thedailybeast.com/",
		"image_url": "thedailybeast-com.png",
		"background_color": "#f12c15",
		"domain": "thedailybeast.com"
	},
	{
		"title": "theguardian",
		"url": "http://www.theguardian.com/",
		"image_url": "theguardian-com.png",
		"background_color": "#005E91",
		"domain": "theguardian.com"
	},
	{
		"title": "thesaurus",
		"url": "http://www.thesaurus.com/",
		"image_url": "thesaurus-com.png",
		"background_color": "#ffce80",
		"domain": "thesaurus.com"
	},
	{
		"title": "ticketmaster",
		"url": "http://www.ticketmaster.com/",
		"image_url": "ticketmaster-com.png",
		"background_color": "#fff",
		"domain": "ticketmaster.com"
	},
	{
		"title": "tripadvisor",
		"url": "https://www.tripadvisor.com/",
		"image_url": "tripadvisor-com.png",
		"background_color": "#5ba443",
		"domain": "tripadvisor.com"
	},
	{
		"title": "trulia",
		"url": "http://www.trulia.com/",
		"image_url": "trulia-com.png",
		"background_color": "#62be06",
		"domain": "trulia.com"
	},
	{
		"title": "tumblr",
		"url": "https://www.tumblr.com/",
		"image_url": "tumblr-com.png",
		"background_color": "#4ebd89",
		"domain": "tumblr.com"
	},
	{
		"title": "twitch",
		"url": "https://www.twitch.tv/",
		"image_url": "twitch-tv.png",
		"background_color": "#5A43A9",
		"domain": "twitch.tv"
	},
	{
		"title": "twitter",
		"url": "https://twitter.com/",
		"image_url": "twitter-com.png",
		"background_color": "#049ff5",
		"domain": "twitter.com"
	},
	{
		"title": "ups",
		"url": "https://www.ups.com/",
		"image_url": "ups-com.png",
		"background_color": "#281704",
		"domain": "ups.com"
	},
	{
		"title": "usaa",
		"url": "https://www.usaa.com/",
		"image_url": "usaa-com.png",
		"background_color": "#002a41",
		"domain": "usaa.com"
	},
	{
		"title": "usatoday",
		"url": "http://www.usatoday.com/",
		"image_url": "usatoday-com.png",
		"background_color": "#000",
		"domain": "usatoday.com"
	},
	{
		"title": "usbank",
		"url": "https://www.usbank.com/",
		"image_url": "usbank-com.png",
		"background_color": "#ff0022",
		"domain": "usbank.com"
	},
	{
		"title": "usps",
		"url": "https://www.usps.com/",
		"image_url": "usps-com.png",
		"background_color": "#f5f5f5",
		"domain": "usps.com"
	},
	{
		"title": "verizon",
		"url": "http://www.verizon.com/",
		"image_url": "verizon-com.png",
		"background_color": "#f00000",
		"domain": "verizon.com"
	},
	{
		"title": "verizonwireless",
		"url": "http://www.verizonwireless.com/",
		"image_url": "verizonwireless-com.png",
		"background_color": "#fff",
		"domain": "verizonwireless.com"
	},
	{
		"title": "vice",
		"url": "http://www.vice.com/",
		"image_url": "vice-com.png",
		"background_color": "#000",
		"domain": "vice.com"
	},
	{
		"title": "vimeo",
		"url": "https://vimeo.com/",
		"image_url": "vimeo-com.png",
		"background_color": "#00b1f2",
		"domain": "vimeo.com"
	},
	{
		"title": "walmart",
		"url": "http://www.walmart.com/",
		"image_url": "walmart-com.png",
		"background_color": "#fff",
		"domain": "walmart.com"
	},
	{
		"title": "washingtonpost",
		"url": "https://www.washingtonpost.com/regional/",
		"image_url": "washingtonpost-com.png",
		"background_color": "#fff",
		"domain": "washingtonpost.com"
	},
	{
		"title": "wayfair",
		"url": "http://www.wayfair.com/",
		"image_url": "wayfair-com.png",
		"background_color": "#ffffff",
		"domain": "wayfair.com"
	},
	{
		"title": "weather",
		"url": "https://weather.com/",
		"image_url": "weather-com.png",
		"background_color": "#2147a8",
		"domain": "weather.com"
	},
	{
		"title": "webmd",
		"url": "http://www.webmd.com/default.htm",
		"image_url": "webmd-com.png",
		"background_color": "#00639a",
		"domain": "webmd.com"
	},
	{
		"title": "wellsfargo",
		"url": "https://www.wellsfargo.com",
		"image_url": "wellsfargo-com.png",
		"background_color": "#ba1613",
		"domain": "wellsfargo.com"
	},
	{
		"title": "wikia",
		"url": "http://www.wikia.com/fandom",
		"image_url": "wikia-com.png",
		"background_color": "#f1f1f1",
		"domain": "wikia.com"
	},
	{
		"title": "wikihow",
		"url": "http://www.wikihow.com/",
		"image_url": "wikihow-com.png",
		"background_color": "#455046",
		"domain": "wikihow.com"
	},
	{
		"title": "wikipedia",
		"url": "https://www.wikipedia.org/",
		"image_url": "wikipedia-org.png",
		"background_color": "#fff",
		"domain": "wikipedia.org"
	},
	{
		"title": "wired",
		"url": "https://www.wired.com/",
		"image_url": "wired-com.png",
		"background_color": "#000",
		"domain": "wired.com"
	},
	{
		"title": "wittyfeed",
		"url": "http://www.wittyfeed.com",
		"image_url": "wittyfeed-com.png",
		"background_color": "#d83633",
		"domain": "wittyfeed.com"
	},
	{
		"title": "wordpress",
		"url": "https://wordpress.com",
		"image_url": "wordpress-com.png",
		"background_color": "#00739c",
		"domain": "wordpress.com"
	},
	{
		"title": "wsj",
		"url": "http://www.wsj.com/",
		"image_url": "wsj-com.png",
		"background_color": "#000000",
		"domain": "wsj.com"
	},
	{
		"title": "wunderground",
		"url": "https://www.wunderground.com/",
		"image_url": "wunderground-com.png",
		"background_color": "#000000",
		"domain": "wunderground.com"
	},
	{
		"title": "yahoo",
		"url": "https://www.yahoo.com/",
		"image_url": "yahoo-com.png",
		"background_color": "#5009a7",
		"domain": "yahoo.com"
	},
	{
		"title": "yelp",
		"url": "http://yelp.com/",
		"image_url": "yelp-com.png",
		"background_color": "#d83633",
		"domain": "yelp.com"
	},
	{
		"title": "youtube",
		"url": "https://www.youtube.com/",
		"image_url": "youtube-com.png",
		"background_color": "#db4338",
		"domain": "youtube.com"
	},
	{
		"title": "zillow",
		"url": "http://www.zillow.com/",
		"image_url": "zillow-com.png",
		"background_color": "#98c554",
		"domain": "zillow.com"
	}
];

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

var slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//;

/**
 * These properties should not be copied or inherited from. This is only needed
 * for all non blob URL's as a blob URL does not include a hash, only the
 * origin.
 *
 * @type {Object}
 * @private
 */
var ignore = { hash: 1, query: 1 }
  , URL;

/**
 * The location object differs when your code is loaded through a normal page,
 * Worker or through a worker using a blob. And with the blobble begins the
 * trouble as the location object will contain the URL of the blob, not the
 * location of the page where our code is loaded in. The actual origin is
 * encoded in the `pathname` so we can thankfully generate a good "default"
 * location from it so we can generate proper relative URL's again.
 *
 * @param {Object|String} loc Optional default location object.
 * @returns {Object} lolcation object.
 * @api public
 */
module.exports = function lolcation(loc) {
  loc = loc || global.location || {};
  URL = URL || __webpack_require__(1);

  var finaldestination = {}
    , type = typeof loc
    , key;

  if ('blob:' === loc.protocol) {
    finaldestination = new URL(unescape(loc.pathname), {});
  } else if ('string' === type) {
    finaldestination = new URL(loc, {});
    for (key in ignore) delete finaldestination[key];
  } else if ('object' === type) {
    for (key in loc) {
      if (key in ignore) continue;
      finaldestination[key] = loc[key];
    }

    if (finaldestination.slashes === undefined) {
      finaldestination.slashes = slashes.test(loc.href);
    }
  }

  return finaldestination;
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)))

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var punycode = __webpack_require__(29);
var util = __webpack_require__(44);

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = __webpack_require__(32);

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/* globals ADDON */

// Note:
// DO NOT import this file directly, as it needs to be processed by webpack.
// Instead, import depdencies like this:
// require("common/vendor")("my-dependency");

if (true) {
  const {setTimeout, clearTimeout} = __webpack_require__(26);
  global.setTimeout = setTimeout;
  global.clearTimeout = clearTimeout;
}

// Shared between both addon and content
const vendorModules = {
  "redux": __webpack_require__(14),
  "redux-thunk": __webpack_require__(12),
  "reselect": __webpack_require__(15),
  "url-parse": __webpack_require__(1)
};

// Addon-only modules. Also needed for tests
if (true) {
  Object.assign(vendorModules, {
    "page-metadata-parser": __webpack_require__(11),
    "redux-watch": __webpack_require__(13),
    "lodash.debounce": __webpack_require__(10),
    "tippy-top-sites": __webpack_require__(16)
  });
}

module.exports = function vendor(moduleName) {
  if (!vendorModules[moduleName]) {
    throw new Error(`Tried to import '${moduleName}' but it was not defined in common/vendor-src.js. Maybe you need to add it?`);
  }
  return vendorModules[moduleName];
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(0)))

/***/ })
/******/ ]);

/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */



const {forEach} = __webpack_require__(23);
const {max} = __webpack_require__(76);


// Get a key of a map, first setting it to a default value if it's missing.
function getDefault(map, key, defaultMaker) {
    if (map.has(key)) {
        return map.get(key);
    }
    const defaultValue = defaultMaker();
    map.set(key, defaultValue);
    return defaultValue;
}


// Construct a filtration network of rules.
function ruleset(...rules) {
    const rulesByInputFlavor = new Map();  // [someInputFlavor: [rule, ...]]

    // File each rule under its input flavor:
    forEach(rule => getDefault(rulesByInputFlavor, rule.source.inputFlavor, () => []).push(rule),
            rules);

    return {
        // Iterate over a DOM tree or subtree, building up a knowledgebase, a
        // data structure holding scores and annotations for interesting
        // elements. Return the knowledgebase.
        //
        // This is the "rank" portion of the rank-and-yank algorithm.
        score: function (tree) {
            const kb = knowledgebase();

            // Introduce the whole DOM into the KB as flavor 'dom' to get
            // things started:
            const nonterminals = [[{tree}, 'dom']];  // [[node, flavor], [node, flavor], ...]

            // While there are new facts, run the applicable rules over them to
            // generate even newer facts. Repeat until everything's fully
            // digested. Rules run in no particular guaranteed order.
            while (nonterminals.length) {
                const [inNode, inFlavor] = nonterminals.pop();
                for (let rule of getDefault(rulesByInputFlavor, inFlavor, () => [])) {
                    const outFacts = resultsOf(rule, inNode, inFlavor, kb);
                    for (let fact of outFacts) {
                        const outNode = kb.nodeForElement(fact.element);

                        // No matter whether or not this flavor has been
                        // emitted before for this node, we multiply the score.
                        // We want to be able to add rules that refine the
                        // scoring of a node, without having to rewire the path
                        // of flavors that winds through the ruleset.
                        //
                        // 1 score per Node is plenty. That simplifies our
                        // data, our rankers, our flavor system (since we don't
                        // need to represent score axes), and our engine. If
                        // somebody wants more score axes, they can fake it
                        // themselves with notes, thus paying only for what
                        // they eat. (We can even provide functions that help
                        // with that.) Most rulesets will probably be concerned
                        // with scoring only 1 thing at a time anyway. So,
                        // rankers return a score multiplier + 0 or more new
                        // flavors with optional notes. Facts can never be
                        // deleted from the KB by rankers (or order would start
                        // to matter); after all, they're *facts*.
                        outNode.score *= fact.score;

                        // Add a new annotation to a node--but only if there
                        // wasn't already one of the given flavor already
                        // there; otherwise there's no point.
                        //
                        // You might argue that we might want to modify an
                        // existing note here, but that would be a bad
                        // idea. Notes of a given flavor should be
                        // considered immutable once laid down. Otherwise, the
                        // order of execution of same-flavored rules could
                        // matter, hurting pluggability. Emit a new flavor and
                        // a new note if you want to do that.
                        //
                        // Also, choosing not to add a new fact to nonterminals
                        // when we're not adding a new flavor saves the work of
                        // running the rules against it, which would be
                        // entirely redundant and perform no new work (unless
                        // the rankers were nondeterministic, but don't do
                        // that).
                        if (!outNode.flavors.has(fact.flavor)) {
                            outNode.flavors.set(fact.flavor, fact.notes);
                            kb.indexNodeByFlavor(outNode, fact.flavor);  // TODO: better encapsulation rather than indexing explicitly
                            nonterminals.push([outNode, fact.flavor]);
                        }
                    }
                }
            }
            return kb;
        }
    };
}


// Construct a container for storing and querying facts, where a fact has a
// flavor (used to dispatch further rules upon), a corresponding DOM element, a
// score, and some other arbitrary notes opaque to fathom.
function knowledgebase() {
    const nodesByFlavor = new Map();  // Map{'texty' -> [NodeA],
                                      //     'spiffy' -> [NodeA, NodeB]}
                                      // NodeA = {element: <someElement>,
                                      //
                                      //          // Global nodewide score. Add
                                      //          // custom ones with notes if
                                      //          // you want.
                                      //          score: 8,
                                      //
                                      //          // Flavors is a map of flavor names to notes:
                                      //          flavors: Map{'texty' -> {ownText: 'blah',
                                      //                                   someOtherNote: 'foo',
                                      //                                   someCustomScore: 10},
                                      //                       // This is an empty note:
                                      //                       'fluffy' -> undefined}}
    const nodesByElement = new Map();

    return {
        // Return the "node" (our own data structure that we control) that
        // corresponds to a given DOM element, creating one if necessary.
        nodeForElement: function (element) {
            return getDefault(nodesByElement,
                              element,
                              () => ({element,
                                      score: 1,
                                      flavors: new Map()}));
        },

        // Return the highest-scored node of the given flavor, undefined if
        // there is none.
        max: function (flavor) {
            const nodes = nodesByFlavor.get(flavor);
            return nodes === undefined ? undefined : max(nodes, node => node.score);
        },

        // Let the KB know that a new flavor has been added to an element.
        indexNodeByFlavor: function (node, flavor) {
            getDefault(nodesByFlavor, flavor, () => []).push(node);
        },

        nodesOfFlavor: function (flavor) {
            return getDefault(nodesByFlavor, flavor, () => []);
        }
    };
}


// Apply a rule (as returned by a call to rule()) to a fact, and return the
// new facts that result.
function resultsOf(rule, node, flavor, kb) {
    // If more types of rule pop up someday, do fancier dispatching here.
    return rule.source.flavor === 'flavor' ? resultsOfFlavorRule(rule, node, flavor) : resultsOfDomRule(rule, node, kb);
}


// Pull the DOM tree off the special property of the root "dom" fact, and query
// against it.
function *resultsOfDomRule(rule, specialDomNode, kb) {
    // Use the special "tree" property of the special starting node:
    const matches = specialDomNode.tree.querySelectorAll(rule.source.selector);

    for (let i = 0; i < matches.length; i++) {  // matches is a NodeList, which doesn't conform to iterator protocol
        const element = matches[i];
        const newFacts = explicitFacts(rule.ranker(kb.nodeForElement(element)));
        for (let fact of newFacts) {
            if (fact.element === undefined) {
                fact.element = element;
            }
            if (fact.flavor === undefined) {
                throw new Error('Rankers of dom() rules must return a flavor in each fact. Otherwise, there is no way for that fact to be used later.');
            }
            yield fact;
        }
    }
}


function *resultsOfFlavorRule(rule, node, flavor) {
    const newFacts = explicitFacts(rule.ranker(node));

    for (let fact of newFacts) {
        // If the ranker didn't specify a different element, assume it's
        // talking about the one we passed in:
        if (fact.element === undefined) {
            fact.element = node.element;
        }
        if (fact.flavor === undefined) {
            fact.flavor = flavor;
        }
        yield fact;
    }
}


// Take the possibly abbreviated output of a ranker function, and make it
// explicitly an iterable with a defined score.
//
// Rankers can return undefined, which means "no facts", a single fact, or an
// array of facts.
function *explicitFacts(rankerResult) {
    const array = (rankerResult === undefined) ? [] : (Array.isArray(rankerResult) ? rankerResult : [rankerResult]);
    for (let fact of array) {
        if (fact.score === undefined) {
            fact.score = 1;
        }
        yield fact;
    }
}


// TODO: For the moment, a lot of responsibility is on the rankers to return a
// pretty big data structure of up to 4 properties. This is a bit verbose for
// an arrow function (as I hope we can use most of the time) and the usual case
// will probably be returning just a score multiplier. Make that case more
// concise.

// TODO: It is likely that rankers should receive the notes of their input type
// as a 2nd arg, for brevity.


// Return a condition that uses a DOM selector to find its matches from the
// original DOM tree.
//
// For consistency, Nodes will still be delivered to the transformers, but
// they'll have empty flavors and score = 1.
//
// Condition constructors like dom() and flavor() build stupid, introspectable
// objects that the query engine can read. They don't actually do the query
// themselves. That way, the query planner can be smarter than them, figuring
// out which indices to use based on all of them. (We'll probably keep a heap
// by each dimension's score and a hash by flavor name, for starters.) Someday,
// fancy things like this may be possible: rule(and(tag('p'), klass('snork')),
// ...)
function dom(selector) {
    return {
        flavor: 'dom',
        inputFlavor: 'dom',
        selector
    };
}


// Return a condition that discriminates on nodes of the knowledgebase by flavor.
function flavor(inputFlavor) {
    return {
        flavor: 'flavor',
        inputFlavor
    };
}


function rule(source, ranker) {
    return {
        source,
        ranker
    };
}


module.exports = {
    dom,
    rule,
    ruleset,
    flavor
};


// TODO: Integrate jkerim's static-scored, short-circuiting rules into the design. We can make rankers more introspectable. Rankers become hashes. If you return a static score for all matches, just stick an int in there like {score: 5}. Then the ruleset can be smart enough to run the rules emitting a given type in order of decreasing possible score. (Dynamically scored rules will always be run.) Of course, we'll also have to declare what types a rule can emit: {emits: ['titley']}. Move to a more declarative ranker also moves us closer to a machine-learning-based rule deriver (or at least tuner).


// Future possible fanciness:
// * Metarules, e.g. specific rules for YouTube if it's extremely weird. Maybe they can just take simple predicates over the DOM: metarule(dom => !isEmpty(dom.querySelectorAll('body[youtube]')), rule(...)). Maybe they'll have to be worse: the result of a full rank-and-yank process themselves. Or maybe we can somehow implement them without having to have a special "meta" kind of rule at all.
// * Different kinds of "mixing" than just multiplication, though this makes us care even more that rules execute in order and in series. An alternative may be to have rankers lay down the component numbers and a yanker do the fancier math.
// * Fancy combinators for rule sources, along with something like a Rete tree for more efficiently dispatching them. For example, rule(and(flavor('foo'), flavor('bar')), ...) would match only a node having both the foo and bar flavors.
// * If a ranker returns 0 (i.e. this thing has no chance of being in the category that I'm thinking about), delete the fact from the KB: a performance optimization.
// * I'm not sure about constraining us to execute the rules in order. It hurts efficiency and is going to lead us into a monkeypatching nightmare as third parties contribute rules. What if we instead used subflavors to order where necessary, where a subflavor is "(explicit-flavor, rule that touched me, rule that touched me next, ...)". A second approach: Ordinarily, if we were trying to order rules, we'd have them operate on different flavors, each rule spitting out a fact of a new flavor and the next rule taking it as input. Inserting a third-party rule into a ruleset like that would require rewriting the whole thing to interpose a new flavor. But what if we instead did something like declaring dependencies on certain rules but without mentioning them (in case the set of rules in the ruleset changes later). This draws a clear line between the ruleset's private implementation and its public, hookable API. Think: why would 3rd-party rule B want to fire between A and C? Because it requires some data A lays down and wants to muck with it before C uses it as input. That data would be part of facts of a certain flavor (if the ruleset designer is competent), and rules that want to hook in could specify where in terms of "I want to fire right after facts of flavor FOO are made." They can then mess with the fact before C sees it.
// * We could even defer actually multiplying the ranks together, preserving the individual factors, in case we can get any interesting results out of comparing the results with and without certain rules' effects.
// * Probably fact flavors and the score axes should be separate: fact flavors state what flavor of notes are available about nodes (and might affect rule order if they want to use each other's notes). Score axes talk about the degree to which a node is in a category. Each fact would be linked to a proxy for a DOM node, and all scores would live on those proxies.
// * It probably could use a declarative yanking system to go with the ranking one: the "reduce" to its "map". We may want to implement a few imperatively first, though, and see what patterns shake out.

// Yankers:
// max score (of some flavor)
// max-scored sibling cluster (maybe a contiguous span of containers around high-scoring ones, like a blur algo allowing occasional flecks of low-scoring noise)
// adjacent max-scored sibling clusters (like for Readability's remove-extra-paragraphs test, which has 2 divs, each containing <p>s)
//
// Yanking:
// * Block-level containers at the smallest. (Any smaller, and you're pulling out parts of paragraphs, not entire paragraphs.) mergedInnerTextNakedOrInInInlineTags might make this superfluous.
//
//
// Advantages over readability:
// * State clearly contained
// * Should work fine with ideographic languages and others that lack space-delimited words
// * Pluggable
// * Potential to have rules generated or tuned by training
// * Adaptable to find things other than the main body text
// * Potential to perform better since it doesn't have to run over and over, loosening constraints each time, if it fails


/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

const {flatten, forEach, map} = __webpack_require__(23);


function identity(x) {
    return x;
}


// From an iterable return the best item, according to an arbitrary comparator
// function. In case of a tie, the first item wins.
function best(iterable, by, isBetter) {
    let bestSoFar, bestKeySoFar;
    let isFirst = true;
    forEach(
        function (item) {
            const key = by(item);
            if (isBetter(key, bestKeySoFar) || isFirst) {
                bestSoFar = item;
                bestKeySoFar = key;
                isFirst = false;
            }
        },
        iterable);
    if (isFirst) {
        throw new Error('Tried to call best() on empty iterable');
    }
    return bestSoFar;
}


// Return the maximum item from an iterable, as defined by >.
//
// Works with any type that works with >. If multiple items are equally great,
// return the first.
//
// by: a function that, given an item of the iterable, returns a value to
//     compare
function max(iterable, by = identity) {
    return best(iterable, by, (a, b) => a > b);
}


function min(iterable, by = identity) {
    return best(iterable, by, (a, b) => a < b);
}


// Return the sum of an iterable, as defined by the + operator.
function sum(iterable) {
    let total;
    let isFirst = true;
    forEach(
        function assignOrAdd(addend) {
            if (isFirst) {
                total = addend;
                isFirst = false;
            } else {
                total += addend;
            }
        },
        iterable);
    return total;
}


function length(iterable) {
    let num = 0;
    for (let item of iterable) {
        num++;
    }
    return num;
}


// Iterate, depth first, over a DOM node. Return the original node first.
// shouldTraverse - a function on a node saying whether we should include it
//     and its children
function *walk(element, shouldTraverse) {
    yield element;
    for (let child of element.childNodes) {
        if (shouldTraverse(child)) {
            for (let w of walk(child, shouldTraverse)) {
                yield w;
            }
        }
    }
}


const blockTags = new Set();
forEach(blockTags.add.bind(blockTags),
        ['ADDRESS', 'BLOCKQUOTE', 'BODY', 'CENTER', 'DIR', 'DIV', 'DL',
         'FIELDSET', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR',
         'ISINDEX', 'MENU', 'NOFRAMES', 'NOSCRIPT', 'OL', 'P', 'PRE',
         'TABLE', 'UL', 'DD', 'DT', 'FRAMESET', 'LI', 'TBODY', 'TD',
         'TFOOT', 'TH', 'THEAD', 'TR', 'HTML']);
// Return whether a DOM element is a block element by default (rather
// than by styling).
function isBlock(element) {
    return blockTags.has(element.tagName);
}


// Yield strings of text nodes within a normalized DOM node and its
// children, without venturing into any contained block elements.
//
// shouldTraverse: A function that specifies additional elements to
//     exclude by returning false
function *inlineTexts(element, shouldTraverse = element => true) {
    // TODO: Could we just use querySelectorAll() with a really long
    // selector rather than walk(), for speed?
    for (let child of walk(element,
                             element => !(isBlock(element) ||
                                          element.tagName === 'SCRIPT' &&
                                          element.tagName === 'STYLE')
                                        && shouldTraverse(element))) {
        if (child.nodeType === child.TEXT_NODE) {
            // wholeText() is not implemented by jsdom, so we use
            // textContent(). The result should be the same, since
            // we're calling it on only text nodes, but it may be
            // slower. On the positive side, it means we don't need to
            // normalize the DOM tree first.
            yield child.textContent;
        }
    }
}


function inlineTextLength(element, shouldTraverse = element => true) {
    return sum(map(text => collapseWhitespace(text).length,
                   inlineTexts(element, shouldTraverse)));
}


function collapseWhitespace(str) {
    return str.replace(/\s{2,}/g, ' ');
}


// Return the ratio of the inline text length of the links in an
// element to the inline text length of the entire element.
function linkDensity(node) {
    const length = node.flavors.get('paragraphish').inlineLength;
    const lengthWithoutLinks = inlineTextLength(node.element,
                                                element => element.tagName !== 'A');
    return (length - lengthWithoutLinks) / length;
}


// Return the next sibling node of `element`, skipping over text nodes that
// consist wholly of whitespace.
function isWhitespace(element) {
    return (element.nodeType === element.TEXT_NODE &&
            element.textContent.trim().length === 0);
}


// Return the number of stride nodes between 2 DOM nodes *at the same
// level of the tree*, without going up or down the tree.
//
// Stride nodes are {(1) siblings or (2) siblings of ancestors} that lie
// between the 2 nodes. These interposed nodes make it less likely that the 2
// nodes should be together in a cluster.
//
// left xor right may also be undefined.
function numStrides(left, right) {
    let num = 0;

    // Walk right from left node until we hit the right node or run out:
    let sibling = left;
    let shouldContinue = sibling && sibling !== right;
    while (shouldContinue) {
        sibling = sibling.nextSibling;
        if ((shouldContinue = sibling && sibling !== right) &&
            !isWhitespace(sibling)) {
            num += 1;
        }
    }
    if (sibling !== right) {  // Don't double-punish if left and right are siblings.
        // Walk left from right node:
        sibling = right;
        while (sibling) {
            sibling = sibling.previousSibling;
            if (sibling && !isWhitespace(sibling)) {
                num += 1;
            }
        }
    }
    return num;
}


// Return a distance measurement between 2 DOM nodes.
//
// I was thinking of something that adds little cost for siblings.
// Up should probably be more expensive than down (see middle example in the Nokia paper).
// O(n log n)
function distance(elementA, elementB) {
    // TODO: Test and tune these costs. They're off-the-cuff at the moment.
    //
    // Cost for each level deeper one node is than the other below their common
    // ancestor:
    const DIFFERENT_DEPTH_COST = 2;
    // Cost for a level below the common ancestor where tagNames differ:
    const DIFFERENT_TAG_COST = 2;
    // Cost for a level below the common ancestor where tagNames are the same:
    const SAME_TAG_COST = 1;
    // Cost for each stride node between A and B:
    const STRIDE_COST = 1;

    if (elementA === elementB) {
        return 0;
    }

    // Stacks that go from the common ancestor all the way to A and B:
    const aAncestors = [elementA];
    const bAncestors = [elementB];

    let aAncestor = elementA;
    let bAncestor = elementB;

    // Ascend to common parent, stacking them up for later reference:
    while (!aAncestor.contains(elementB)) {
        aAncestor = aAncestor.parentNode;
        aAncestors.push(aAncestor);
    }

    // Make an ancestor stack for the right node too so we can walk
    // efficiently down to it:
    do {
        bAncestor = bAncestor.parentNode;  // Assumes we've early-returned above if A === B.
        bAncestors.push(bAncestor);
    } while (bAncestor !== aAncestor);

    // Figure out which node is left and which is right, so we can follow
    // sibling links in the appropriate directions when looking for stride
    // nodes:
    let left = aAncestors;
    let right = bAncestors;
    // In compareDocumentPosition()'s opinion, inside implies after. Basically,
    // before and after pertain to opening tags.
    const comparison = elementA.compareDocumentPosition(elementB);
    let cost = 0;
    let mightStride;
    if (comparison & elementA.DOCUMENT_POSITION_FOLLOWING) {
        // A is before, so it could contain the other node.
        mightStride = !(comparison & elementA.DOCUMENT_POSITION_CONTAINED_BY)
        left = aAncestors;
        right = bAncestors;
    } else if (comparison & elementA.DOCUMENT_POSITION_PRECEDING) {
        // A is after, so it might be contained by the other node.
        mightStride = !(comparison & elementA.DOCUMENT_POSITION_CONTAINS)
        left = bAncestors;
        right = aAncestors;
    }

    // Descend to both nodes in parallel, discounting the traversal
    // cost iff the nodes we hit look similar, implying the nodes dwell
    // within similar structures.
    while (left.length || right.length) {
        const l = left.pop();
        const r = right.pop();
        if (l === undefined || r === undefined) {
            // Punishment for being at different depths: same as ordinary
            // dissimilarity punishment for now
            cost += DIFFERENT_DEPTH_COST;
        } else {
            // TODO: Consider similarity of classList.
            cost += l.tagName === r.tagName ? SAME_TAG_COST : DIFFERENT_TAG_COST;
        }
        // Optimization: strides might be a good dimension to eliminate.
        if (mightStride) {
            cost += numStrides(l, r) * STRIDE_COST;
        }
    }

    return cost;
}


// A lower-triangular matrix of inter-cluster distances
// TODO: Allow distance function to be passed in, making this generally useful
// and not tied to the DOM.
class DistanceMatrix {
    constructor (elements) {
        // A sparse adjacency matrix:
        // {A => {},
        //  B => {A => 4},
        //  C => {A => 4, B => 4},
        //  D => {A => 4, B => 4, C => 4}
        //  E => {A => 4, B => 4, C => 4, D => 4}}
        //
        // A, B, etc. are arrays of [arrays of arrays of...] DOM nodes, each
        // array being a cluster. In this way, they not only accumulate a
        // cluster but retain the steps along the way.
        //
        // This is an efficient data structure in terms of CPU and memory, in
        // that we don't have to slide a lot of memory around when we delete a
        // row or column from the middle of the matrix while merging. Of
        // course, we lose some practical efficiency by using hash tables, and
        // maps in particular are slow in their early implementations.
        this._matrix = new Map();

        // Convert elements to clusters:
        const clusters = elements.map(el => [el]);

        // Init matrix:
        for (let outerCluster of clusters) {
            const innerMap = new Map();
            for (let innerCluster of this._matrix.keys()) {
                innerMap.set(innerCluster, distance(outerCluster[0],
                                                    innerCluster[0]));
            }
            this._matrix.set(outerCluster, innerMap);
        }
        this._numClusters = clusters.length;
    }

    // Return (distance, a: clusterA, b: clusterB) of closest-together clusters.
    // Replace this to change linkage criterion.
    closest () {
        const self = this;

        if (this._numClusters < 2) {
            throw new Error('There must be at least 2 clusters in order to return the closest() ones.');
        }

        // Return the distances between every pair of clusters.
        function *clustersAndDistances() {
            for (let [outerKey, row] of self._matrix.entries()) {
                for (let [innerKey, storedDistance] of row.entries()) {
                    yield {a: outerKey, b: innerKey, distance: storedDistance};
                }
            }
        }
        return min(clustersAndDistances(), x => x.distance);
    }

    // Look up the distance between 2 clusters in me. Try the lookup in the
    // other direction if the first one falls in the nonexistent half of the
    // triangle.
    _cachedDistance (clusterA, clusterB) {
        let ret = this._matrix.get(clusterA).get(clusterB);
        if (ret === undefined) {
            ret = this._matrix.get(clusterB).get(clusterA);
        }
        return ret;
    }

    // Merge two clusters.
    merge (clusterA, clusterB) {
        // An example showing how rows merge:
        //  A: {}
        //  B: {A: 1}
        //  C: {A: 4, B: 4},
        //  D: {A: 4, B: 4, C: 4}
        //  E: {A: 4, B: 4, C: 2, D: 4}}
        //
        // Step 2:
        //  C: {}
        //  D: {C: 4}
        //  E: {C: 2, D: 4}}
        //  AB: {C: 4, D: 4, E: 4}
        //
        // Step 3:
        //  D:  {}
        //  AB: {D: 4}
        //  CE: {D: 4, AB: 4}

        // Construct new row, finding min distances from either subcluster of
        // the new cluster to old clusters.
        //
        // There will be no repetition in the matrix because, after all,
        // nothing pointed to this new cluster before it existed.
        const newRow = new Map();
        for (let outerKey of this._matrix.keys()) {
            if (outerKey !== clusterA && outerKey !== clusterB) {
                newRow.set(outerKey, Math.min(this._cachedDistance(clusterA, outerKey),
                                              this._cachedDistance(clusterB, outerKey)));
            }
        }

        // Delete the rows of the clusters we're merging.
        this._matrix.delete(clusterA);
        this._matrix.delete(clusterB);

        // Remove inner refs to the clusters we're merging.
        for (let inner of this._matrix.values()) {
            inner.delete(clusterA);
            inner.delete(clusterB);
        }

        // Attach new row.
        this._matrix.set([clusterA, clusterB], newRow);

        // There is a net decrease of 1 cluster:
        this._numClusters -= 1;
    }

    numClusters () {
        return this._numClusters;
    }

    // Return an Array of nodes for each cluster in me.
    clusters () {
        // TODO: Can't get wu.map to work here. Don't know why.
        return Array.from(this._matrix.keys()).map(e => Array.from(flatten(false, e)));
    }
}


// Partition the given nodes into one or more clusters by position in the DOM
// tree.
//
// elements: An Array of DOM nodes
// tooFar: The closest-nodes distance() beyond which we will not attempt to
//     unify 2 clusters
//
// This implements an agglomerative clustering. It uses single linkage, since
// we're talking about adjacency here more than Euclidean proximity: the
// clusters we're talking about in the DOM will tend to be adjacent, not
// overlapping. We haven't tried other linkage criteria yet.
//
// Maybe later we'll consider score or notes.
function clusters(elements, tooFar) {
    const matrix = new DistanceMatrix(elements);
    let closest;

    while (matrix.numClusters() > 1 && (closest = matrix.closest()).distance < tooFar) {
        matrix.merge(closest.a, closest.b);
    }

    return matrix.clusters();
}


module.exports = {
    best,
    collapseWhitespace,
    clusters,
    distance,
    identity,
    inlineTextLength,
    inlineTexts,
    isBlock,
    length,
    linkDensity,
    max,
    min,
    sum,
    walk
};


/***/ }),
/* 77 */
/***/ (function(module, exports) {

module.exports = function hexToRgb (hex) {

  if (hex.charAt && hex.charAt(0) === '#') {
    hex = removeHash(hex)
  }

  if (hex.length === 3) {
    hex = expand(hex)
  }

  var bigint = parseInt(hex, 16)
  var r = (bigint >> 16) & 255
  var g = (bigint >> 8) & 255
  var b = bigint & 255

  return [r, g, b]
}

function removeHash (hex) {

  var arr = hex.split('')
  arr.shift()
  return arr.join('')
}

function expand (hex) {

  return hex
    .split('')
    .reduce(function (accum, value) {

      return accum.concat([value, value])
    }, [])
    .join('')
}


/***/ }),
/* 78 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getRawTag_js__ = __webpack_require__(81);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__objectToString_js__ = __webpack_require__(82);




/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  value = Object(value);
  return (symToStringTag && symToStringTag in value)
    ? __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__getRawTag_js__["a" /* default */])(value)
    : __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__objectToString_js__["a" /* default */])(value);
}

/* harmony default export */ __webpack_exports__["a"] = baseGetTag;


/***/ }),
/* 79 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/* harmony default export */ __webpack_exports__["a"] = freeGlobal;

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(2)))

/***/ }),
/* 80 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__overArg_js__ = __webpack_require__(83);


/** Built-in value references. */
var getPrototype = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__overArg_js__["a" /* default */])(Object.getPrototypeOf, Object);

/* harmony default export */ __webpack_exports__["a"] = getPrototype;


/***/ }),
/* 81 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Symbol_js__ = __webpack_require__(16);


/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */] ? __WEBPACK_IMPORTED_MODULE_0__Symbol_js__["a" /* default */].toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

/* harmony default export */ __webpack_exports__["a"] = getRawTag;


/***/ }),
/* 82 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

/* harmony default export */ __webpack_exports__["a"] = objectToString;


/***/ }),
/* 83 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/* harmony default export */ __webpack_exports__["a"] = overArg;


/***/ }),
/* 84 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__ = __webpack_require__(79);


/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = __WEBPACK_IMPORTED_MODULE_0__freeGlobal_js__["a" /* default */] || freeSelf || Function('return this')();

/* harmony default export */ __webpack_exports__["a"] = root;


/***/ }),
/* 85 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/* harmony default export */ __webpack_exports__["a"] = isObjectLike;


/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return root.Date.now();
};

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now());
  }

  function debounced() {
    var time = now(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = debounce;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory){
  'use strict';

  /*istanbul ignore next:cant test*/
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else if (true) {
    // AMD. Register as an anonymous module.
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else {
    // Browser globals
    root.objectPath = factory();
  }
})(this, function(){
  'use strict';

  var
    toStr = Object.prototype.toString,
    _hasOwnProperty = Object.prototype.hasOwnProperty;

  function isEmpty(value){
    if (!value) {
      return true;
    }
    if (isArray(value) && value.length === 0) {
        return true;
    } else if (!isString(value)) {
        for (var i in value) {
            if (_hasOwnProperty.call(value, i)) {
                return false;
            }
        }
        return true;
    }
    return false;
  }

  function toString(type){
    return toStr.call(type);
  }

  function isNumber(value){
    return typeof value === 'number' || toString(value) === "[object Number]";
  }

  function isString(obj){
    return typeof obj === 'string' || toString(obj) === "[object String]";
  }

  function isObject(obj){
    return typeof obj === 'object' && toString(obj) === "[object Object]";
  }

  function isArray(obj){
    return typeof obj === 'object' && typeof obj.length === 'number' && toString(obj) === '[object Array]';
  }

  function isBoolean(obj){
    return typeof obj === 'boolean' || toString(obj) === '[object Boolean]';
  }

  function getKey(key){
    var intKey = parseInt(key);
    if (intKey.toString() === key) {
      return intKey;
    }
    return key;
  }

  function set(obj, path, value, doNotReplace){
    if (isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (isString(path)) {
      return set(obj, path.split('.').map(getKey), value, doNotReplace);
    }
    var currentPath = path[0];

    if (path.length === 1) {
      var oldVal = obj[currentPath];
      if (oldVal === void 0 || !doNotReplace) {
        obj[currentPath] = value;
      }
      return oldVal;
    }

    if (obj[currentPath] === void 0) {
      //check if we assume an array
      if(isNumber(path[1])) {
        obj[currentPath] = [];
      } else {
        obj[currentPath] = {};
      }
    }

    return set(obj[currentPath], path.slice(1), value, doNotReplace);
  }

  function del(obj, path) {
    if (isNumber(path)) {
      path = [path];
    }

    if (isEmpty(obj)) {
      return void 0;
    }

    if (isEmpty(path)) {
      return obj;
    }
    if(isString(path)) {
      return del(obj, path.split('.'));
    }

    var currentPath = getKey(path[0]);
    var oldVal = obj[currentPath];

    if(path.length === 1) {
      if (oldVal !== void 0) {
        if (isArray(obj)) {
          obj.splice(currentPath, 1);
        } else {
          delete obj[currentPath];
        }
      }
    } else {
      if (obj[currentPath] !== void 0) {
        return del(obj[currentPath], path.slice(1));
      }
    }

    return obj;
  }

  var objectPath = function(obj) {
    return Object.keys(objectPath).reduce(function(proxy, prop) {
      if (typeof objectPath[prop] === 'function') {
        proxy[prop] = objectPath[prop].bind(objectPath, obj);
      }

      return proxy;
    }, {});
  };

  objectPath.has = function (obj, path) {
    if (isEmpty(obj)) {
      return false;
    }

    if (isNumber(path)) {
      path = [path];
    } else if (isString(path)) {
      path = path.split('.');
    }

    if (isEmpty(path) || path.length === 0) {
      return false;
    }

    for (var i = 0; i < path.length; i++) {
      var j = path[i];
      if ((isObject(obj) || isArray(obj)) && _hasOwnProperty.call(obj, j)) {
        obj = obj[j];
      } else {
        return false;
      }
    }

    return true;
  };

  objectPath.ensureExists = function (obj, path, value){
    return set(obj, path, value, true);
  };

  objectPath.set = function (obj, path, value, doNotReplace){
    return set(obj, path, value, doNotReplace);
  };

  objectPath.insert = function (obj, path, value, at){
    var arr = objectPath.get(obj, path);
    at = ~~at;
    if (!isArray(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }
    arr.splice(at, 0, value);
  };

  objectPath.empty = function(obj, path) {
    if (isEmpty(path)) {
      return obj;
    }
    if (isEmpty(obj)) {
      return void 0;
    }

    var value, i;
    if (!(value = objectPath.get(obj, path))) {
      return obj;
    }

    if (isString(value)) {
      return objectPath.set(obj, path, '');
    } else if (isBoolean(value)) {
      return objectPath.set(obj, path, false);
    } else if (isNumber(value)) {
      return objectPath.set(obj, path, 0);
    } else if (isArray(value)) {
      value.length = 0;
    } else if (isObject(value)) {
      for (i in value) {
        if (_hasOwnProperty.call(value, i)) {
          delete value[i];
        }
      }
    } else {
      return objectPath.set(obj, path, null);
    }
  };

  objectPath.push = function (obj, path /*, values */){
    var arr = objectPath.get(obj, path);
    if (!isArray(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }

    arr.push.apply(arr, Array.prototype.slice.call(arguments, 2));
  };

  objectPath.coalesce = function (obj, paths, defaultValue) {
    var value;

    for (var i = 0, len = paths.length; i < len; i++) {
      if ((value = objectPath.get(obj, paths[i])) !== void 0) {
        return value;
      }
    }

    return defaultValue;
  };

  objectPath.get = function (obj, path, defaultValue){
    if (isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (isEmpty(obj)) {
      return defaultValue;
    }
    if (isString(path)) {
      return objectPath.get(obj, path.split('.'), defaultValue);
    }

    var currentPath = getKey(path[0]);

    if (path.length === 1) {
      if (obj[currentPath] === void 0) {
        return defaultValue;
      }
      return obj[currentPath];
    }

    return objectPath.get(obj[currentPath], path.slice(1), defaultValue);
  };

  objectPath.del = function(obj, path) {
    return del(obj, path);
  };

  return objectPath;
});


/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

const urlparse = __webpack_require__(107);
const {dom, rule, ruleset} = __webpack_require__(75);

function makeUrlAbsolute(base, relative) {
  const relativeParsed = urlparse.parse(relative);

  if (relativeParsed.host === null) {
    return urlparse.resolve(base, relative);
  }

  return relative;
}

function getProvider(url) {
  return urlparse.parse(url)
    .hostname
    .replace(/www[a-zA-Z0-9]*\./, '')
    .replace('.co.', '.')
    .split('.')
    .slice(0, -1)
    .join(' ');
}

function buildRuleset(name, rules, processors, scorers) {
  const reversedRules = Array.from(rules).reverse();
  const builtRuleset = ruleset(...reversedRules.map(([query, handler], order) => rule(
    dom(query),
    node => {
      let score = order;

      if (scorers) {
        scorers.forEach(scorer => {
          const newScore = scorer(node, score);

          if (newScore) {
            score = newScore;
          }
        });
      }

      return [{
        flavor: name,
        score: score,
        notes: handler(node),
      }];
    }
  )));

  return (doc, context) => {
    const kb = builtRuleset.score(doc);
    const maxNode = kb.max(name);

    if (maxNode) {
      let value = maxNode.flavors.get(name);

      if (processors) {
        processors.forEach(processor => {
          value = processor(value, context);
        });
      }

      if (value) {
        if (value.trim) {
          return value.trim();
        }
        return value;
      }
    }
  };
}

const metadataRules = {
  description: {
    rules: [
      ['meta[property="og:description"]', node => node.element.getAttribute('content')],
      ['meta[name="description"]', node => node.element.getAttribute('content')],
    ],
  },

  icon_url: {
    rules: [
      ['link[rel="apple-touch-icon"]', node => node.element.getAttribute('href')],
      ['link[rel="apple-touch-icon-precomposed"]', node => node.element.getAttribute('href')],
      ['link[rel="icon"]', node => node.element.getAttribute('href')],
      ['link[rel="fluid-icon"]', node => node.element.getAttribute('href')],
      ['link[rel="shortcut icon"]', node => node.element.getAttribute('href')],
      ['link[rel="Shortcut Icon"]', node => node.element.getAttribute('href')],
      ['link[rel="mask-icon"]', node => node.element.getAttribute('href')],
    ],
    scorers: [
      // Handles the case where multiple icons are listed with specific sizes ie
      // <link rel="icon" href="small.png" sizes="16x16">
      // <link rel="icon" href="large.png" sizes="32x32">
      (node, score) => {
        const sizes = node.element.getAttribute('sizes');

        if (sizes) {
          const sizeMatches = sizes.match(/\d+/g);

          if (sizeMatches) {
            return sizeMatches.reduce((a, b) => a * b);
          }
        }
      }
    ],
    processors: [
      (icon_url, context) => makeUrlAbsolute(context.url, icon_url)
    ]
  },

  image_url: {
    rules: [
      ['meta[property="og:image:secure_url"]', node => node.element.getAttribute('content')],
      ['meta[property="og:image:url"]', node => node.element.getAttribute('content')],
      ['meta[property="og:image"]', node => node.element.getAttribute('content')],
      ['meta[name="twitter:image"]', node => node.element.getAttribute('content')],
      ['meta[property="twitter:image"]', node => node.element.getAttribute('content')],
      ['meta[name="thumbnail"]', node => node.element.getAttribute('content')],
    ],
    processors: [
      (image_url, context) => makeUrlAbsolute(context.url, image_url)
    ],
  },

  keywords: {
    rules: [
      ['meta[name="keywords"]', node => node.element.getAttribute('content')],
    ],
    processors: [
      (keywords) => keywords.split(',').map((keyword) => keyword.trim()),
    ]
  },

  title: {
    rules: [
      ['meta[property="og:title"]', node => node.element.getAttribute('content')],
      ['meta[name="twitter:title"]', node => node.element.getAttribute('content')],
      ['meta[property="twitter:title"]', node => node.element.getAttribute('content')],
      ['meta[name="hdl"]', node => node.element.getAttribute('content')],
      ['title', node => node.element.text],
    ],
  },

  type: {
    rules: [
      ['meta[property="og:type"]', node => node.element.getAttribute('content')],
    ],
  },

  url: {
    rules: [
      ['meta[property="og:url"]', node => node.element.getAttribute('content')],
      ['link[rel="canonical"]', node => node.element.getAttribute('href')],
    ],
    processors: [
      (url, context) => makeUrlAbsolute(context.url, url)
    ]
  },

  provider: {
    rules: [
      ['meta[property="og:site_name"]', node => node.element.getAttribute('content')]
    ]
  },
};

function getMetadata(doc, url, rules) {
  const metadata = {};
  const context = {url};
  const ruleSet = rules || metadataRules;

  Object.keys(ruleSet).map(metadataKey => {
    const metadataRule = ruleSet[metadataKey];

    if(Array.isArray(metadataRule.rules)) {
      const builtRule = buildRuleset(
        metadataKey,
        metadataRule.rules,
        metadataRule.processors,
        metadataRule.scorers
      );

      metadata[metadataKey] = builtRule(doc, context);
    } else {
      metadata[metadataKey] = getMetadata(doc, url, metadataRule);
    }
  });

  if(!metadata.url) {
    metadata.url = url;
  }

  if(url && !metadata.provider) {
    metadata.provider = getProvider(url);
  }

  if(url && !metadata.icon_url) {
    metadata.icon_url = makeUrlAbsolute(url, '/favicon.ico');
  }

  return metadata;
}

module.exports = {
  buildRuleset,
  getMetadata,
  getProvider,
  makeUrlAbsolute,
  metadataRules
};


/***/ }),
/* 89 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module, global) {var __WEBPACK_AMD_DEFINE_RESULT__;/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		true
	) {
		!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
			return punycode;
		}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(22)(module), __webpack_require__(2)))

/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};


/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};


/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.decode = exports.parse = __webpack_require__(90);
exports.encode = exports.stringify = __webpack_require__(91);


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var has = Object.prototype.hasOwnProperty;

/**
 * Simple query string parser.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object}
 * @api public
 */
function querystring(query) {
  var parser = /([^=?&]+)=?([^&]*)/g
    , result = {}
    , part;

  //
  // Little nifty parsing hack, leverage the fact that RegExp.exec increments
  // the lastIndex property so we can continue executing this loop until we've
  // parsed all results.
  //
  for (;
    part = parser.exec(query);
    result[decodeURIComponent(part[1])] = decodeURIComponent(part[2])
  );

  return result;
}

/**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
function querystringify(obj, prefix) {
  prefix = prefix || '';

  var pairs = [];

  //
  // Optionally prefix with a '?' if needed
  //
  if ('string' !== typeof prefix) prefix = '?';

  for (var key in obj) {
    if (has.call(obj, key)) {
      pairs.push(encodeURIComponent(key) +'='+ encodeURIComponent(obj[key]));
    }
  }

  return pairs.length ? prefix + pairs.join('&') : '';
}

//
// Expose the module.
//
exports.stringify = querystringify;
exports.parse = querystring;


/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.__esModule = true;
function createThunkMiddleware(extraArgument) {
  return function (_ref) {
    var dispatch = _ref.dispatch;
    var getState = _ref.getState;
    return function (next) {
      return function (action) {
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);
        }

        return next(action);
      };
    };
  };
}

var thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

exports['default'] = thunk;

/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var getValue = __webpack_require__(87).get

function defaultCompare (a, b) {
  return a === b
}

function watch (getState, objectPath, compare) {
  compare = compare || defaultCompare
  var currentValue = getValue(getState(), objectPath)
  return function w (fn) {
    return function () {
      var newValue = getValue(getState(), objectPath)
      if (!compare(currentValue, newValue)) {
        var oldValue = currentValue
        currentValue = newValue
        fn(newValue, oldValue, objectPath)
      }
    }
  }
}

module.exports = watch


/***/ }),
/* 96 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__compose__ = __webpack_require__(19);
/* harmony export (immutable) */ __webpack_exports__["a"] = applyMiddleware;
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };



/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
function applyMiddleware() {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (createStore) {
    return function (reducer, preloadedState, enhancer) {
      var store = createStore(reducer, preloadedState, enhancer);
      var _dispatch = store.dispatch;
      var chain = [];

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch(action) {
          return _dispatch(action);
        }
      };
      chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = __WEBPACK_IMPORTED_MODULE_0__compose__["a" /* default */].apply(undefined, chain)(store.dispatch);

      return _extends({}, store, {
        dispatch: _dispatch
      });
    };
  };
}

/***/ }),
/* 97 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = bindActionCreators;
function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  var keys = Object.keys(actionCreators);
  var boundActionCreators = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var actionCreator = actionCreators[key];
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}

/***/ }),
/* 98 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__createStore__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_lodash_es_isPlainObject__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__utils_warning__ = __webpack_require__(21);
/* harmony export (immutable) */ __webpack_exports__["a"] = combineReducers;




function getUndefinedStateErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

  return 'Given action ' + actionName + ', reducer "' + key + '" returned undefined. ' + 'To ignore an action, you must explicitly return the previous state.';
}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers);
  var argumentName = action && action.type === __WEBPACK_IMPORTED_MODULE_0__createStore__["b" /* ActionTypes */].INIT ? 'preloadedState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_lodash_es_isPlainObject__["a" /* default */])(inputState)) {
    return 'The ' + argumentName + ' has unexpected type of "' + {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] + '". Expected argument to be an object with the following ' + ('keys: "' + reducerKeys.join('", "') + '"');
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key];
  });

  unexpectedKeys.forEach(function (key) {
    unexpectedKeyCache[key] = true;
  });

  if (unexpectedKeys.length > 0) {
    return 'Unexpected ' + (unexpectedKeys.length > 1 ? 'keys' : 'key') + ' ' + ('"' + unexpectedKeys.join('", "') + '" found in ' + argumentName + '. ') + 'Expected to find one of the known reducer keys instead: ' + ('"' + reducerKeys.join('", "') + '". Unexpected keys will be ignored.');
  }
}

function assertReducerSanity(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, { type: __WEBPACK_IMPORTED_MODULE_0__createStore__["b" /* ActionTypes */].INIT });

    if (typeof initialState === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined.');
    }

    var type = '@@redux/PROBE_UNKNOWN_ACTION_' + Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type: type }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + __WEBPACK_IMPORTED_MODULE_0__createStore__["b" /* ActionTypes */].INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined.');
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */
function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers);
  var finalReducers = {};
  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i];

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils_warning__["a" /* default */])('No reducer provided for key "' + key + '"');
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }
  var finalReducerKeys = Object.keys(finalReducers);

  if (process.env.NODE_ENV !== 'production') {
    var unexpectedKeyCache = {};
  }

  var sanityError;
  try {
    assertReducerSanity(finalReducers);
  } catch (e) {
    sanityError = e;
  }

  return function combination() {
    var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var action = arguments[1];

    if (sanityError) {
      throw sanityError;
    }

    if (process.env.NODE_ENV !== 'production') {
      var warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
      if (warningMessage) {
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__utils_warning__["a" /* default */])(warningMessage);
      }
    }

    var hasChanged = false;
    var nextState = {};
    for (var i = 0; i < finalReducerKeys.length; i++) {
      var key = finalReducerKeys[i];
      var reducer = finalReducers[key];
      var previousStateForKey = state[key];
      var nextStateForKey = reducer(previousStateForKey, action);
      if (typeof nextStateForKey === 'undefined') {
        var errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    return hasChanged ? nextState : state;
  };
}
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(18)))

/***/ }),
/* 99 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__createStore__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__combineReducers__ = __webpack_require__(98);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__bindActionCreators__ = __webpack_require__(97);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__applyMiddleware__ = __webpack_require__(96);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__compose__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__utils_warning__ = __webpack_require__(21);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "createStore", function() { return __WEBPACK_IMPORTED_MODULE_0__createStore__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "combineReducers", function() { return __WEBPACK_IMPORTED_MODULE_1__combineReducers__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "bindActionCreators", function() { return __WEBPACK_IMPORTED_MODULE_2__bindActionCreators__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "applyMiddleware", function() { return __WEBPACK_IMPORTED_MODULE_3__applyMiddleware__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "compose", function() { return __WEBPACK_IMPORTED_MODULE_4__compose__["a"]; });







/*
* This is a dummy function to check if the function name has been altered by minification.
* If the function has been minified and NODE_ENV !== 'production', warn the user.
*/
function isCrushed() {}

if (process.env.NODE_ENV !== 'production' && typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__utils_warning__["a" /* default */])('You are currently using minified code outside of NODE_ENV === \'production\'. ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' + 'to ensure you have the correct code for your production build.');
}


/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(18)))

/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Check if we're required to add a port number.
 *
 * @see https://url.spec.whatwg.org/#default-port
 * @param {Number|String} port Port number we need to check
 * @param {String} protocol Protocol we need to check against.
 * @returns {Boolean} Is it a default port for the given protocol
 * @api private
 */
module.exports = function required(port, protocol) {
  protocol = protocol.split(':')[0];
  port = +port;

  if (!port) return false;

  switch (protocol) {
    case 'http':
    case 'ws':
    return port !== 80;

    case 'https':
    case 'wss':
    return port !== 443;

    case 'ftp':
    return port !== 21;

    case 'gopher':
    return port !== 70;

    case 'file':
    return false;
  }

  return port !== 0;
};


/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(102);


/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, module) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ponyfill = __webpack_require__(103);

var _ponyfill2 = _interopRequireDefault(_ponyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var root; /* global window */


if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (true) {
  root = module;
} else {
  root = Function('return this')();
}

var result = (0, _ponyfill2['default'])(root);
exports['default'] = result;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2), __webpack_require__(22)(module)))

/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
	value: true
});
exports['default'] = symbolObservablePonyfill;
function symbolObservablePonyfill(root) {
	var result;
	var _Symbol = root.Symbol;

	if (typeof _Symbol === 'function') {
		if (_Symbol.observable) {
			result = _Symbol.observable;
		} else {
			result = _Symbol('observable');
			_Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
};

/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// What is the size of the images, in pixels?
const IMAGE_SIZE = 128;

const hexToRgb = __webpack_require__(77);
const urlParse = __webpack_require__(9);

const sites = __webpack_require__(105).map(site => {
  return Object.assign({}, site, {background_color_rgb: hexToRgb(site.background_color)});
});

function getDomain(url) {
  let domain = urlParse(url, false).host;
  if (domain && domain.startsWith("www.")) {
    domain = domain.slice(4);
  }
  return domain;
}

const sitesByDomain = {};
sites.forEach(site => {
  if ("url" in site) {
    sitesByDomain[getDomain(site.url)] = site;
  }
  if ("urls" in site) {
    for (let url of site.urls) {
      sitesByDomain[getDomain(url)] = site;
    }
  }
});

/**
 * Get the site data for the given url.
 * Returns and empty object if there is no match.
 */
function getSiteData(url) {
  let siteData = {};
  let key;
  try {
    key = getDomain(url);
  } catch (e) {
    key = null;
  }
  if (key && key in sitesByDomain) {
    siteData = sitesByDomain[key];
  }
  return siteData;
}

module.exports.sites = sites;
module.exports.getSiteData = getSiteData;
module.exports.IMAGE_SIZE = IMAGE_SIZE;


/***/ }),
/* 105 */
/***/ (function(module, exports) {

module.exports = [
	{
		"title": "aa",
		"url": "https://www.aa.com/",
		"image_url": "aa-com.png",
		"background_color": "#FAFAFA",
		"domain": "aa.com"
	},
	{
		"title": "abcnews.go",
		"url": "http://abcnews.go.com/",
		"image_url": "abcnews-go-com.png",
		"background_color": "#FFF",
		"domain": "abcnews.go.com"
	},
	{
		"title": "about",
		"url": "http://www.about.com/",
		"image_url": "about-com.png",
		"background_color": "#FFF",
		"domain": "about.com"
	},
	{
		"title": "accuweather",
		"url": "http://www.accuweather.com/",
		"image_url": "accuweather-com.png",
		"background_color": "#f56b17",
		"domain": "accuweather.com"
	},
	{
		"title": "adobe",
		"url": "http://www.adobe.com/",
		"image_url": "adobe-com.png",
		"background_color": "#e22919",
		"domain": "adobe.com"
	},
	{
		"title": "adp",
		"url": "http://www.adp.com/",
		"image_url": "adp-com.png",
		"background_color": "#f02311",
		"domain": "adp.com"
	},
	{
		"title": "airbnb",
		"url": "https://www.airbnb.com/",
		"image_url": "airbnb-com.png",
		"background_color": "#ff585a",
		"domain": "airbnb.com"
	},
	{
		"title": "allrecipes",
		"url": "http://allrecipes.com/",
		"image_url": "allrecipes-com.png",
		"background_color": "#ffb333",
		"domain": "allrecipes.com"
	},
	{
		"title": "amazon",
		"url": "http://www.amazon.com/",
		"image_url": "amazon-com.png",
		"background_color": "#FFF",
		"domain": "amazon.com"
	},
	{
		"title": "americanexpress",
		"url": "https://www.americanexpress.com",
		"image_url": "americanexpress-com.png",
		"background_color": "#e0e0e0",
		"domain": "americanexpress.com"
	},
	{
		"title": "ancestry",
		"url": "http://www.ancestry.com/",
		"image_url": "ancestry-com.png",
		"background_color": "#9bbf2f",
		"domain": "ancestry.com"
	},
	{
		"title": "answers",
		"url": "http://www.answers.com",
		"image_url": "answers-com.png",
		"background_color": "#3c67d5",
		"domain": "answers.com"
	},
	{
		"title": "aol",
		"url": "http://www.aol.com/",
		"image_url": "aol-com.png",
		"background_color": "#e0e0e0",
		"domain": "aol.com"
	},
	{
		"title": "apple",
		"url": "http://www.apple.com/",
		"image_url": "apple-com.png",
		"background_color": "#6d6e71",
		"domain": "apple.com"
	},
	{
		"title": "ask.com",
		"url": "http://www.ask.com",
		"image_url": "ask-com.png",
		"background_color": "#cf0000",
		"domain": "ask.com"
	},
	{
		"title": "att",
		"url": "https://www.att.com/",
		"image_url": "att-com.png",
		"background_color": "#5ba1ca",
		"domain": "att.com"
	},
	{
		"title": "aws.amazon",
		"url": "https://aws.amazon.com/",
		"image_url": "amazonaws-com.png",
		"background_color": "#FFF",
		"domain": "aws.amazon.com"
	},
	{
		"title": "baidu",
		"url": "http://baidu.com/",
		"image_url": "baidu-com.png",
		"background_color": "#c33302",
		"domain": "baidu.com"
	},
	{
		"title": "bankofamerica",
		"url": "https://www.bankofamerica.com",
		"image_url": "bankofamerica-com.png",
		"background_color": "#eb3146",
		"domain": "bankofamerica.com"
	},
	{
		"title": "bbc",
		"url": "http://www.bbc.com/",
		"image_url": "bbc-com.png",
		"background_color": "#000000",
		"domain": "bbc.com"
	},
	{
		"title": "bestbuy",
		"url": "http://www.bestbuy.com",
		"image_url": "bestbuy-com.png",
		"background_color": "#003a65",
		"domain": "bestbuy.com"
	},
	{
		"title": "bing",
		"url": "http://www.bing.com/",
		"image_url": "bing-com.png",
		"background_color": "#138484",
		"domain": "bing.com"
	},
	{
		"title": "blackboard",
		"url": "http://www.blackboard.com/",
		"image_url": "blackboard-com.png",
		"background_color": "#e6e6e6",
		"domain": "blackboard.com"
	},
	{
		"title": "bleacherreport",
		"url": "http://bleacherreport.com/",
		"image_url": "bleacherreport-com.png",
		"background_color": "#ec412e",
		"domain": "bleacherreport.com"
	},
	{
		"title": "blogger",
		"url": "https://www.blogger.com/home",
		"image_url": "blogger-com.png",
		"background_color": "#ff8822",
		"domain": "blogger.com"
	},
	{
		"title": "box",
		"url": "https://www.box.com/",
		"image_url": "box-com.png",
		"background_color": "#4daee8",
		"domain": "box.com"
	},
	{
		"title": "businessinsider",
		"url": "http://www.businessinsider.com",
		"image_url": "businessinsider-com.png",
		"background_color": "#1d5b7d",
		"domain": "businessinsider.com"
	},
	{
		"title": "buzzfeed",
		"url": "http://www.buzzfeed.com/index",
		"image_url": "buzzfeed-com.png",
		"background_color": "#ee3322",
		"domain": "buzzfeed.com"
	},
	{
		"title": "buzzlie",
		"url": "http://buzzlie.com/",
		"image_url": "buzzlie-com.png",
		"background_color": "#ff68b6",
		"domain": "buzzlie.com"
	},
	{
		"title": "California",
		"url": "http://ca.gov/",
		"image_url": "ca-gov.png",
		"background_color": "#000201",
		"domain": "ca.gov"
	},
	{
		"title": "capitalone",
		"url": "https://www.capitalone.com/",
		"image_url": "capitalone-com.png",
		"background_color": "#303e4f",
		"domain": "capitalone.com"
	},
	{
		"title": "cbsnews",
		"url": "http://www.cbsnews.com/",
		"image_url": "cbsnews-com.png",
		"background_color": "#000",
		"domain": "cbsnews.com"
	},
	{
		"title": "cbssports",
		"url": "http://www.cbssports.com/",
		"image_url": "cbssports-com.png",
		"background_color": "#014a8f",
		"domain": "cbssports.com"
	},
	{
		"title": "chase",
		"url": "https://www.chase.com",
		"image_url": "chase-com.png",
		"background_color": "#0d68c1",
		"domain": "chase.com"
	},
	{
		"title": "cnet",
		"url": "http://www.cnet.com/",
		"image_url": "cnet-com.png",
		"background_color": "#FFF",
		"domain": "cnet.com"
	},
	{
		"title": "cnn",
		"url": "http://www.cnn.com",
		"image_url": "cnn-com.png",
		"background_color": "#d41c1e",
		"domain": "cnn.com"
	},
	{
		"title": "comcast",
		"urls": [
			"http://www.comcast.net/",
			"http://www.xfinity.com/"
		],
		"image_url": "xfinity-com.png",
		"background_color": "#000",
		"domain": "comcast.net"
	},
	{
		"title": "conservativetribune",
		"url": "http://conservativetribune.com/",
		"image_url": "conservativetribune-com.png",
		"background_color": "#ae0001",
		"domain": "conservativetribune.com"
	},
	{
		"title": "costco",
		"url": "http://www.costco.com/",
		"image_url": "costco-com.png",
		"background_color": "#005bad",
		"domain": "costco.com"
	},
	{
		"title": "craigslist",
		"url": "http://craigslist.org/",
		"image_url": "craigslist-org.png",
		"background_color": "#652892",
		"domain": "craigslist.org"
	},
	{
		"title": "dailymail",
		"url": "http://www.dailymail.co.uk/",
		"image_url": "dailymail-co-uk.png",
		"background_color": "#0064c1",
		"domain": "dailymail.co.uk"
	},
	{
		"title": "dailybeast",
		"url": "https://www.thedailybeast.com/",
		"image_url": "dailybeast-com.png",
		"background_color": "#f12c15",
		"domain": "dailybeast.com"
	},
	{
		"title": "delta",
		"url": "https://www.delta.com/",
		"image_url": "delta-com.png",
		"background_color": "#1d649e",
		"domain": "delta.com"
	},
	{
		"title": "deviantart",
		"url": "http://www.deviantart.com/",
		"image_url": "deviantart-com.png",
		"background_color": "#00ce3e",
		"domain": "deviantart.com"
	},
	{
		"title": "digg",
		"url": "http://digg.com/",
		"image_url": "digg-com.png",
		"background_color": "#000",
		"domain": "digg.com"
	},
	{
		"title": "diply",
		"url": "http://diply.com/",
		"image_url": "diply-com.png",
		"background_color": "#2168b3",
		"domain": "diply.com"
	},
	{
		"title": "discover",
		"urls": [
			"https://www.discover.com/",
			"https://www.discovercard.com/"
		],
		"image_url": "discovercard-com.png",
		"background_color": "#d6d6d6",
		"domain": "discover.com"
	},
	{
		"title": "dropbox",
		"url": "https://www.dropbox.com/",
		"image_url": "dropbox-com.png",
		"background_color": "#007fe2",
		"domain": "dropbox.com"
	},
	{
		"title": "drudgereport",
		"url": "http://drudgereport.com/",
		"image_url": "drudgereport-com.png",
		"background_color": "#FFF",
		"domain": "drudgereport.com"
	},
	{
		"title": "ebates",
		"url": "http://www.ebates.com/",
		"image_url": "ebates-com.png",
		"background_color": "#14af44",
		"domain": "ebates.com"
	},
	{
		"title": "ebay",
		"url": "http://www.ebay.com",
		"image_url": "ebay-com.png",
		"background_color": "#ededed",
		"domain": "ebay.com"
	},
	{
		"title": "espn.go",
		"url": "http://espn.go.com",
		"image_url": "espn-go-com.png",
		"background_color": "#4b4b4b",
		"domain": "espn.go.com"
	},
	{
		"title": "etsy",
		"url": "https://www.etsy.com/",
		"image_url": "etsy-com.png",
		"background_color": "#f76300",
		"domain": "etsy.com"
	},
	{
		"title": "eventbrite",
		"url": "https://www.eventbrite.com/",
		"image_url": "eventbrite-com.png",
		"background_color": "#ff8000",
		"domain": "eventbrite.com"
	},
	{
		"title": "expedia",
		"url": "https://www.expedia.com/",
		"image_url": "expedia-com.png",
		"background_color": "#003460",
		"domain": "expedia.com"
	},
	{
		"title": "facebook",
		"url": "https://www.facebook.com/",
		"image_url": "facebook-com.png",
		"background_color": "#3b5998",
		"domain": "facebook.com"
	},
	{
		"title": "faithtap",
		"url": "http://faithtap.com/",
		"image_url": "faithtap-com.png",
		"background_color": "#4c286f",
		"domain": "faithtap.com"
	},
	{
		"title": "fedex",
		"url": "http://www.fedex.com/",
		"image_url": "fedex-com.png",
		"background_color": "#391675",
		"domain": "fedex.com"
	},
	{
		"title": "feedly",
		"url": "http://feedly.com/",
		"image_url": "feedly-com.png",
		"background_color": "#20b447",
		"domain": "feedly.com"
	},
	{
		"title": "fitbit",
		"url": "https://www.fitbit.com/",
		"image_url": "fitbit-com.png",
		"background_color": "#00b0ba",
		"domain": "fitbit.com"
	},
	{
		"title": "flickr",
		"url": "https://www.flickr.com",
		"image_url": "flickr-com.png",
		"background_color": "#dcdcdc",
		"domain": "flickr.com"
	},
	{
		"title": "foodnetwork",
		"url": "http://www.foodnetwork.com/",
		"image_url": "foodnetwork-com.png",
		"background_color": "#f50024",
		"domain": "foodnetwork.com"
	},
	{
		"title": "forbes",
		"url": "http://www.forbes.com/",
		"image_url": "forbes-com.png",
		"background_color": "#4177ab",
		"domain": "forbes.com"
	},
	{
		"title": "foxnews",
		"url": "http://www.foxnews.com",
		"image_url": "foxnews-com.png",
		"background_color": "#9e0b0f",
		"domain": "foxnews.com"
	},
	{
		"title": "gap",
		"url": "http://www.gap.com/",
		"image_url": "gap-com.png",
		"background_color": "#002861",
		"domain": "gap.com"
	},
	{
		"title": "gawker",
		"url": "http://gawker.com/",
		"image_url": "gawker-com.png",
		"background_color": "#d75343",
		"domain": "gawker.com"
	},
	{
		"title": "gfycat",
		"url": "http://gfycat.com/",
		"image_url": "gfycat-com.png",
		"background_color": "#eaeaea",
		"domain": "gfycat.com"
	},
	{
		"title": "GitHub",
		"url": "https://github.com/",
		"image_url": "github-com.png",
		"background_color": "#000",
		"domain": "github.com"
	},
	{
		"title": "gizmodo",
		"url": "http://gizmodo.com/",
		"image_url": "gizmodo-com.png",
		"background_color": "#000",
		"domain": "gizmodo.com"
	},
	{
		"title": "glassdoor",
		"url": "https://www.glassdoor.com/",
		"image_url": "glassdoor-com.png",
		"background_color": "#7aad28",
		"domain": "glassdoor.com"
	},
	{
		"title": "go",
		"url": "http://go.com",
		"image_url": "go-com.png",
		"background_color": "#000",
		"domain": ".com"
	},
	{
		"title": "goodreads",
		"url": "http://www.goodreads.com/",
		"image_url": "goodreads-com.png",
		"background_color": "#382110",
		"domain": "goodreads.com"
	},
	{
		"title": "google",
		"url": "https://www.google.com/",
		"image_url": "google-com.png",
		"background_color": "#FFF",
		"domain": "google.com"
	},
	{
		"title": "admin.google",
		"url": "https://admin.google.com/",
		"image_url": "google-admin.png",
		"background_color": "#FFF",
		"domain": "admin.google.com"
	},
	{
		"title": "calendar.google",
		"url": "https://calendar.google.com/",
		"image_url": "google-calendar.png",
		"background_color": "#FFF",
		"domain": "calendar.google.com"
	},
	{
		"title": "contacts.google",
		"url": "https://contacts.google.com/",
		"image_url": "google-contacts.png",
		"background_color": "#FFF",
		"domain": "contacts.google.com"
	},
	{
		"title": "docs.google",
		"url": "https://docs.google.com/",
		"image_url": "google-docs.png",
		"background_color": "#FFF",
		"domain": "docs.google.com"
	},
	{
		"title": "drive.google",
		"url": "https://drive.google.com/",
		"image_url": "google-drive.png",
		"background_color": "#FFF",
		"domain": "drive.google.com"
	},
	{
		"title": "forms.google",
		"url": "https://forms.google.com/",
		"image_url": "google-forms.png",
		"background_color": "#FFF",
		"domain": "forms.google.com"
	},
	{
		"title": "gmail",
		"urls": [
			"https://mail.google.com/",
			"https://gmail.com"
		],
		"image_url": "google-gmail.png",
		"background_color": "#FFF",
		"domain": "mail.google.com"
	},
	{
		"title": "groups.google",
		"url": "https://groups.google.com/",
		"image_url": "google-groups.png",
		"background_color": "#FFF",
		"domain": "groups.google.com"
	},
	{
		"title": "hangouts.google",
		"url": "https://hangouts.google.com/",
		"image_url": "google-hangouts.png",
		"background_color": "#FFF",
		"domain": "hangouts.google.com"
	},
	{
		"title": "plus.google",
		"url": "https://plus.google.com/",
		"image_url": "google-plus.png",
		"background_color": "#FFF",
		"domain": "plus.google.com"
	},
	{
		"title": "sheets.google",
		"url": "https://sheets.google.com/",
		"image_url": "google-sheets.png",
		"background_color": "#FFF",
		"domain": "sheets.google.com"
	},
	{
		"title": "sites.google",
		"url": "https://sites.google.com/",
		"image_url": "google-sites.png",
		"background_color": "#FFF",
		"domain": "sites.google.com"
	},
	{
		"title": "slides.google",
		"url": "https://slides.google.com/",
		"image_url": "google-slides.png",
		"background_color": "#FFF",
		"domain": "slides.google.com"
	},
	{
		"title": "photos.google",
		"url": "https://photos.google.com/",
		"image_url": "google-photos.png",
		"background_color": "#FFF",
		"domain": "photos.google.com"
	},
	{
		"title": "images.google",
		"url": "https://images.google.com/",
		"image_url": "images-google-com.png",
		"background_color": "#FFF",
		"domain": "images.google.com"
	},
	{
		"title": "groupon",
		"url": "https://www.groupon.com/",
		"image_url": "groupon-com.png",
		"background_color": "#53a318",
		"domain": "groupon.com"
	},
	{
		"title": "homedepot",
		"url": "http://www.homedepot.com/",
		"image_url": "homedepot-com.png",
		"background_color": "#f7d5a4",
		"domain": "homedepot.com"
	},
	{
		"title": "houzz",
		"url": "https://www.houzz.com/",
		"image_url": "houzz-com.png",
		"background_color": "#52a02a",
		"domain": "houzz.com"
	},
	{
		"title": "huffingtonpost",
		"url": "http://www.huffingtonpost.com/",
		"image_url": "huffingtonpost-com.png",
		"background_color": "#7dbdb8",
		"domain": "huffingtonpost.com"
	},
	{
		"title": "hulu",
		"url": "http://www.hulu.com/",
		"image_url": "hulu-com.png",
		"background_color": "#97c64f",
		"domain": "hulu.com"
	},
	{
		"title": "ign",
		"url": "http://www.ign.com/",
		"image_url": "ign-com.png",
		"background_color": "#ff0000",
		"domain": "ign.com"
	},
	{
		"title": "ikea",
		"url": "http://www.ikea.com/",
		"image_url": "ikea-com.png",
		"background_color": "#00329c",
		"domain": "ikea.com"
	},
	{
		"title": "imdb",
		"url": "http://www.imdb.com/",
		"image_url": "imdb-com.png",
		"background_color": "#ffd100",
		"domain": "imdb.com"
	},
	{
		"title": "imgur",
		"url": "http://imgur.com/",
		"image_url": "imgur-com.png",
		"background_color": "#2a2c25",
		"domain": "imgur.com"
	},
	{
		"title": "instagram",
		"url": "https://www.instagram.com/",
		"image_url": "instagram-com.png",
		"background_color": "#0b558a",
		"domain": "instagram.com"
	},
	{
		"title": "instructure",
		"url": "https://www.instructure.com/",
		"image_url": "instructure-com.png",
		"background_color": "#efefef",
		"domain": "instructure.com"
	},
	{
		"title": "intuit",
		"url": "http://www.intuit.com/",
		"image_url": "intuit-com.png",
		"background_color": "#f6f6f6",
		"domain": "intuit.com"
	},
	{
		"title": "irs",
		"url": "https://www.irs.gov/",
		"image_url": "irs-gov.png",
		"background_color": "#efefef",
		"domain": "irs.gov"
	},
	{
		"title": "invision",
		"urls": [
			"https://www.invisionapp.com/",
			"https://mozilla.invisionapp.com/"
		],
		"image_url": "invision-com.png",
		"background_color": "#ff2e63",
		"domain": "invisionapp.com"
	},
	{
		"title": "jcpenney",
		"url": "http://www.jcpenney.com/",
		"image_url": "jcpenney-com.png",
		"background_color": "#fa0026",
		"domain": "jcpenney.com"
	},
	{
		"title": "jd",
		"url": "http://www.jd.com/",
		"image_url": "jd-com.png",
		"background_color": "#e50000",
		"domain": "jd.com"
	},
	{
		"title": "kayak",
		"url": "https://www.kayak.com/",
		"image_url": "kayak-com.png",
		"background_color": "#fff",
		"domain": "kayak.com"
	},
	{
		"title": "kohl's",
		"url": "http://www.kohls.com",
		"image_url": "kohls-com.png",
		"background_color": "#000",
		"domain": "kohls.com"
	},
	{
		"title": "latimes",
		"url": "http://www.latimes.com/",
		"image_url": "latimes-com.png",
		"background_color": "#FFF",
		"domain": "latimes.com"
	},
	{
		"title": "lifehacker",
		"url": "http://lifehacker.com/",
		"image_url": "lifehacker-com.png",
		"background_color": "#94b330",
		"domain": "lifehacker.com"
	},
	{
		"title": "linkedin",
		"url": "https://www.linkedin.com/",
		"image_url": "linkedin-com.png",
		"background_color": "#00659b",
		"domain": "linkedin.com"
	},
	{
		"title": "lowes",
		"url": "http://www.lowes.com/",
		"image_url": "lowes-com.png",
		"background_color": "#004793",
		"domain": "lowes.com"
	},
	{
		"title": "macys",
		"url": "http://www.macys.com/",
		"image_url": "macys-com.png",
		"background_color": "#ea0000",
		"domain": "macys.com"
	},
	{
		"title": "login.microsoftonline",
		"url": "https://login.microsoftonline.com/",
		"image_url": "microsoftonline-com.png",
		"background_color": "#ce4f00",
		"domain": "login.microsoftonline.com"
	},
	{
		"title": "mail.live",
		"url": "https://mail.live.com",
		"image_url": "live-com.png",
		"background_color": "#0070c9",
		"domain": "mail.live.com"
	},
	{
		"title": "mapquest",
		"url": "http://www.mapquest.com/",
		"image_url": "mapquest-com.png",
		"background_color": "#373737",
		"domain": "mapquest.com"
	},
	{
		"title": "mashable",
		"url": "http://mashable.com/stories/",
		"image_url": "mashable-com.png",
		"background_color": "#00aef0",
		"domain": "mashable.com"
	},
	{
		"title": "microsoft",
		"url": "http://www.microsoft.com/",
		"image_url": "microsoft-com.png",
		"background_color": "#FFF",
		"domain": "microsoft.com"
	},
	{
		"title": "mlb",
		"url": "http://mlb.mlb.com/",
		"image_url": "mlb-com.png",
		"background_color": "#ffffff",
		"domain": "mlb.com"
	},
	{
		"title": "msn",
		"url": "http://www.msn.com/",
		"image_url": "msn-com.png",
		"background_color": "#000",
		"domain": "msn.com"
	},
	{
		"title": "nbcnews",
		"url": "http://www.nbcnews.com/",
		"image_url": "nbcnews-com.png",
		"background_color": "#003a51",
		"domain": "nbcnews.com"
	},
	{
		"title": "netflix",
		"url": "https://www.netflix.com/",
		"image_url": "netflix-com.png",
		"background_color": "#000",
		"domain": "netflix.com"
	},
	{
		"title": "newegg",
		"url": "http://www.newegg.com/",
		"image_url": "newegg-com.png",
		"background_color": "#cecece",
		"domain": "newegg.com"
	},
	{
		"title": "news.ycombinator",
		"url": "https://news.ycombinator.com/",
		"image_url": "news-ycombinator-com.png",
		"background_color": "#D46D1D",
		"domain": "news.ycombinator.com"
	},
	{
		"title": "nih",
		"url": "http://www.nih.gov/",
		"image_url": "nih-gov.png",
		"background_color": "#efefef",
		"domain": "nih.gov"
	},
	{
		"title": "nordstrom",
		"url": "http://shop.nordstrom.com/",
		"image_url": "nordstrom-com.png",
		"background_color": "#7f7d7a",
		"domain": "nordstrom.com"
	},
	{
		"title": "npr",
		"url": "http://www.npr.org/",
		"image_url": "npr-org.png",
		"background_color": "#FFF",
		"domain": "npr.org"
	},
	{
		"title": "nypost",
		"url": "http://nypost.com/",
		"image_url": "nypost-com.png",
		"background_color": "#FFF",
		"domain": "nypost.com"
	},
	{
		"title": "nytimes",
		"url": "http://www.nytimes.com",
		"image_url": "nytimes-com.png",
		"background_color": "#FFF",
		"domain": "nytimes.com"
	},
	{
		"title": "office",
		"url": "https://www.office.com/",
		"image_url": "office-com.png",
		"background_color": "#000",
		"domain": "office.com"
	},
	{
		"title": "online.citi",
		"url": "https://online.citi.com/",
		"image_url": "citi-com.png",
		"background_color": "#FFF",
		"domain": "online.citi.com"
	},
	{
		"title": "overstock",
		"url": "http://www.overstock.com/",
		"image_url": "overstock-com.png",
		"background_color": "#fff",
		"domain": "overstock.com"
	},
	{
		"title": "pandora",
		"url": "http://www.pandora.com/",
		"image_url": "pandora-com.png",
		"background_color": "#efefef",
		"domain": "pandora.com"
	},
	{
		"title": "Patch",
		"url": "http://patch.com",
		"image_url": "patch-com.png",
		"background_color": "#519442",
		"domain": "patch.com"
	},
	{
		"title": "paypal",
		"url": "https://www.paypal.com/home",
		"image_url": "paypal-com.png",
		"background_color": "#009cde",
		"domain": "paypal.com"
	},
	{
		"title": "people.com",
		"url": "http://www.people.com/",
		"image_url": "people-com.png",
		"background_color": "#27c4ff",
		"domain": "people.com"
	},
	{
		"title": "pinterest",
		"url": "https://www.pinterest.com/",
		"image_url": "pinterest-com.png",
		"background_color": "#ba212b",
		"domain": "pinterest.com"
	},
	{
		"title": "politico",
		"url": "http://www.politico.com/",
		"image_url": "politico-com.png",
		"background_color": "#9f0000",
		"domain": "politico.com"
	},
	{
		"title": "quora",
		"url": "https://www.quora.com/",
		"image_url": "quora-com.png",
		"background_color": "#bb2920",
		"domain": "quora.com"
	},
	{
		"title": "qq",
		"url": "https://www.qq.com/",
		"image_url": "qq-com.png",
		"background_color": "#2d91da",
		"domain": "qq.com"
	},
	{
		"title": "realtor",
		"url": "http://www.realtor.com/",
		"image_url": "realtor-com.png",
		"background_color": "#fcfcfc",
		"domain": "realtor.com"
	},
	{
		"title": "reddit",
		"url": "https://www.reddit.com/",
		"image_url": "reddit-com.png",
		"background_color": "#cee3f8",
		"domain": "reddit.com"
	},
	{
		"title": "salesforce",
		"url": "http://www.salesforce.com/",
		"image_url": "salesforce-com.png",
		"background_color": "#efefef",
		"domain": "salesforce.com"
	},
	{
		"title": "sears",
		"url": "http://www.sears.com/",
		"image_url": "sears-com.png",
		"background_color": "#00265a",
		"domain": "sears.com"
	},
	{
		"title": "sina",
		"url": "http://www.sina.com/",
		"image_url": "sina-com.png",
		"background_color": "#ff0000",
		"domain": "sina.com"
	},
	{
		"title": "slate",
		"url": "http://www.slate.com/",
		"image_url": "slate-com.png",
		"background_color": "#670033",
		"domain": "slate.com"
	},
	{
		"title": "slickdeals",
		"url": "http://slickdeals.net",
		"image_url": "slickdeals-net.png",
		"background_color": "#0072bd",
		"domain": "slickdeals.net"
	},
	{
		"title": "soundcloud",
		"url": "https://soundcloud.com/",
		"image_url": "soundcloud-com.png",
		"background_color": "#F95300",
		"domain": "soundcloud.com"
	},
	{
		"title": "southwest",
		"url": "https://www.southwest.com/",
		"image_url": "southwest-com.png",
		"background_color": "#3452c1",
		"domain": "southwest.com"
	},
	{
		"title": "spotify",
		"url": "https://www.spotify.com/",
		"image_url": "spotify-com.png",
		"background_color": "#dd08a7",
		"domain": "spotify.com"
	},
	{
		"title": "stackexchange",
		"url": "http://stackexchange.com/",
		"image_url": "stackexchange-com.png",
		"background_color": "#fff",
		"domain": "stackexchange.com"
	},
	{
		"title": "stackoverflow",
		"url": "http://stackoverflow.com/",
		"image_url": "stackoverflow-com.png",
		"background_color": "#f48024",
		"domain": "stackoverflow.com"
	},
	{
		"title": "staples",
		"url": "http://www.staples.com/",
		"image_url": "staples-com.png",
		"background_color": "#F3F1F3",
		"domain": "staples.com"
	},
	{
		"title": "strava",
		"url": "http://www.strava.com/",
		"image_url": "strava-com.png",
		"background_color": "#ff4b00",
		"domain": "strava.com"
	},
	{
		"title": "surveymonkey",
		"url": "https://www.surveymonkey.com/",
		"image_url": "surveymonkey-com.png",
		"background_color": "#a6c32f",
		"domain": "surveymonkey.com"
	},
	{
		"title": "swagbucks",
		"url": "http://www.swagbucks.com/",
		"image_url": "swagbucks-com.png",
		"background_color": "#5fb5d6",
		"domain": "swagbucks.com"
	},
	{
		"title": "talkingpointsmemo",
		"url": "http://talkingpointsmemo.com/",
		"image_url": "talkingpointsmemo-com.png",
		"background_color": "#FFF",
		"domain": "talkingpointsmemo.com"
	},
	{
		"title": "t-mobile",
		"url": "http://www.t-mobile.com/",
		"image_url": "t-mobile-com.png",
		"background_color": "#f32f9d",
		"domain": "t-mobile.com"
	},
	{
		"title": "taboola",
		"url": "https://www.taboola.com/",
		"image_url": "taboola-com.png",
		"background_color": "#1761a8",
		"domain": "taboola.com"
	},
	{
		"title": "taobao",
		"url": "https://www.taobao.com/",
		"image_url": "taobao-com.png",
		"background_color": "#ff8300",
		"domain": "taobao.com"
	},
	{
		"title": "target",
		"url": "http://www.target.com",
		"image_url": "target-com.png",
		"background_color": "#e81530",
		"domain": "target.com"
	},
	{
		"title": "thedailybeast",
		"url": "http://www.thedailybeast.com/",
		"image_url": "thedailybeast-com.png",
		"background_color": "#f12c15",
		"domain": "thedailybeast.com"
	},
	{
		"title": "theguardian",
		"url": "http://www.theguardian.com/",
		"image_url": "theguardian-com.png",
		"background_color": "#005E91",
		"domain": "theguardian.com"
	},
	{
		"title": "thesaurus",
		"url": "http://www.thesaurus.com/",
		"image_url": "thesaurus-com.png",
		"background_color": "#ffce80",
		"domain": "thesaurus.com"
	},
	{
		"title": "ticketmaster",
		"url": "http://www.ticketmaster.com/",
		"image_url": "ticketmaster-com.png",
		"background_color": "#fff",
		"domain": "ticketmaster.com"
	},
	{
		"title": "tripadvisor",
		"url": "https://www.tripadvisor.com/",
		"image_url": "tripadvisor-com.png",
		"background_color": "#5ba443",
		"domain": "tripadvisor.com"
	},
	{
		"title": "trulia",
		"url": "http://www.trulia.com/",
		"image_url": "trulia-com.png",
		"background_color": "#62be06",
		"domain": "trulia.com"
	},
	{
		"title": "tumblr",
		"url": "https://www.tumblr.com/",
		"image_url": "tumblr-com.png",
		"background_color": "#4ebd89",
		"domain": "tumblr.com"
	},
	{
		"title": "twitch",
		"url": "https://www.twitch.tv/",
		"image_url": "twitch-tv.png",
		"background_color": "#5A43A9",
		"domain": "twitch.tv"
	},
	{
		"title": "twitter",
		"url": "https://twitter.com/",
		"image_url": "twitter-com.png",
		"background_color": "#049ff5",
		"domain": "twitter.com"
	},
	{
		"title": "ups",
		"url": "https://www.ups.com/",
		"image_url": "ups-com.png",
		"background_color": "#281704",
		"domain": "ups.com"
	},
	{
		"title": "usaa",
		"url": "https://www.usaa.com/",
		"image_url": "usaa-com.png",
		"background_color": "#002a41",
		"domain": "usaa.com"
	},
	{
		"title": "usatoday",
		"url": "http://www.usatoday.com/",
		"image_url": "usatoday-com.png",
		"background_color": "#000",
		"domain": "usatoday.com"
	},
	{
		"title": "usbank",
		"url": "https://www.usbank.com/",
		"image_url": "usbank-com.png",
		"background_color": "#ff0022",
		"domain": "usbank.com"
	},
	{
		"title": "usps",
		"url": "https://www.usps.com/",
		"image_url": "usps-com.png",
		"background_color": "#f5f5f5",
		"domain": "usps.com"
	},
	{
		"title": "verizon",
		"url": "http://www.verizon.com/",
		"image_url": "verizon-com.png",
		"background_color": "#f00000",
		"domain": "verizon.com"
	},
	{
		"title": "verizonwireless",
		"url": "http://www.verizonwireless.com/",
		"image_url": "verizonwireless-com.png",
		"background_color": "#fff",
		"domain": "verizonwireless.com"
	},
	{
		"title": "vice",
		"url": "http://www.vice.com/",
		"image_url": "vice-com.png",
		"background_color": "#000",
		"domain": "vice.com"
	},
	{
		"title": "vimeo",
		"url": "https://vimeo.com/",
		"image_url": "vimeo-com.png",
		"background_color": "#00b1f2",
		"domain": "vimeo.com"
	},
	{
		"title": "walmart",
		"url": "http://www.walmart.com/",
		"image_url": "walmart-com.png",
		"background_color": "#fff",
		"domain": "walmart.com"
	},
	{
		"title": "washingtonpost",
		"url": "https://www.washingtonpost.com/regional/",
		"image_url": "washingtonpost-com.png",
		"background_color": "#fff",
		"domain": "washingtonpost.com"
	},
	{
		"title": "wayfair",
		"url": "http://www.wayfair.com/",
		"image_url": "wayfair-com.png",
		"background_color": "#ffffff",
		"domain": "wayfair.com"
	},
	{
		"title": "weather",
		"url": "https://weather.com/",
		"image_url": "weather-com.png",
		"background_color": "#2147a8",
		"domain": "weather.com"
	},
	{
		"title": "webmd",
		"url": "http://www.webmd.com/default.htm",
		"image_url": "webmd-com.png",
		"background_color": "#00639a",
		"domain": "webmd.com"
	},
	{
		"title": "wellsfargo",
		"url": "https://www.wellsfargo.com",
		"image_url": "wellsfargo-com.png",
		"background_color": "#ba1613",
		"domain": "wellsfargo.com"
	},
	{
		"title": "wikia",
		"url": "http://www.wikia.com/fandom",
		"image_url": "wikia-com.png",
		"background_color": "#f1f1f1",
		"domain": "wikia.com"
	},
	{
		"title": "wikihow",
		"url": "http://www.wikihow.com/",
		"image_url": "wikihow-com.png",
		"background_color": "#455046",
		"domain": "wikihow.com"
	},
	{
		"title": "wikipedia",
		"url": "https://www.wikipedia.org/",
		"image_url": "wikipedia-org.png",
		"background_color": "#fff",
		"domain": "wikipedia.org"
	},
	{
		"title": "wired",
		"url": "https://www.wired.com/",
		"image_url": "wired-com.png",
		"background_color": "#000",
		"domain": "wired.com"
	},
	{
		"title": "wittyfeed",
		"url": "http://www.wittyfeed.com",
		"image_url": "wittyfeed-com.png",
		"background_color": "#d83633",
		"domain": "wittyfeed.com"
	},
	{
		"title": "wordpress",
		"url": "https://wordpress.com",
		"image_url": "wordpress-com.png",
		"background_color": "#00739c",
		"domain": "wordpress.com"
	},
	{
		"title": "wsj",
		"url": "http://www.wsj.com/",
		"image_url": "wsj-com.png",
		"background_color": "#000000",
		"domain": "wsj.com"
	},
	{
		"title": "wunderground",
		"url": "https://www.wunderground.com/",
		"image_url": "wunderground-com.png",
		"background_color": "#000000",
		"domain": "wunderground.com"
	},
	{
		"title": "yahoo",
		"url": "https://www.yahoo.com/",
		"image_url": "yahoo-com.png",
		"background_color": "#5009a7",
		"domain": "yahoo.com"
	},
	{
		"title": "yelp",
		"url": "http://yelp.com/",
		"image_url": "yelp-com.png",
		"background_color": "#d83633",
		"domain": "yelp.com"
	},
	{
		"title": "youtube",
		"url": "https://www.youtube.com/",
		"image_url": "youtube-com.png",
		"background_color": "#db4338",
		"domain": "youtube.com"
	},
	{
		"title": "zillow",
		"url": "http://www.zillow.com/",
		"image_url": "zillow-com.png",
		"background_color": "#98c554",
		"domain": "zillow.com"
	}
];

/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

var slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//;

/**
 * These properties should not be copied or inherited from. This is only needed
 * for all non blob URL's as a blob URL does not include a hash, only the
 * origin.
 *
 * @type {Object}
 * @private
 */
var ignore = { hash: 1, query: 1 }
  , URL;

/**
 * The location object differs when your code is loaded through a normal page,
 * Worker or through a worker using a blob. And with the blobble begins the
 * trouble as the location object will contain the URL of the blob, not the
 * location of the page where our code is loaded in. The actual origin is
 * encoded in the `pathname` so we can thankfully generate a good "default"
 * location from it so we can generate proper relative URL's again.
 *
 * @param {Object|String} loc Optional default location object.
 * @returns {Object} lolcation object.
 * @api public
 */
module.exports = function lolcation(loc) {
  loc = loc || global.location || {};
  URL = URL || __webpack_require__(9);

  var finaldestination = {}
    , type = typeof loc
    , key;

  if ('blob:' === loc.protocol) {
    finaldestination = new URL(unescape(loc.pathname), {});
  } else if ('string' === type) {
    finaldestination = new URL(loc, {});
    for (key in ignore) delete finaldestination[key];
  } else if ('object' === type) {
    for (key in loc) {
      if (key in ignore) continue;
      finaldestination[key] = loc[key];
    }

    if (finaldestination.slashes === undefined) {
      finaldestination.slashes = slashes.test(loc.href);
    }
  }

  return finaldestination;
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 107 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var punycode = __webpack_require__(89);
var util = __webpack_require__(108);

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = __webpack_require__(92);

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};


/***/ }),
/* 108 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};


/***/ }),
/* 109 */
/***/ (function(module, exports) {

module.exports = require("@loader/options");

/***/ }),
/* 110 */
/***/ (function(module, exports) {

module.exports = require("sdk/base64");

/***/ }),
/* 111 */
/***/ (function(module, exports) {

module.exports = require("sdk/l10n/locale");

/***/ }),
/* 112 */
/***/ (function(module, exports) {

module.exports = require("sdk/page-mod");

/***/ }),
/* 113 */
/***/ (function(module, exports) {

module.exports = require("sdk/page-worker");

/***/ }),
/* 114 */
/***/ (function(module, exports) {

module.exports = require("sdk/private-browsing");

/***/ }),
/* 115 */
/***/ (function(module, exports) {

module.exports = require("sdk/windows");

/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* globals Task, ClientID */


const {PlacesProvider} = __webpack_require__(6);
const {MetadataStore, METASTORE_NAME} = __webpack_require__(29);
const {TelemetrySender} = __webpack_require__(31);
const {TabTracker} = __webpack_require__(30);
const {ActivityStreams} = __webpack_require__(28);
const {Cu} = __webpack_require__(0);

Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/Task.jsm");
const {OS} = Cu.import("resource://gre/modules/osfile.jsm", {});

// The constant to set the limit of MetadataStore reconnection
// The addon will try reconnecting to the database in the next minute periodically,
// if it fails to establish the connection in the addon initialization
const kMaxConnectRetry = 120;
const metadataExpiryInterval = 30 * 60 * 1000; // 30 minutes

let app = null;
let metadataStore = null;
let connectRetried = 0;
let reconnectTimeoutID = null;

Object.assign(exports, {
  main(options) {
    // options.loadReason can be install/enable/startup/upgrade/downgrade
    PlacesProvider.links.init();
    options.telemetry = false;

    Task.spawn(function*() {
      const clientID = yield ClientID.getClientID();
      options.clientID = clientID;
      const tabTracker = new TabTracker(options);
      const telemetrySender = new TelemetrySender();

      if (options.loadReason === "upgrade") {
        yield this.migrateMetadataStore();
      }
      metadataStore = new MetadataStore();
      try {
        yield metadataStore.asyncConnect();
        metadataStore.enableDataExpiryJob(metadataExpiryInterval);
      } catch (e) {
        this.reconnectMetadataStore();
      }
      app = new ActivityStreams(metadataStore, tabTracker, telemetrySender, options);
      try {
        app.init();
      } catch (e) {
        Cu.reportError(e);
      }
    }.bind(this));
  },

  /*
   * Attempts to move the old version of metadata store to the root profile directory.
   * If the move fails, remove the old one
   */
  migrateMetadataStore: Task.async(function*() {
    const sourcePath = OS.Path.join(OS.Constants.Path.localProfileDir, METASTORE_NAME);
    const destPath = OS.Path.join(OS.Constants.Path.profileDir, METASTORE_NAME);

    const exists = yield OS.File.exists(sourcePath);
    if (exists) {
      try {
        yield OS.File.move(sourcePath, destPath);
      } catch (e) {
        Cu.reportError(`Failed to move metadata store: ${e.message}. Removing the database file`);
        yield OS.File.remove(sourcePath);
      }
    }
  }),

  reconnectMetadataStore() {
    if (connectRetried > kMaxConnectRetry) {
      throw new Error("Metadata store reconnecting has reached the maximum limit");
    }

    reconnectTimeoutID = setTimeout(() => {
      metadataStore.asyncConnect().then(() => {
        metadataStore.enableDataExpiryJob(metadataExpiryInterval);
        connectRetried = 0;
      }).catch(error => {
        // increment the connect counter to avoid the endless retry
        connectRetried++;
        this.reconnectMetadataStore();
      });
    }, 500);
  },

  onUnload(reason) {
    if (app) {
      app.unload(reason);
      app = null;
    }

    if (reconnectTimeoutID) {
      clearTimeout(reconnectTimeoutID);
      reconnectTimeoutID = null;
    }

    if (metadataStore) {
      metadataStore.disableDataExpiryJob();
      if (reason === "uninstall" || reason === "disable") {
        metadataStore.asyncTearDown();
      } else {
        metadataStore.asyncClose();
      }
    }

    PlacesProvider.links.uninit();
  }
});


/***/ })
/******/ ]);
/* globals XPCOMUtils, Services, gPrincipal, EventEmitter, PlacesUtils, Task */

"use strict";

const {Ci, Cu} = require('chrome');

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function () {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyGetter(this, "gPrincipal", function () {
  let uri = Services.io.newURI("about:newtab", null, null);
  return Services.scriptSecurityManager.getNoAppCodebasePrincipal(uri);
});

// The maximum number of results PlacesProvider retrieves from history.
const HISTORY_RESULTS_LIMIT = 100;

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
   * Must be called before the provider is used.
   * Makes it easy to disable under pref
   */
  init: function PlacesProvider_init() {
    PlacesUtils.history.addObserver(this.historyObserver, true);
  },

  /**
   * Must be called before the provider is unloaded.
   */
  uninit: function PlacesProvider_uninit() {
    PlacesUtils.history.removeObserver(this.historyObserver);
  },

  /**
   * Gets the top frecent sites.
   *
   * @param options.limit {Integer} Maximum number of results to return. Max 100.
   *
   * @returns {Promise} Returns a promise with the array of links as payload.
   */
  getTopFrecentSites: Task.async(function*(options) {

    if (!options) {
      options = {};
    }

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
    let sqlQuery = "SELECT url, title, frecency, " +
                   "       last_visit_date as lastVisitDate, " +
                   "       \"history\" as type " +
                   "FROM " +
                   "(    " +
                   " SELECT rev_host, url, title, frecency, last_visit_date " +
                   " FROM moz_places " +
                   " WHERE hidden = 0 AND last_visit_date NOTNULL " +
                   " ORDER BY rev_host, frecency, last_visit_date, url DESC " +
                   ")    " +
                   "GROUP BY rev_host " +
                   "ORDER BY frecency DESC, lastVisitDate DESC, url " +
                   "LIMIT :limit";

    let links = yield this.executePlacesQuery(sqlQuery, {
                  columns: ["url", "title", "lastVisitDate", "frecency", "type"],
                  params: {limit: limit}
                });

    return links.filter(link => LinkChecker.checkLoadURI(link.url));
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
const gLinks = new Links();

exports.PlacesProvider = {
  LinkChecker: LinkChecker,
  links: gLinks,
};

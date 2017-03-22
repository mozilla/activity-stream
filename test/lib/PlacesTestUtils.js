/* globals XPCOMUtils, Task, PlacesUtils, NetUtil, Services, Bookmarks */
"use strict";

const {Ci, Cu, components} = require("chrome");
const {waitUntil} = require("sdk/test/utils");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "NetUtil",
  "resource://gre/modules/NetUtil.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Bookmarks",
  "resource://gre/modules/Bookmarks.jsm");

const PlacesTestUtils = Object.freeze({

  /**
   * Asynchronously adds visits to a page.
   *
   * @param {nsIURI} placeInfo
   *        Can be an nsIURI, in such a case a single LINK visit will be added.
   *        Otherwise can be an object describing the visit to add, or an array
   *        of these objects:
   *          { uri: nsIURI of the page,
   *            [optional] transition: one of the TRANSITION_* from nsINavHistoryService,
   *            [optional] title: title of the page,
   *            [optional] visitDate: visit date in microseconds from the epoch
   *            [optional] referrer: nsIURI of the referrer for this visit
   *          }
   *
   */
  addVisits: Task.async(function*(placeInfo) {
    let places = [];

    if (placeInfo instanceof Ci.nsIURI) {
      places.push({uri: placeInfo});
    } else if (Array.isArray(placeInfo)) {
      places.push(...placeInfo);
    } else {
      places.push(placeInfo);
    }

    /**
     * Keep track of the number of rows for final validation
     * NOTE: Needs to be synchronous!
     */
    function getPlacesRows() {
      let conn = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
      let stmt = conn.createStatement("SELECT id, url, title, frecency FROM moz_places");
      let rows = [];
      while (stmt.executeStep()) {
        rows.push({id: stmt.getInt32(0), url: stmt.getUTF8String(1), title: stmt.getUTF8String(2), frecency: stmt.getInt32(3)});
      }
      return rows;
    }
    let initialNumRows = getPlacesRows().length;

    // setup listeners for history events to validate db inserts and to ensure
    // that eventual queries will lead to expected results
    let urlList = places.map(place => place.uri.spec);

    let insertPromise = new Promise((resolve, reject) => {
      // Create mozIVisitInfo for each entry.
      let now = Date.now();
      for (let place of places) {
        if (typeof place.title !== "string") {
          place.title = `test visit for ${place.uri.spec}`;
        }
        place.visits = [{
          transitionType: place.transition === undefined ? Ci.nsINavHistoryService.TRANSITION_LINK : place.transition,
          visitDate: place.visitDate || (now++) * 1000,
          referrerURI: place.referrer
        }];
      }

      PlacesUtils.asyncHistory.updatePlaces(
        places,
        {
          handleError: function AAV_handleError(resultCode) {
            let ex = new components.Exception("Unexpected error in adding visits.",
                                              resultCode);
            reject(ex);
          },
          handleResult() {},
          handleCompletion: function UP_handleCompletion() {
            resolve();
          }
        }
      );
    });
    yield insertPromise;

    let urlSet = new Set(urlList);
    // poll every 10ms until history items appear on disk
    yield waitUntil(() => {
      // function needs to be synchronous!
      let rows = getPlacesRows();
      if ((rows.length - initialNumRows) !== urlList.length) {
        return false;
      }
      let rowChecked = 0;
      for (let row of rows) {
        if (urlSet.has(row.url) && row.frecency > -1 && row.title) {
          // check if all have completed
          rowChecked++;
        }
      }
      return rowChecked === urlList.length;
    }, 10);

    return urlList.length;
  }),

  /*
   * Add Favicons
   *
   * @param {Object} faviconURLs  keys are page URLs, values are associated favicon URLs.
   */
  addFavicons: Task.async(function*(faviconURLs) {
    let faviconPromises = [];
    if (faviconURLs) {
      for (let pageURL in faviconURLs) {
        if (!faviconURLs[pageURL]) {
          continue;
        }
        faviconPromises.push(new Promise((resolve, reject) => {
          let uri = NetUtil.newURI(pageURL);
          let faviconURI = NetUtil.newURI(faviconURLs[pageURL]);
          try {
            PlacesUtils.favicons.setAndFetchFaviconForPage(
              uri, faviconURI, false,
              PlacesUtils.favicons.FAVICON_LOAD_NON_PRIVATE, () => {
                resolve();
              },
              Services.scriptSecurityManager.getSystemPrincipal());
          } catch (ex) {
            reject(ex);
          }
        }));
      }
    }

    if (faviconPromises.length) {
      yield Promise.all(faviconPromises);
    }
  }),

  /**
   * Clear all history.
   */
  clearHistory: Task.async(function*() {
    let expirationFinished = new Promise(resolve => {
      Services.obs.addObserver(function observe(subj, topic, data) {
        Services.obs.removeObserver(observe, topic);
        resolve();
      }, PlacesUtils.TOPIC_EXPIRATION_FINISHED, false);
    });
    yield PlacesUtils.history.clear();
    yield expirationFinished;
  }),

  /**
   * Clear bookmarks
   */
  clearBookmarks() {
    // Synchronous!
    let conn = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
    let stmt = conn.createStatement("DELETE FROM moz_bookmarks WHERE type = 1");
    stmt.executeStep();
  },

  /*
   * Insert and bookmark a vists
   */
  insertAndBookmarkVisit: Task.async(function*(url) {
    yield this.addVisits({uri: NetUtil.newURI(url), visitDate: Date.now(), transition: PlacesUtils.history.TRANSITION_LINK});
    yield Bookmarks.insert({url, parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK});
  })
});

exports.PlacesTestUtils = PlacesTestUtils;

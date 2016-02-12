/* globals XPCOMUtils, Task, PlacesUtils, NetUtil, Services */
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
    let urlSet = new Set(urlList);
    let urlCount = Array.from(urlSet).reduce(
        (map, next) => map.set(next, 0),
        new Map()
    );
    // there are 3 notifications per place inserted
    let totalCount = urlList.length * 3;
    let notifCount = 0;

    let notifPromise = new Promise((resolve, reject) => {
      function collectNotifs(aURI) {
        if (!urlSet.has(aURI.spec)) {
          reject(new Error("unexpected url change notification"));
        }

        let count = urlCount.get(aURI.spec, 0) + 1;
        urlCount.set(aURI.spec, count);
        notifCount++;
        if (count === 3) {
          // ensure at most 3 notifs per URI obtained
          urlSet.delete(aURI.spec);
        }
        if (notifCount === totalCount) {
          PlacesUtils.history.removeObserver(historyObserver);
          resolve();
        }
      }
      let historyObserver = {
        onFrecencyChanged(aURI) {
          // we will receive 2 frecency change notifications
          collectNotifs(aURI);
        },
        onTitleChanged(aURI) {
          // we will receive 1 title change notification
          collectNotifs(aURI);
        },
        QueryInterface: XPCOMUtils.generateQI([Ci.nsINavHistoryObserver,
                                               Ci.nsISupportsWeakReference])
      };
      PlacesUtils.history.addObserver(historyObserver, true);
    });

    let insertPromise = new Promise((resolve, reject) => {
      // Create mozIVisitInfo for each entry.
      let now = Date.now();
      for (let place of places) {
        if (typeof place.title != "string") {
          place.title = "test visit for " + place.uri.spec;
        }
        place.visits = [{
          transitionType: place.transition === undefined ? Ci.nsINavHistoryService.TRANSITION_LINK
                                                             : place.transition,
          visitDate: place.visitDate || (now++) * 1000,
          referrerURI: place.referrer
        }];
      }

      PlacesUtils.asyncHistory.updatePlaces(
        places,
        {
          handleError: function AAV_handleError(resultCode, placeInfo) { // eslint-disable-line no-unused-vars
            let ex = new components.Exception("Unexpected error in adding visits.",
                                              resultCode);
            reject(ex);
          },
          handleResult: function() {},
          handleCompletion: function UP_handleCompletion() {
            resolve();
          }
        }
      );
    });

    yield notifPromise;
    yield insertPromise;

    let pollSet = new Set(urlList);
    // poll every 10ms until history items appear on disk
    yield waitUntil(function() {
      // function needs to be synchronous!
      let rows = getPlacesRows();
      if ((rows.length - initialNumRows) !== urlList.length) {
        return false;
      }
      let rowChecked = 0;
      for (let row of rows) {
        if (pollSet.has(row.url) && row.frecency > -1 && row.title) {
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
              PlacesUtils.favicons.FAVICON_LOAD_NON_PRIVATE, function() {
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
      Services.obs.addObserver(function observe(subj, topic, data) { // eslint-disable-line no-unused-vars
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
});

exports.PlacesTestUtils = PlacesTestUtils;

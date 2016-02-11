/* globals XPCOMUtils, Task, PlacesUtils, Services */
"use strict";

const {Ci, Cu} = require("chrome");
const {waitUntil} = require("sdk/test/utils");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
  "resource://gre/modules/PlacesUtils.jsm");

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
   */
  addVisits: Task.async(function*(placeInfo) {
    let places = [];

    if (placeInfo instanceof Ci.nsIURI) {
      places.push({uri: placeInfo});
    } else if (Symbol.iterator in Object(placeInfo)) {
      places.push(...placeInfo);
    } else {
      places.push(placeInfo);
    }

    // Keep track of the number of rows for final validation
    function* getPlacesRows() {
      let conn = yield PlacesUtils.promiseDBConnection();
      let rows = yield conn.execute("SELECT id, url, title, frecency FROM moz_places");
      return rows;
    }
    let initialNumRows = yield Task.spawn(getPlacesRows).length;

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
          let error = new Error(`unexpected url change notification: ${aURI}`);
          return reject(error);
        }
        let count = urlCount.get(aURI.spec) + 1;
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
        if (typeof place.title !== "string") {
          place.title = "test visit for " + place.uri.spec;
        }
        place.visits = [{
          transitionType: place.transition ? place.transition : Ci.nsINavHistoryService.TRANSITION_LINK,
          visitDate: place.visitDate || (now++) * 1000,
          referrerURI: place.referrer
        }];
      }

      PlacesUtils.asyncHistory.updatePlaces(
        places,
        {
          handleError(resultCode) { // eslint-disable-line no-unused-vars
            let error = new Error(`Unexpected error in adding visits: ${resultCode}`);
            reject(error);
          },
          handleResult() {
            //no-op
          },
          handleCompletion() {
            resolve();
          }
        }
      );
    });

    yield notifPromise;
    yield insertPromise;

    // poll every 10ms until history items appear on disk
    yield waitUntil(function*() {
      let rows = yield Task.spawn(getPlacesRows);
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
});

exports.PlacesTestUtils = PlacesTestUtils;

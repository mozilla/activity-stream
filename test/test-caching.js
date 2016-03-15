/* globals XPCOMUtils, Services, NetUtil, PlacesUtils */

"use strict";
const {Cu} = require("chrome");
const {before, after} = require("sdk/test/utils");
const test = require("sdk/test");
const tabs = require("sdk/tabs");
const simplePrefs = require("sdk/simple-prefs");
const {ActivityStreams} = require("lib/ActivityStreams");
const {PlacesTestUtils} = require("./lib/PlacesTestUtils");
const {PlacesProvider} = require("lib/PlacesProvider");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "NetUtil",
                                  "resource://gre/modules/NetUtil.jsm");

let gApp;
let gAppURL;
let gInitialCachePref = simplePrefs.prefs["query.cache"];

let makeNotifsPromise = (cacheStatus) => {
  return new Promise(resolve => {
    let notifSet = new Set([
        "getTopFrecentSites-cache",
        "getRecentBookmarks-cache",
        "getRecentLinks-cache",
        "getFrecentLinks-cache"
    ]);
    let notifCount = 0;
    let observer = function(subject, topic, data) {
      if (notifSet.has(topic) && data === cacheStatus) {
        notifCount++;
      }
      if (notifCount === notifSet.size) {
        for (let notif of notifSet) {
          Services.obs.removeObserver(observer, notif);
        }
        resolve(notifCount);
      }
    };

    for (let notif of notifSet) {
      Services.obs.addObserver(observer, notif);
    }
  });
};

let makePlacesCachePromise = () => {
  return new Promise(resolve => {
    let precacheNotif = "activity-streams-places-cache-complete";
    let waitForCache = (subject, topic, data) => {
      if (topic === precacheNotif) {
        Services.obs.removeObserver(waitForCache, precacheNotif);
        resolve();
      }
    };
    Services.obs.addObserver(waitForCache, precacheNotif);
  });
};

exports["test caching follows prefs"] = function*(assert) {
  let tabList = [];

  let hitNotifPromise = makeNotifsPromise("hit");
  tabs.open({
    url: gAppURL,
    onOpen: tab => {
      tabList.push(tab);
    }
  });
  yield hitNotifPromise;
  assert.ok(true, "cache hit notifications received");

  simplePrefs.prefs["query.cache"] = false;
  let missNotifPromise = makeNotifsPromise("miss");
  tabs.open({
    url: gAppURL,
    onOpen: tab => {
      tabList.push(tab);
    }
  });
  yield missNotifPromise;
  assert.ok(true, "cache hit notifications received");

  let tabClosePromises = [];
  for (let tab of tabList) {
    tabClosePromises.push(new Promise(resolve => {
      tab.close(() => {
        resolve();
      });
    }));
  }
  yield Promise.all(tabClosePromises);
};

exports["test cache invalidation on history change"] = function*(assert) {
  let placesCachePromise;

  placesCachePromise = makePlacesCachePromise();
  let visits = [
    {uri: NetUtil.newURI("https://example.com/"), visitDate: (new Date()).getTime() * 1000, transition: PlacesUtils.TRANSITION_TYPED},
  ];

  yield PlacesTestUtils.addVisits(visits);
  yield placesCachePromise;

  assert.ok(true, "places cache rebuilt after adding links");

  placesCachePromise = makePlacesCachePromise();
  yield PlacesTestUtils.clearHistory();
  yield placesCachePromise;

  assert.ok(true, "places cache rebuilt after clearing history");
};

before(exports, function*() {
  simplePrefs.prefs["query.cache"] = true;
  let placesCachePromise = makePlacesCachePromise();
  PlacesProvider.links.init();
  gApp = new ActivityStreams();
  gAppURL = gApp.appURLs[1];
  yield placesCachePromise;
});

after(exports, function() {
  gApp.unload();
  PlacesProvider.links.uninit();
  simplePrefs.prefs["query.cache"] = gInitialCachePref || false;
});
test.run(exports);

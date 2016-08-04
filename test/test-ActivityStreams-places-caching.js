/* globals XPCOMUtils, Services, NetUtil, PlacesUtils */

"use strict";
const {Cu} = require("chrome");
const {before, after} = require("sdk/test/utils");
const test = require("sdk/test");
const tabs = require("sdk/tabs");
const simplePrefs = require("sdk/simple-prefs");
const httpd = require("./lib/httpd");
const {doGetFile, getTestActivityStream} = require("./lib/utils");
const {PlacesTestUtils} = require("./lib/PlacesTestUtils");
const {PlacesProvider} = require("lib/PlacesProvider");
const {makeCachePromise} = require("./lib/cachePromises");
const {CONTENT_TO_ADDON} = require("common/event-constants");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "NetUtil",
                                  "resource://gre/modules/NetUtil.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

let gApp;
let gAppURL;
let gInitialCachePref = simplePrefs.prefs["query.cache"];

let makeNotifsPromise = cacheStatus => {
  return new Promise(resolve => {
    let notifSet = new Set([
      "getTopFrecentSites-cache",
      "getRecentBookmarks-cache",
      "getRecentLinks-cache",
      "getHighlightsLinks-cache",
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
      Services.obs.addObserver(observer, notif, false);
    }
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

  placesCachePromise = makeCachePromise("places");
  let visits = [
    {uri: NetUtil.newURI("https://example.com/"), visitDate: (new Date()).getTime() * 1000, transition: PlacesUtils.TRANSITION_TYPED},
  ];

  yield PlacesTestUtils.addVisits(visits);
  yield placesCachePromise;

  assert.ok(true, "places cache rebuilt after adding links");

  placesCachePromise = makeCachePromise("places");
  yield PlacesTestUtils.clearHistory();
  yield placesCachePromise;

  assert.ok(true, "places cache rebuilt after clearing history");
};

exports["test cache invalidation on blocklist change"] = function*(assert) {
  let placesCachePromise;

  placesCachePromise = makeCachePromise("places");
  let visits = [
    {uri: NetUtil.newURI("https://example1.com/"), visitDate: (new Date()).getTime() * 1000, transition: PlacesUtils.TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example2.com/"), visitDate: (new Date()).getTime() * 1000, transition: PlacesUtils.TRANSITION_TYPED},
  ];

  yield PlacesTestUtils.addVisits(visits);
  yield placesCachePromise;

  assert.ok(true, "places cache rebuilt after adding links");

  placesCachePromise = makeCachePromise("places");
  PlacesProvider.links.blockURL("https://example1.com/");
  yield placesCachePromise;
  placesCachePromise = makeCachePromise("places");
  PlacesProvider.links.blockURL("https://example2.com/");
  yield placesCachePromise;

  placesCachePromise = makeCachePromise("places");
  PlacesProvider.links.unblockURL("https://example1.com/");
  yield placesCachePromise;

  placesCachePromise = makeCachePromise("places");
  PlacesProvider.links.unblockAll();
  yield placesCachePromise;

  assert.ok(true, "places cache rebuilt after clearing history");
};

exports["test rebuilds don't clobber each other"] = function*(assert) {
  let placesCachePromise;

  // app init
  let path = "/activity-streams-places-changes.html";
  let port = 8099;
  let url = `http://localhost:${port}${path}`;
  let srv = httpd.startServerAsync(port, null, doGetFile("test/resources"));
  gApp.unload();
  placesCachePromise = makeCachePromise("places");
  gApp = getTestActivityStream({pageURL: url});
  yield placesCachePromise;

  // open page
  let pageReadyPromise = new Promise(resolve => {
    gApp.on(CONTENT_TO_ADDON, function handler(name, {msg}) {
      if (msg.type === "PAGE_READY") {
        gApp.off(CONTENT_TO_ADDON, handler);
        resolve();
      }
    });
  });

  let openTab;
  tabs.open({
    url,
    onOpen: tab => {
      openTab = tab;
    }
  });
  yield pageReadyPromise;

  // app messaging setup
  let msgCountPromise = new Promise(resolve => {
    let changeMsgCount = 0;
    let countChanges = (name, params) => {
      if (params.msg.type === "CHANGE_ACK") {
        changeMsgCount++;
        if (changeMsgCount === 15) {
          // we expect 5 history entries, i.e. 15 places changes
          gApp.off(CONTENT_TO_ADDON, countChanges);
          resolve();
        }
      }
    };
    gApp.on(CONTENT_TO_ADDON, countChanges);
  });

  // notifications setup. The order is important as the tab open above will trigger a history change
  let notifCount = 0;
  let notif = "activity-streams-places-cache-complete";
  let countNotif = (subject, topic, data) => {
    if (topic === notif) {
      notifCount++;
    }
  };
  Services.obs.addObserver(countNotif, notif, false);

  // phase 1: add history visit and count
  placesCachePromise = makeCachePromise("places");
  yield PlacesTestUtils.addVisits({uri: NetUtil.newURI("https://example.com/0"), visitDate: (new Date()).getTime() * 1000, transition: PlacesUtils.TRANSITION_TYPED});
  yield placesCachePromise;

  // phase 2: add history visit and don't count
  gApp._populatingCache.places = true;

  let visits = [
    {uri: NetUtil.newURI("https://example.com/1"), visitDate: (new Date()).getTime() * 1000, transition: PlacesUtils.TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example.com/2"), visitDate: (new Date()).getTime() * 1000, transition: PlacesUtils.TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example.com/3"), visitDate: (new Date()).getTime() * 1000, transition: PlacesUtils.TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example.com/4"), visitDate: (new Date()).getTime() * 1000, transition: PlacesUtils.TRANSITION_TYPED},
  ];
  yield PlacesTestUtils.addVisits(visits);

  // tests: 5 * 3 places changes messages received and only one cache rebuild occured
  yield msgCountPromise;
  assert.equal(notifCount, 1, "only the initial notification has been counted");

  // cleanup
  yield new Promise(resolve => {
    openTab.close(() => {
      resolve();
    });
  });
  gApp._populatingCache.places = false;
  Services.obs.removeObserver(countNotif, notif);
  yield new Promise(resolve => {
    srv.stop(() => {
      resolve();
    });
  });
};

before(exports, function*() {
  simplePrefs.prefs["query.cache"] = true;
  let placesCachePromise = makeCachePromise("places");
  PlacesProvider.links.init();
  gApp = getTestActivityStream();
  gAppURL = gApp.appURLs[1];
  yield placesCachePromise;
});

after(exports, function() {
  gApp.unload();
  PlacesProvider.links.uninit();
  simplePrefs.prefs["query.cache"] = gInitialCachePref || false;
});

test.run(exports);

/* globals Services, XPCOMUtils, windowMediator, SessionStore */

"use strict";
const simplePrefs = require("sdk/simple-prefs");

const {before, after} = require("sdk/test/utils");
const tabs = require("sdk/tabs");
const {setTimeout} = require("sdk/timers");
const {ActivityStreams} = require("lib/ActivityStreams");
const {PerfMeter} = require("lib/PerfMeter");
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

XPCOMUtils.defineLazyModuleGetter(this, "SessionStore",
                                  "resource:///modules/sessionstore/SessionStore.jsm");

let app;

function openTestTab(openUrl, notifyEvent) {
  return new Promise(resolve => {
    let tabData = {};
    function onShow(tab) {
      tabData.tab = tab;
      if (!notifyEvent) {
        resolve(tabData);
      }
    }

    function onNotify(subject, topic, data) {
      Services.obs.removeObserver(onNotify, notifyEvent);
      tabData.notifyData = JSON.parse(data);
      resolve(tabData);
    }

    if (notifyEvent) {
      Services.obs.addObserver(onNotify, notifyEvent);
    }

    // open the page in timeout, to make it fire after we return
    tabs.open({url: openUrl, onPageShow: onShow});
  });
}

function prefSetter(value) {
  return new Promise(resolve => {
    function onPrefChange() {
      Services.obs.removeObserver(onPrefChange, "performance-pref-changed");
      resolve();
    }
    Services.obs.addObserver(onPrefChange, "performance-pref-changed");
    simplePrefs.prefs["performance.log"] = value;
  });
}

function verifyPerfEvents(eventsArray, assert) {
  let exectedEvents = new Set([
    "TAB_OPEN",
    "TAB_RELOAD",
    "WORKER_ATTACHED",
    "TAB_READY",
    "TOP_FRECENT_SITES_REQUEST",
    "RECENT_LINKS_REQUEST",
    "FRECENT_LINKS_REQUEST",
    "RECENT_BOOKMARKS_REQUEST",
    "SEARCH_STATE_REQUEST",
    "NOTIFY_PERFORMANCE",
    "TOP_FRECENT_SITES_RESPONSE",
    "RECENT_LINKS_RESPONSE",
    "FRECENT_LINKS_RESPONSE",
    "RECENT_BOOKMARKS_RESPONSE",
    "SEARCH_STATE_RESPONSE",
    "NOTIFY_PERFORMANCE",
  ]);

  let expectedData = new Set([
    "BASE_MOUNTED",
    "NEWTAB_RENDER"
  ]);

  let seenEvents = new Set();
  for (let event of eventsArray) {
    assert.ok(exectedEvents.has(event.tag), "Received expected event " + event.tag);
    assert.ok(!seenEvents.has(event.tag + event.data), "Event tag and data pair is unique");
    if (event.tag === "NOTIFY_PERFORMANCE") {
      assert.ok(expectedData.has(event.data) || event.data.startsWith("DOC_READY_STATE"),
                "Correct data associated with content notification");
    }
    if (event.tag.indexOf("_RESPONSE") > -1) {
      // all responses must have delta computed
      assert.ok(Number.isInteger(event.delta), "Responses have time delta attached");
    }
    seenEvents.add(event.tag + event.data);
  }
  // the first start must be 0
  assert.equal(eventsArray[0].start, 0, "First event always start at 0");
}

exports.test_PerfMeter_init = function(assert) {
  assert.deepEqual(app.performanceData, {}, "no performance data");
};

exports.test_PerfMeter_events = function*(assert) {
  let tabData = yield openTestTab(app.appURLs[1], "performance-log-complete");
  let notifyData = tabData.notifyData;

  let performanceData = app.performanceData;
  assert.ok(performanceData[tabData.tab.id], "Entry with expected tab id exists");

  let events = performanceData[tabData.tab.id].events;
  // did events come as expected
  verifyPerfEvents(events, assert);
  // check that "performance-log-complete" notification returns same tabId
  assert.equal(notifyData.tabId, tabData.tab.id, "Tab ids are identical");
  // check that "performance-log-complete" notification events are included in app events
  function toString(item) {return item.start + item.tag + item.data;}
  let eventsSet = new Set(events.map(item => toString(item)));
  notifyData.events.forEach(item => {
    assert.ok(eventsSet.has(toString(item)), "Matched item " + item.tag);
  });

  // test reload
  yield new Promise(resolve => {
    function onNotify(subject, topic, data) {
      Services.obs.removeObserver(onNotify, "performance-log-complete");
      resolve();
    }
    Services.obs.addObserver(onNotify, "performance-log-complete");
    tabData.tab.reload();
  });

  events = app.performanceData[tabData.tab.id].events;
  // note that verifyPerfEvents checks for duplicate events and will fail
  // if the tab structure doesn't re-initialize after reload
  verifyPerfEvents(events, assert);
  // verify the first three expected events on reload
  assert.ok(events[0].tag === "TAB_RELOAD" && events[0].start === 0, "Expected TAB_RELOAD");
  assert.ok(events[1].tag === "TAB_READY" && events[0].start === 0, "Expected TAB_READY");
  assert.ok(events[2].tag === "WORKER_ATTACHED" && events[0].start === 0, "Expected WORKER_ATTACHED");

  tabData.tab.close();
};

exports.test_PerfMeter_pref = function*(assert) {
  // We are always tracking events regadless of performance.log settings
  // However, if performance.log is on, we also logging the events to console
  let tabData = yield openTestTab(app.appURLs[1], "performance-log-complete");

  let events = tabData.notifyData.events;
  assert.equal(events[events.length - 1].tag, "NOTIFY_PERFORMANCE", "Expected last event");
  tabData.tab.close();

  assert.equal(simplePrefs.prefs["performance.log"], true, "performance.log is on");
  assert.ok(app._perfMeter._active, "PerfMeter active flag is set");

  yield prefSetter(false);
  assert.equal(simplePrefs.prefs["performance.log"], false, "performance.log is off");
  assert.ok(!app._perfMeter._active, "PerfMeter active flag is not set");

  // fire a new tab and ensure perfMeter still collects events
  tabData = yield openTestTab(app.appURLs[1], "performance-log-complete");

  events = tabData.notifyData.events;
  assert.equal(events[events.length - 1].tag, "NOTIFY_PERFORMANCE", "Expected last event");
  tabData.tab.close();

  // set pref back on, and start getting events again
  yield prefSetter(true);
  assert.equal(simplePrefs.prefs["performance.log"], true, "performance.log is on");

  // fire a new tab and ensure perfMeter is not empty
  tabData = yield openTestTab(app.appURLs[1], "performance-log-complete");

  events = tabData.notifyData.events;
  assert.equal(events[events.length - 1].tag, "NOTIFY_PERFORMANCE", "Expected last event");
  tabData.tab.close();
};

exports.test_PerfMeter_tab_hygiene = function*(assert) {
  // open two activity streams tabs and two example.com tabs
  let as_tab1 = yield openTestTab(app.appURLs[1], "performance-log-complete");
  let as_tab2 = yield openTestTab(app.appURLs[1], "performance-log-complete");
  let example_tab1 = yield openTestTab("http://example.com");
  let example_tab2 = yield openTestTab("http://example.com");

  // check notifyData for both tabs for sanity
  assert.equal(as_tab1.notifyData.tabId, as_tab1.tab.id, "Matched tab ids");
  assert.equal(as_tab2.notifyData.tabId, as_tab2.tab.id, "Matched tab ids");

  // verify events for activity streams tabs
  verifyPerfEvents(as_tab1.notifyData.events, assert);
  verifyPerfEvents(as_tab2.notifyData.events, assert);

  // make sure that only two tabs are kept by PerfMeter
  let performanceData = app.performanceData;
  assert.equal(Object.keys(performanceData).length, 2, "Expect data kept for only two tabs");

  // wait for all tabs to close
  yield new Promise(resolve => {
    let closeCounter = 4;
    function onClose() {
      closeCounter--;
      if (closeCounter === 0) {
        resolve();
      }
    }
    as_tab1.tab.close(onClose);
    as_tab2.tab.close(onClose);
    example_tab1.tab.close(onClose);
    example_tab2.tab.close(onClose);
  });

  // all tabs data should be gone
  assert.deepEqual(app.performanceData, {}, "no performance data");
};

exports.test_PerfMeter_sample_stats = function*(assert) {
  let perfMeter = new PerfMeter("http://foo.com");
  perfMeter._addSampleValue(2);
  assert.deepEqual(perfMeter._computeStats(), {total: 1, mean: 2, std: 0, median: 2}, "stats match");
  perfMeter._addSampleValue(1);
  assert.deepEqual(perfMeter._computeStats(), {total: 2, mean: 1.5, std: 0.5, median: 1.5}, "stats match");
  perfMeter._addSampleValue(3);
  // the std is sqrt(2/3) anbd should be equal to 0.82
  assert.deepEqual(perfMeter._computeStats(), {total: 3, mean: 2, std: 0.82, median: 2}, "stats match");
};

exports.test_PerfMeter_tab_restore = function*(assert) {
  let browserWindow = windowMediator.getMostRecentWindow("navigator:browser");
  let gBrowser = browserWindow.gBrowser;
  let appUrl = app.appURLs[1];

  function promiseLoadURI(tab, uri) {
    return new Promise(resolve => {
      tab.addEventListener("load", function onLoad() {
        tab.removeEventListener("load", onLoad);
        resolve();
      });
      tab.linkedBrowser.loadURI(uri);
    });
  }

  function promiseRemoveTab(tab) {
    return new Promise(resolve => {
      gBrowser.tabContainer.addEventListener("TabClose", function onTabClose() {
        gBrowser.tabContainer.removeEventListener("TabClose", onTabClose);
        resolve();
      });
      gBrowser.removeTab(tab);
    });
  }

  // open an activity streams tab and verify perf log working
  let tab = yield new Promise(resolve => {
    let tab;
    function onNotify(subject, topic, data) {
      Services.obs.removeObserver(onNotify, "performance-log-complete");
      resolve(tab);
    }
    Services.obs.addObserver(onNotify, "performance-log-complete");
    tab = gBrowser.addTab(appUrl);
  });

  yield promiseLoadURI(tab, "about:about");

  // close tab
  yield promiseRemoveTab(tab);

  tab = yield new Promise(resolve => {
    // HACK: This timer isn't needed in nightly (48) but beta (46) has some timing issue
    // and this hack fixes it.
    setTimeout(() => {
      resolve(SessionStore.undoCloseTab(browserWindow));
    }, 100);
  });

  // HACK: busy loop wait.
  yield new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 100);
  });

  // restore tab, "hit back button" and verify perf log is still working
  yield new Promise(resolve => {
    function onNotify(subject, topic, data) {
      assert.equal(tab.linkedBrowser.currentURI.spec, appUrl);
      Services.obs.removeObserver(onNotify, "performance-log-complete");
      resolve();
    }
    Services.obs.addObserver(onNotify, "performance-log-complete");

    tab.linkedBrowser.goBack();
  });

  // close tab
  yield promiseRemoveTab(tab);
};

before(exports, function() {
  simplePrefs.prefs["performance.log"] = true;
  app = new ActivityStreams();
});

after(exports, function() {
  app.unload();
});

require("sdk/test").run(exports);

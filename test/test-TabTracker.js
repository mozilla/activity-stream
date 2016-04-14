/* globals Services, ClientID */

"use strict";

const {before, after} = require("sdk/test/utils");
const tabs = require("sdk/tabs");
const {setTimeout} = require("sdk/timers");
const {ActivityStreams} = require("lib/ActivityStreams");
const {PlacesTestUtils} = require("./lib/PlacesTestUtils");
const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");

const EXPECTED_KEYS = ["url", "tab_id", "session_duration", "client_id", "unload_reason", "addon_version",
                       "page", "load_reason", "locale", "historySize", "bookmarkSize", "action"];

let ACTIVITY_STREAMS_URL;
let app;

function createPingSentPromise(pingData, expectedPingCount) {
  return new Promise(resolve => {
    function observe(subject, topic, data) {
      if (topic === "tab-session-complete") {
        pingData.push(JSON.parse(data));
        if (pingData.length === expectedPingCount) {
          Services.obs.removeObserver(observe, "tab-session-complete");
          resolve();
        }
      }
    }
    Services.obs.addObserver(observe, "tab-session-complete");
  });
}

function checkLoadUnloadReasons(assert, pingData, expectedLoadReasons, expectedUnloadReasons, hasLoadLatency) {
  let numActivations = expectedLoadReasons.length;
  assert.equal(pingData.length, numActivations, `The activity streams page was activated ${numActivations} times`);
  for (let i in pingData) {
    let ping = pingData[i];
    assert.equal(ping.load_reason, expectedLoadReasons[i], "Loaded for the expected reason");
    assert.equal(ping.unload_reason, expectedUnloadReasons[i], "Unloaded for the expected reason");
    // setup expected keys list and modify ping based on hasLoadLatency flag
    let expectedKeys;
    switch (hasLoadLatency) {
      case false:
        // expectedKeys must NOT have load_latency key - the test closes tab session(s) before page loads
        expectedKeys = EXPECTED_KEYS;
        break;
      case true:
        // expectedKeys must have load_latency key - the test waits for page load before cloasing tab session(s)
        expectedKeys = EXPECTED_KEYS.concat("load_latency");
        break;
      default:
        // behaivor is undefined - the ping may or may not contian load_latency key, hence we remove load_latency
        // from the ping to avoid intermittent test failure
        expectedKeys = EXPECTED_KEYS;
        delete ping.load_latency;
    }
    assert.equal(Object.keys(ping).length,expectedKeys.length, "We have as many attributes as we expect");
    for (let key of expectedKeys) {
      assert.notEqual(ping[key], undefined, `${key} is an attribute in our tab data.`);
    }
    assert.notEqual(ping.session_duration, 0, "session_duration is not 0");
  }
}

function waitForPageLoadAndSessionComplete() {
  function onShow(tab) {
    function onPageLoaded(subject, topic, data) {
      Services.obs.removeObserver(onPageLoaded, "performance-log-complete");
      setTimeout(function() {
        tab.close(() => {
          tabs.removeListener("pageshow", onShow);
        });
      }, 10);
    }
    Services.obs.addObserver(onPageLoaded, "performance-log-complete");
  }
  return waitSessionComplete(onShow);
}

function waitForPageShowAndSessionComplete() {
  function onShow(tab) {
    setTimeout(function() {
      tab.close(() => {
        tabs.removeListener("pageshow", onShow);
      });
    }, 10);
  }
  return waitSessionComplete(onShow);
}

function waitSessionComplete(onShow) {
  return new Promise(resolve => {
    tabs.on("pageshow", onShow);

    function onSessionComplete(subject, topic, data) {
      if (topic === "tab-session-complete") {
        Services.obs.removeObserver(onSessionComplete, "tab-session-complete");
        resolve(JSON.parse(data));
      }
    }

    Services.obs.addObserver(onSessionComplete, "tab-session-complete");
  });
}

exports.test_TabTracker_init = function(assert) {
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");
};

exports.test_TabTracker_open_close_tab = function*(assert) {
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");
  tabs.open(ACTIVITY_STREAMS_URL);
  let pingData = yield waitForPageShowAndSessionComplete();

  checkLoadUnloadReasons(assert, [pingData], ["newtab"], ["close"], false);

  let clientID = yield ClientID.getClientID();
  assert.equal(pingData.client_id, clientID, "client ID is what is expected");
  assert.equal(pingData.unload_reason, "close", "unloaded due to close");

  let secondsOpen = pingData.session_duration;
  assert.ok(secondsOpen > 0, "The tab should have stayed open for more than 0 seconds");
};

exports.test_TabTracker_reactivating = function*(assert) {
  let openTabs = [];
  let pingData = [];

  let pingsSentPromise = createPingSentPromise(pingData, 3);

  let tabsOpenedPromise = new Promise(resolve => {
    let onOpen = function(tab) {
      openTabs.push(tab);
      if (openTabs.length === 2) {
        tabs.removeListener("pageshow", onOpen);
        resolve();
      }
    };

    tabs.on("pageshow", onOpen);
  });

  assert.deepEqual(app.tabData, {}, "tabData starts out empty");

  tabs.open("http://foo.com");
  tabs.open(ACTIVITY_STREAMS_URL);

  // Wait until both tabs have opened
  yield tabsOpenedPromise;

  assert.equal(tabs.activeTab.url, ACTIVITY_STREAMS_URL, "The activity stream should be the currently active tab");

  // Activate and deactivate the activity streams page tab 3 times.
  let activationsGoal = 4;
  let numActivations = 0;
  let activationsPromise = new Promise(resolve => {
    tabs.on("activate", function(tab) {
      numActivations++;
      if (numActivations === activationsGoal) {
        tabs.removeListener("activate", this);
        resolve();
      }
    });
  });

  for (let i = 0; i < openTabs.length * 3 - 1; i++) {
    openTabs[i % 2].activate();
  }
  yield activationsPromise;

  // Close both tabs.
  let tabClosedPromise = new Promise(resolve => {
    for (let i in openTabs) {
      openTabs[i].close(() => {
        if (Number(i) === openTabs.length - 1) {
          // We've closed the last tab
          resolve();
        }
      });
    }
  });

  yield tabClosedPromise;
  yield pingsSentPromise;

  let loadReasons = ["newtab", "focus", "focus"];
  let unloadReasons = ["unfocus", "unfocus", "close"];
  checkLoadUnloadReasons(assert, pingData, loadReasons, unloadReasons);
};

exports.test_TabTracker_refresh = function*(assert) {
  let openTab;
  let numLoads = 0;
  let pingData = [];

  let pingsSentPromise = createPingSentPromise(pingData, 2);

  let tabOpenedPromise = new Promise(resolve => {
    let onOpen = function(tab) {
      openTab = tab;
      numLoads++;
      if (numLoads === 1) {
        openTab.reload();
      } else {
        tabs.removeListener("ready", onOpen);
        resolve();
      }
    };
    tabs.on("ready", onOpen);
  });

  assert.deepEqual(app.tabData, {}, "tabData starts out empty");

  tabs.open(ACTIVITY_STREAMS_URL);

  yield tabOpenedPromise;

  // Close both tabs.
  let tabClosedPromise = new Promise(resolve => {
    openTab.close(() => {
      resolve();
    });
  });

  yield tabClosedPromise;
  yield pingsSentPromise;

  let loadReasons = ["newtab", "refresh"];
  let unloadReasons = ["refresh", "close"];
  checkLoadUnloadReasons(assert, pingData, loadReasons, unloadReasons);
};

exports.test_TabTracker_action_pings = function*(assert) {
  let userEventPromise = new Promise(resolve => {
    function observe(subject, topic, data) {
      if (topic === "user-action-event") {
        Services.obs.removeObserver(observe, "user-action-event");
        resolve(JSON.parse(data));
      }
    }
    Services.obs.addObserver(observe, "user-action-event");
  });

  let eventData = {
    msg: {
      data: {
        source: "topsites",
        action_position: 3,
        event: "click"
      }
    }
  };
  app._handleUserEvent("NOTIFY_USER_EVENT", eventData);

  let pingData = yield userEventPromise;
  let additionalKeys = ["client_id", "addon_version", "locale", "action", "tab_id", "page"];
  for (let key of additionalKeys) {
    assert.ok(pingData[key], `The ping has the additional key ${key}`);
  }
  assert.deepEqual(eventData.msg.data, pingData, "We receive the expected ping data.");
};

exports.test_TabTracker_prefs = function*(assert) {
  simplePrefs.prefs.telemetry = false;
  assert.ok(!app._tabTracker.enabled, "tab tracker is disabled");

  simplePrefs.prefs.telemetry = true;
  assert.ok(app._tabTracker.enabled, "tab tracker is enabled");
};

exports.test_TabTracker_latency = function*(assert) {
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");
  tabs.open(ACTIVITY_STREAMS_URL);
  let pingData = yield waitForPageLoadAndSessionComplete();
  checkLoadUnloadReasons(assert, [pingData], ["newtab"], ["close"], true);
};

exports.test_TabTracker_History_And_Bookmark_Reporting = function*(assert) {
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");
  tabs.open(ACTIVITY_STREAMS_URL);
  let pingData = yield waitForPageLoadAndSessionComplete();
  checkLoadUnloadReasons(assert, [pingData], ["newtab"], ["close"], true);
  assert.equal(pingData.historySize, 0, "Nothing in history");
  assert.equal(pingData.bookmarkSize, 0, "Nothing in bookmarks");

  // add visits and bookmark them
  yield PlacesTestUtils.insertAndBookmarkVisit("https://mozilla1.com/0");
  yield PlacesTestUtils.insertAndBookmarkVisit("https://mozilla2.com/1");

  // trigger query re-caching and wait for its completion
  yield new Promise(resolve => {
    function onCacheComplete() {
      Services.obs.removeObserver(onCacheComplete, "activity-streams-places-cache-complete");
      resolve();
    }
    Services.obs.addObserver(onCacheComplete, "activity-streams-places-cache-complete");
    app._handlePlacesChanges("bookmark");
  });

  tabs.open(ACTIVITY_STREAMS_URL);
  pingData = yield waitForPageLoadAndSessionComplete();
  assert.equal(pingData.historySize, 2, "2 new visits history");
  assert.equal(pingData.bookmarkSize, 2, "2 new bookmarks");

  PlacesTestUtils.clearBookmarks();
  yield PlacesTestUtils.clearHistory();
};

exports.test_TabTracker_pageType = function*(assert) {
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");
  tabs.open(ACTIVITY_STREAMS_URL);
  let pingData = yield waitForPageLoadAndSessionComplete();
  assert.equal(pingData.page, "NEW_TAB", "page type is newtab");
  // open timeline page
  tabs.open(app.appURLs[2]);
  pingData = yield waitForPageShowAndSessionComplete();
  assert.equal(pingData.page, "TIMELINE_ALL", "page type is timeline");
};

exports.test_TabTracker_session_reports = function*(assert) {
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");

  // set up an observer that bumps the counter everytime ping is sent
  let pingCounter = 0;
  function pingBumper(subject, topic, data) {
    if (topic === "tab-session-complete") {
      pingCounter ++;
    }
  }
  Services.obs.addObserver(pingBumper, "tab-session-complete");

  // open the non-realted page
  tabs.open("http://www.example.com");
  yield new Promise(resolve => {
    let onOpen = function(tab) {
      tabs.removeListener("ready", onOpen);
      tab.close(resolve());
    };
    tabs.on("ready", onOpen);
  });

  tabs.open(ACTIVITY_STREAMS_URL);
  yield waitForPageLoadAndSessionComplete();

  // ping counter should be 1, since the first open shouldn't sent any pings
  assert.equal(pingCounter, 1, "expected a single ping");

  // now load an AS page, and change its tab url to trigger the report
  yield new Promise(resolve => {
    let onOpen = function(tab) {
      if (tab.url === "http://www.example.com/") {
        // second page load - simply close the tab
        tabs.removeListener("ready", onOpen);
        setTimeout(function() {
          tab.close(resolve);
        }, 10);
      } else {
        // we are replacing AS page with non-AS url, and it should gererate another ping
        tab.url = "http://www.example.com/";
      }
    };
    tabs.on("ready", onOpen);
    tabs.open(ACTIVITY_STREAMS_URL);
  });

  assert.equal(pingCounter, 2, "expected two pings");

  // remove session ping observer
  Services.obs.removeObserver(pingBumper, "tab-session-complete");
};

before(exports, function*() {
  // we have to clear bookmarks and history before tests
  // to ensure that the app does not pick history or
  // bookmarks sizes from the previous test runs
  PlacesTestUtils.clearBookmarks();
  yield PlacesTestUtils.clearHistory();

  // initialize the app now
  let clientID = yield ClientID.getClientID();
  simplePrefs.prefs.telemetry = true;
  app = new ActivityStreams({clientID});
  ACTIVITY_STREAMS_URL = app.appURLs[1];
});

after(exports, function() {
  app.unload();
});

require("sdk/test").run(exports);

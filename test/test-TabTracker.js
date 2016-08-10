/* globals Services, ClientID */

"use strict";

const {before, after} = require("sdk/test/utils");
const tabs = require("sdk/tabs");
const {setTimeout} = require("sdk/timers");
const {getTestActivityStream} = require("./lib/utils");
const {PlacesTestUtils} = require("./lib/PlacesTestUtils");
const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");

const EXPECTED_KEYS = ["url", "tab_id", "session_duration", "client_id", "unload_reason", "addon_version",
                       "page", "load_reason", "locale", "total_history_size", "total_bookmarks", "action",
                       "experiment_id", "session_id"];

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
    Services.obs.addObserver(observe, "tab-session-complete", false);
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
    for (let key of expectedKeys) {
      assert.notEqual(ping[key], undefined, `${key} is an attribute in our tab data.`);
    }
    assert.equal(Object.keys(ping).length, expectedKeys.length, "We have as many attributes as we expect");
    if (ping.load_reason !== "none") {
      assert.notEqual(ping.session_duration, 0, "session_duration is not 0");
    }
  }
}

function waitForPageLoadAndSessionComplete() {
  function onShow(tab) {
    function onPageLoaded(subject, topic, data) {
      Services.obs.removeObserver(onPageLoaded, "performance-log-complete");
      setTimeout(() => {
        tab.close(() => {
          tabs.removeListener("pageshow", onShow);
        });
      }, 10);
    }
    Services.obs.addObserver(onPageLoaded, "performance-log-complete", false);
  }
  return waitSessionComplete(onShow);
}

function waitForPageShowAndSessionComplete() {
  function onShow(tab) {
    setTimeout(() => {
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

    Services.obs.addObserver(onSessionComplete, "tab-session-complete", false);
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

exports.test_TabTracker_unfocus_unloaded_tab = function*(assert) {
  let openTabs = [];
  let pingData = [];

  let pingsSentPromise = createPingSentPromise(pingData, 3);

  let tabsOpenedPromise = new Promise(resolve => {
    let onOpen = function(tab) {
      openTabs.push(tab);
      if (openTabs.length === 2) {
        tabs.removeListener("ready", onOpen);
        resolve();
      }
    };

    tabs.on("ready", onOpen);
  });

  assert.deepEqual(app.tabData, {}, "tabData starts out empty");

  tabs.open(ACTIVITY_STREAMS_URL);

  // Open the second tab on the next event loop tick to ensure the first
  // tab opened but didn't have time to load.
  setTimeout(() => {
    tabs.open(ACTIVITY_STREAMS_URL);
  }, 0);

  // Wait until both tabs have opened
  yield tabsOpenedPromise;

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

  let loadReasons = ["none", "newtab", "focus"];
  let unloadReasons = ["unfocus", "close", "close"];
  checkLoadUnloadReasons(assert, pingData, loadReasons, unloadReasons);
};

exports.test_TabTracker_back_button_load = function*(assert) {
  let openTab;
  let numLoads = 0;
  let pingData = [];

  let pingsSentPromise = createPingSentPromise(pingData, 2);

  let tabOpenedPromise = new Promise(resolve => {
    let onOpen = function(tab) {
      openTab = tab;
      numLoads++;
      if (numLoads === 1) {
        // Wait one event loop tick to ensure the event handlers in TabTracker
        // run first before we reload.
        setTimeout(() => {
          openTab.reload();
        }, 0);
      } else {
        // Note: Since there is no way to trigger the "back" button for the purpose
        // of the test, here we are mimic it by ending a session due to refresh
        // then clearing the data before getting to the 'pageshow' event in
        // TabTracker.
        app._tabTracker._clearTabData();
        tabs.removeListener("pageshow", onOpen);
        resolve();
      }
    };
    tabs.on("pageshow", onOpen);
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

  let loadReasons = ["newtab", "newtab"];
  let unloadReasons = ["refresh", "close"];
  checkLoadUnloadReasons(assert, pingData, loadReasons, unloadReasons);
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

exports.test_TabTracker_close_window_with_multitabs = function*(assert) {
  let pingData = [];
  let openTabs = [];

  let pingsSentPromise = createPingSentPromise(pingData, 2);

  let tabsOpenedPromise = new Promise(resolve => {
    let onOpen = function(tab) {
      openTabs.push(tab);
      if (openTabs.length === 2) {
        tabs.removeListener("ready", onOpen);
        resolve();
      }
    };

    tabs.on("ready", onOpen);
  });
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");

  tabs.open(ACTIVITY_STREAMS_URL);
  // open another tab a bit later so that the first one could completely load
  setTimeout(() => {
    tabs.open(ACTIVITY_STREAMS_URL);
  }, 1000);

  yield tabsOpenedPromise;

  // close both tabs
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
  let loadReasons = ["newtab", "newtab"];
  let unloadReasons = ["unfocus", "close"];
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
    Services.obs.addObserver(observe, "user-action-event", false);
  });

  let eventData = {
    msg: {
      type: "NOTIFY_USER_EVENT",
      data: {
        source: "topsites",
        action_position: 3,
        event: "CLICK"
      }
    }
  };
  app._handleUserEvent(eventData);

  let pingData = yield userEventPromise;
  let additionalKeys = ["client_id", "addon_version", "locale", "action", "tab_id", "page"];
  for (let key of additionalKeys) {
    assert.ok(pingData[key], `The ping has the additional key ${key}`);
  }
  assert.equal(eventData.msg.data.experiment_id, "foo_01", "the ping has the correct experiment_id");
  assert.deepEqual(eventData.msg.data.source, pingData.source, "the ping has the correct source");
  assert.deepEqual(eventData.msg.data.event, pingData.event, "the ping has the correct event");
  assert.deepEqual(eventData.msg.data.action_position, pingData.action_position, "the ping has the correct action_position");
};

exports.test_TabTracker_unload_reason_with_user_action = function*(assert) {
  let events = ["CLICK", "SEARCH"];
  for (let event of events) {
    let openTab;
    let sessionPingData = [];
    let pingsSentPromise = createPingSentPromise(sessionPingData, 1);
    let tabOpenedPromise = new Promise(resolve => {
      let onOpen = function(tab) {
        openTab = tab;
        tabs.removeListener("pageshow", onOpen);
        resolve();
      };
      tabs.on("pageshow", onOpen);
    });

    tabs.open(ACTIVITY_STREAMS_URL);
    yield tabOpenedPromise;

    let userEventPromise = new Promise(resolve => {
      function observe(subject, topic, data) {
        if (topic === "user-action-event") {
          Services.obs.removeObserver(observe, "user-action-event");
          resolve(JSON.parse(data));
        }
      }
      Services.obs.addObserver(observe, "user-action-event", false);
    });

    let eventData = {
      msg: {
        type: "NOTIFY_USER_EVENT",
        data: {
          source: "topsites",
          action_position: 3,
          event
        }
      }
    };
    app._handleUserEvent(eventData);

    let eventPingData = yield userEventPromise;
    let additionalKeys = ["client_id", "addon_version", "locale", "action", "tab_id", "page"];
    for (let key of additionalKeys) {
      assert.ok(eventPingData[key], `The ping has the additional key ${key}`);
    }
    assert.deepEqual(eventData.msg.data, eventPingData, "We receive the expected ping data.");

    let tabClosedPromise = new Promise(resolve => {
      openTab.close(() => {
        resolve();
      });
    });

    yield tabClosedPromise;
    yield pingsSentPromise;

    checkLoadUnloadReasons(assert, sessionPingData, ["newtab"], [event.toLowerCase()], false);
  }
};

exports.test_TabTracker_performance_action_pings = function*(assert) {
  let performanceEventPromise = new Promise(resolve => {
    function observe(subject, topic, data) {
      if (topic === "performance-event") {
        Services.obs.removeObserver(observe, "performance-event");
        resolve(JSON.parse(data));
      }
    }
    Services.obs.addObserver(observe, "performance-event", false);
  });

  let eventData1 = {
    msg: {
      data: {
        source: "TOP_FRECENT_SITES_REQUEST",
        event_id: "{c4f7e4a0-947b-7343-8a56-934c724492cc}",
        event: "previewCacheHit",
        value: 1
      }
    }
  };
  const event1 = app._tabTracker.generateEvent({source: "TOP_FRECENT_SITES_REQUEST"});
  app._tabTracker.handlePerformanceEvent(event1, "previewCacheHit", 1);

  let pingData = yield performanceEventPromise;
  let additionalKeys = ["client_id", "addon_version", "locale", "action", "tab_id", "page"];
  for (let key of additionalKeys) {
    assert.ok(pingData[key], `The ping has the additional key ${key}`);
  }
  assert.ok(/{[0-9a-f\-]+}/.test(eventData1.msg.data.event_id), "ping has a UUID as an event ID");
  assert.deepEqual(eventData1.msg.data.source, pingData.source, "the ping has the correct source");
  assert.deepEqual(eventData1.msg.data.event, pingData.event, "the ping has the correct event");
  assert.deepEqual(eventData1.msg.data.value, pingData.value, "the ping has the correct value");
};

exports.test_TabTracker_handleRouteChange_FirstLoad = function(assert) {
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");
  app._tabTracker.handleRouteChange({}, {isFirstLoad: true});
  assert.deepEqual(app.tabData, {}, "tabData unaffected by isFirstLoad route change");
};

exports.test_TabTracker_handleRouteChange = function*(assert) {
  const tabData = {
    url: ACTIVITY_STREAMS_URL,
    id: "-3-4",
    on: () => {},
    removeListener: () => {}
  };
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");
  const pingData = yield new Promise(resolve => {
    function observe(subject, topic, data) {
      if (topic !== "tab-session-complete") {
        return;
      }
      Services.obs.removeObserver(observe, "tab-session-complete");
      resolve(JSON.parse(data));
    }
    Services.obs.addObserver(observe, "tab-session-complete", false);
    app._tabTracker.onOpen(tabData);
    app._tabTracker.handleRouteChange(tabData, {isFirstLoad: false});
  });
  assert.equal(pingData.unload_reason, "route_change");
};

exports.test_TabTracker_prefs = function(assert) {
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
  assert.equal(pingData.total_history_size, 0, "Nothing in history");
  assert.equal(pingData.total_bookmarks, 0, "Nothing in bookmarks");

  // add visits and bookmark them
  yield PlacesTestUtils.insertAndBookmarkVisit("https://mozilla1.com/0");
  yield PlacesTestUtils.insertAndBookmarkVisit("https://mozilla2.com/1");

  // trigger query re-caching and wait for its completion
  yield new Promise(resolve => {
    function onCacheComplete() {
      Services.obs.removeObserver(onCacheComplete, "activity-streams-places-cache-complete");
      resolve();
    }
    Services.obs.addObserver(onCacheComplete, "activity-streams-places-cache-complete", false);
    app._handlePlacesChanges("bookmark");
  });

  tabs.open(ACTIVITY_STREAMS_URL);
  pingData = yield waitForPageLoadAndSessionComplete();
  assert.equal(pingData.total_history_size, 2, "2 new visits history");
  assert.equal(pingData.total_bookmarks, 2, "2 new bookmarks");

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
      pingCounter++;
    }
  }
  Services.obs.addObserver(pingBumper, "tab-session-complete", false);

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
        setTimeout(() => {
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

exports.test_TabTracker_disable_ping = function*(assert) {
  let userEventPromise = new Promise(resolve => {
    function observe(subject, topic, data) {
      if (topic === "user-action-event") {
        Services.obs.removeObserver(observe, "user-action-event");
        resolve(JSON.parse(data));
      }
    }
    Services.obs.addObserver(observe, "user-action-event", false);
  });

  // manually trigger the "disable" or "uninstall" event
  app.unload("disable");
  let pingData = yield userEventPromise;
  assert.deepEqual("disable", pingData.event, "the ping has the correct event");
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
  // Return 0.1 from rng will trigger the variant
  app = getTestActivityStream({
    clientID,
    experiments: {
      test: {
        name: "foo",
        control: {value: false},
        variant: {id: "foo_01", value: true, threshold: 0.5}
      }
    },
    rng: () => 0.1
  });
  app._memoizer.reset();
  ACTIVITY_STREAMS_URL = app.appURLs[1];
});

after(exports, () => {
  app.unload();
});

require("sdk/test").run(exports);

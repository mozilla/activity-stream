/* globals Services, ClientID */

"use strict";

const {before, after} = require("sdk/test/utils");
const tabs = require("sdk/tabs");
const {setTimeout} = require("sdk/timers");
const {ActivityStreams} = require("lib/ActivityStreams");
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");

const EXPECTED_KEYS = ["url", "tab_id", "session_duration", "client_id", "unload_reason", "addon_version", "load_reason", "source", "locale"];

let ACTIVITY_STREAMS_URL;
let app;

exports.test_TabTracker_init = function(assert) {
  assert.deepEqual(app.tabData, {}, "tabData starts out empty");
};

exports.test_TabTracker_open_close_tab = function*(assert) {
  let pingData;
  let tabClosedPromise = new Promise(resolve => {
    let onOpen = function(tab) {
      setTimeout(function() {
        tab.close(() => {
          tabs.removeListener("pageshow", onOpen);
        });
      }, 10);
    };

    tabs.on("pageshow", onOpen);

    let Observer = {
      observe: function(subject, topic, data) {
        if (topic === "tab-session-complete") {
          pingData = JSON.parse(data);
          Services.obs.removeObserver(this, "tab-session-complete");
          resolve();
        }
      }
    };

    Services.obs.addObserver(Observer, "tab-session-complete");
  });

  assert.deepEqual(app.tabData, {}, "tabData starts out empty");

  tabs.open(ACTIVITY_STREAMS_URL);
  yield tabClosedPromise;

  assert.equal(Object.keys(pingData).length,EXPECTED_KEYS.length, "We have as many attributes as we expect");
  for (let key of EXPECTED_KEYS) {
    assert.ok(pingData[key], `${key} is an attribute in our tab data.`);
  }

  let clientID = yield ClientID.getClientID();
  assert.equal(pingData.client_id, clientID, "client ID is what is expected");
  assert.equal(pingData.unload_reason, "close", "unloaded due to close");

  let secondsOpen = pingData.session_duration;
  assert.ok(secondsOpen > 0, "The tab should have stayed open for more than 0 seconds");
};

exports.test_TabTracker_reactivating = function*(assert) {
  let openTabs = [];
  let pingData = [];

  let pingsSentPromise = new Promise(resolve => {
    let Observer = {
      observe: function(subject, topic, data) {
        if (topic === "tab-session-complete") {
          pingData.push(JSON.parse(data));
          if (pingData.length === 4) {
            Services.obs.removeObserver(this, "tab-session-complete");
            resolve();
          }
        }
      }
    };

    Services.obs.addObserver(Observer, "tab-session-complete");
  });

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
    tabs.on("activate", function() {
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

  let unloadReasons = ["navigation", "unfocus", "unfocus", "close"];
  assert.equal(pingData.length, 4, "The activity streams page was activated 4 times");
  for (let i in pingData) {
    let ping = pingData[i];
    assert.equal(ping.unload_reason, unloadReasons[i], "Unloaded for the expected reason");
    assert.equal(Object.keys(ping).length,EXPECTED_KEYS.length, "We have as many attributes as we expect");
    for (let key of EXPECTED_KEYS) {
      assert.notEqual(ping[key], undefined, `${key} is an attribute in our tab data.`);
    }
  }
};

before(exports, function*() {
  let clientID = yield ClientID.getClientID();
  app = new ActivityStreams({telemetry: true, clientID});
  ACTIVITY_STREAMS_URL = app.appURLs[1];
});

after(exports, function() {
  app.unload();
});

require("sdk/test").run(exports);

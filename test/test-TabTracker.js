"use strict";

const {before, after} = require("sdk/test/utils");
const tabs = require("sdk/tabs");
const ss = require("sdk/simple-storage");
const {setTimeout} = require("sdk/timers");
const {ActivityStreams} = require("lib/ActivityStreams");

let ACTIVITY_STREAMS_URL;
let app;

exports.test_TabTracker_init = function(assert) {
  for (let appURL of app.appURLs) {
    assert.deepEqual(ss.storage.tabData[appURL], {}, "tabData at each URL storage starts out empty");
  }
};

exports.test_TabTracker_open_close_tab = function*(assert) {
  let tabClosedPromise = new Promise(resolve => {
    let onOpen = function(tab) {
      setTimeout(function() {
        tab.close(() => {
          tabs.removeListener("pageshow", onOpen);
          resolve();
        });
      }, 10);
    };

    tabs.on("pageshow", onOpen);
  });

  for (let appURL of app.appURLs) {
    assert.deepEqual(ss.storage.tabData[appURL], {}, "tabData at each URL storage starts out empty");
  }

  tabs.open(ACTIVITY_STREAMS_URL);

  yield tabClosedPromise;
  assert.equal(Object.keys(ss.storage.tabData).length, 3, "There are 3 pages to keep track of");
  assert.equal(Object.keys(ss.storage.tabData[ACTIVITY_STREAMS_URL]).length, 1, "There was only one activity streams tab");
  assert.equal(ss.storage.tabData[ACTIVITY_STREAMS_URL]["-3-2"].activations.length, 1, "The activity streams page was only activated once");

  let secondsOpen = ss.storage.tabData[ACTIVITY_STREAMS_URL]["-3-2"].activations[0].totalTime;
  assert.ok(secondsOpen > 0, "The tab should have stayed open for more than 0 seconds");
};

exports.test_TabTracker_reactivating = function*(assert) {
  let openTabs = [];

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

  for (let appURL of app.appURLs) {
    assert.deepEqual(ss.storage.tabData[appURL], {}, "tabData at each URL storage starts out empty");
  }

  tabs.open("http://foo.com");
  tabs.open(ACTIVITY_STREAMS_URL);

  // Wait until both tabs have opened
  yield tabsOpenedPromise;

  assert.equal(tabs.activeTab.url, ACTIVITY_STREAMS_URL, "The activity stream should be the currently active tab");

  // Activate and deactivate the activity streams page tab 3 times.
  let activationsGoal = 5;
  let numActivations = 0;
  let activationsPromise = new Promise(resolve => {
    tabs.on("activate", function() {
      numActivations++;
      if (numActivations == activationsGoal) {
        tabs.removeListener("activate", this);
        resolve();
      }
    });
  });

  for (let i = 0; i < openTabs.length * 3; i++) {
    openTabs[i % 2].activate();
  }
  yield activationsPromise;

  // Close both tabs.
  let tabClosedPromise = new Promise(resolve => {
    for (let i in openTabs) {
      openTabs[i].close(() => {
        if (i == openTabs.length - 1) {
          // We've closed the last tab
          resolve();
        }
      });
    }
  });

  yield tabClosedPromise;

  assert.equal(Object.keys(ss.storage.tabData).length, 3, "There are 3 pages to keep track of");
  assert.equal(Object.keys(ss.storage.tabData[ACTIVITY_STREAMS_URL]).length, 1, "There was only one activity streams tab");

  let key = Object.keys(ss.storage.tabData[ACTIVITY_STREAMS_URL])[0];
  assert.equal(ss.storage.tabData[ACTIVITY_STREAMS_URL][key].activations.length, 3, "The activity streams page was activated 3 times");
};

before(exports, function() {
  app = new ActivityStreams({telemetry: true});
  ACTIVITY_STREAMS_URL = app.appURLs[1];
});

after(exports, function() {
  ss.storage = {};
  app.unload();
});

require("sdk/test").run(exports);

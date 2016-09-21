/* globals require, exports, XPCOMUtils, Task, Services, ClientID */
"use strict";

const {before, after} = require("sdk/test/utils");
const tabs = require("sdk/tabs");
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

const {Benchmark, forceLog} = require("./lib/Benchmark.js");
const {getTestActivityStream} = require("./lib/utils");

let app;
let ACTIVITY_STREAMS_URL;

const openAndCloseActivityStreamTab = Task.async(function*(bench, openUrl) {
  let tabData = {};

  // Start the benchmark timer here
  bench.startTimer();
  const promiseOnTabShow = new Promise(resolve => {
    tabs.open({
      url: openUrl,
      onPageShow: tab => {
        tabData.tab = tab;
        resolve();
      }
    });
  });

  const promiseOnPerfLogComplete = new Promise(resolve => {
    function onPerfLogComplete(subject, topic, data) {
      Services.obs.removeObserver(onPerfLogComplete, "performance-log-complete");
      resolve();
    }
    Services.obs.addObserver(onPerfLogComplete, "performance-log-complete", false);
  });

  const promiseSessionLogComplete = new Promise(resolve => {
    function onNotify(subject, topic, data) {
      Services.obs.removeObserver(onNotify, "tab-session-complete");
      tabData.notifyData = JSON.parse(data);
      resolve();
    }
    Services.obs.addObserver(onNotify, "tab-session-complete", false);
  });

  yield Promise.all([promiseOnTabShow, promiseOnPerfLogComplete]);
  // Since we're only interested in the performance-log-complete message, manually stop the timer here
  bench.stopTimer();

  yield new Promise(resolve => {
    tabData.tab.close(resolve);
  });
  yield promiseSessionLogComplete;
});

/**
 * Creates a benchmark object for message performance_log_complete
 *
 * @params {benchTime}   An integer in microseconds.
 * @returns {Benchmark}  An benchmark object with the target function and benchmark time.
 */
function _create_benchmark_for_performance_log_complete(benchTime = 1e6) {
  let bench = new Benchmark(function*(b) {
    for (let i = 0; i < b.N; i++) {
      yield openAndCloseActivityStreamTab(b, ACTIVITY_STREAMS_URL);
    }
  }, benchTime);
  return bench;
}

// Benchmark for opening a single tab
exports.test_benchmark_performance_log_complete_open_1 = function*(assert) {
  const bench = _create_benchmark_for_performance_log_complete(5e5);
  const result = yield bench.launch();
  forceLog(`Benchmarking on performance-log-complete (NEWTAB_RENDER) with a single tab: ${JSON.stringify(result)}`);
};

// Benchmark for opening N tabs
exports.test_benchmark_performance_log_complete_open_n = function*(assert) {
  const bench = _create_benchmark_for_performance_log_complete(2e6);
  const result = yield bench.launch();
  forceLog(`Benchmarking on performance-log-complete (NEWTAB_RENDER) with multiple tabs: ${JSON.stringify(result)}`);
};

before(exports, function*() {
  // initialize the app now
  let clientID = yield ClientID.getClientID();
  app = getTestActivityStream({clientID});
  ACTIVITY_STREAMS_URL = app.appURLs[1];
});

after(exports, () => {
  app.unload();
});

require("sdk/test").run(exports);

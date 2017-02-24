/* globals require, exports, XPCOMUtils, Task, Services, ClientID */
"use strict";

const {before, after} = require("sdk/test/utils");
const tabs = require("sdk/tabs");
const simplePrefs = require("sdk/simple-prefs");
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(global, "Task",
                                  "resource://gre/modules/Task.jsm");

const {Benchmark} = require("./lib/Benchmark.js");
const {getTestActivityStream} = require("./lib/utils");

let app;
let ACTIVITY_STREAMS_URL;

const roundsUpTest = [
  [0, 1],
  [1, 1],
  [2, 2],
  [3, 3],
  [5, 5],
  [9, 10],
  [99, 100],
  [100, 100],
  [140, 200],
  [170, 200],
  [270, 300],
  [499, 500],
  [500, 500],
  [501, 1000]
];

exports.test_roundsUp = function(assert) {
  let bench = new Benchmark(b => {});
  for (let [n, expect] of roundsUpTest) {
    const actual = bench._roundsUp(n);
    assert.equal(expect, actual);
  }
};

function fib(n) {
  if (n < 2) {
    return n;
  }

  return fib(n - 1) + fib(n - 2);
}

exports.test_benchmark_fib = function*(assert) {
  let bench = new Benchmark(b => {
    for (let i = 0; i < b.N; i++) {
      fib(20);
    }
  });
  const result = yield bench.launch();
  assert.ok(result.ok, "it should run the benchmark and report the status");
  assert.equal(bench._usPerOp(), result.usPerOp);
};

/*
 * Note that this function merely acts as a demo to illustrate how to involve
 * the Activity Stream within the benchmark. Do not use it for the real benchmark
 */
const openAndCloseActivityStreamTab = Task.async(function*(openUrl) {
  let tabData = {};

  const promiseOnTabShow = new Promise(resolve => {
    tabs.open({
      url: openUrl,
      onPageShow: tab => {
        tabData.tab = tab;
        resolve();
      }
    });
  });

  const promiseSessionLogComplete = new Promise(resolve => {
    function onNotify(subject, topic, data) {
      Services.obs.removeObserver(onNotify, "tab-session-complete");
      tabData.notifyData = JSON.parse(data);
      resolve();
    }
    Services.obs.addObserver(onNotify, "tab-session-complete", false);
  });

  yield promiseOnTabShow;
  yield new Promise(resolve => {
    tabData.tab.close(resolve);
  });
  yield promiseSessionLogComplete;
  return tabData.notifyData;
});

exports.test_benchmark_open_activity_stream = function*(assert) {
  let bench = new Benchmark(function*(b) {
    for (let i = 0; i < b.N; i++) {
      yield openAndCloseActivityStreamTab(ACTIVITY_STREAMS_URL);
    }
  });
  const result = yield bench.launch();
  assert.ok(result.ok, "it should run the benchmark and report the status");
  assert.equal(bench._usPerOp(), result.usPerOp);
};

before(exports, function*() {
  // initialize the app now
  let clientID = yield ClientID.getClientID();
  // make sure enable the telemetry
  simplePrefs.prefs.telemetry = true;

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
  ACTIVITY_STREAMS_URL = app.appURLs[1];
});

after(exports, () => {
  app.unload("uninstall");
});

require("sdk/test").run(exports);

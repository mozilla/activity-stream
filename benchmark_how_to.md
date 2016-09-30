# Benchmarking in Activity Stream

When you add a new feature or want to test the performance of a change, you may want to benchmark the feature or the add-on as a whole. You can do that using our simple benchmarking framework.

This framework is particularly suitable for benchmarking functions without or with little side-effects (e.g. I/O). Otherwise, extra effort is required in order to achieve the reasonable result. Read more detail [here](https://github.com/mozilla/activity-stream/blob/master/test/lib/Benchmark.js#L42).

## Some useful notes

* All the benchmarks are running on top of "jpm test", so you should put your benchmark files in the "test" directory
* Name the benchmark file as "test-****-benchmark.js", e.g. "test-Feature-abc-benchmark.js". This is _very_ important as we use the "benchmark" suffix to differentiate the benchmark files from the regular test ones. Note the leading "test" is also mandatory as jpm only recognizes test/benchmark files with it
* A new prefs file "benchmark-prefs.json" is being used for the benchmarking to mimic the regular use scenario.
  - It sets the log level to "error" to avoid the verbose jpm test outputs. See examples below to see how to log in the benchmark
  - It disables "Async Stacks" to yield more stable results. See more detail [here](https://developer.mozilla.org/en-US/docs/Mozilla/Benchmarking)
  - It enables the auto crash report to make the broswer do less work
* Use command `npm run benchmark` to run all the benchmarks, or run individual one by `npm run benchmark-with -- -f test/test-your-benchmark.js`

## Step 1: create a benchmark

Here is an example of benchmarking the performance of Activity Stream for the event "performance-log-complete",

```js
const {before, after} = require("sdk/test/utils");
const tabs = require("sdk/tabs");
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Task", "resource://gre/modules/Task.jsm");

const {Benchmark, forceLog} = require("./lib/Benchmark.js");
const {getTestActivityStream} = require("./lib/utils");

let app;
let ACTIVITY_STREAMS_URL;

// This is the function that you want to benchmark
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

  yield Promise.all([promiseOnTabShow, promiseOnPerfLogComplete]);
  // Since we're only interested in the performance-log-complete message, manually stop the timer here
  bench.stopTimer();

  yield new Promise(resolve => {
    tabData.tab.close(resolve);
  });
});

// This is the driver for the benchmark function, which is essentially a jpm unit test
exports.test_benchmark_performance_log_complete = function*(assert) {
  let bench = new Benchmark(function*(b) {
    for (let i = 0; i < b.N; i++) {
      yield openAndCloseActivityStreamTab(b, ACTIVITY_STREAMS_URL);
    }
  }, 2e6); // run this benchmark function for 2 seconds (i.e. 2e6 microseconds)
  const result = yield bench.launch();
  forceLog(`Benchmarking on performance-log-complete (NEWTAB_RENDER): ${JSON.stringify(result)}`);
};

before(exports, function*() {
  let clientID = yield ClientID.getClientID();
  app = getTestActivityStream({clientID});
  ACTIVITY_STREAMS_URL = app.appURLs[1];
});

after(exports, () => {
  app.unload();
});

require("sdk/test").run(exports);
```

Let's walk through this example together.

Firstly, the `openAndCloseActivityStreamTab` is the target benchmark function, which simply opens a new tab of Activity Stream, waiting for the `preformance-log-complete` message, and finally closes that tab page. Let's say we only care about the timespan since the tab gets created till the arrival of that message, hence we manually start and stop the benchmark timer via `bench.startTimer()` and `bench.stopTimer()` respectively. Note that if you don't need such fine-grained timing control, there is no need to call those two functions explicitely, the framework will call them automatically.

Now that the target benchmark function has been defined, we can write the benchmark driver as a jpm unit test function `test_benchmark_performance_log_complete()`, which is of the following form,
```js
  let bench = new Benchmark(function*(b) {
    for (let i = 0; i < b.N; i++) {
      yield openAndCloseActivityStreamTab(b, ACTIVITY_STREAMS_URL);
    }
  }, 2e6); // run this benchmark function for 2 seconds (2e6 microseconds)
```
where the for loop is required so that the framework can execute the benchmark function sufficiently in order to attain a reasonable result. The framework is responsible for choosing the good iteration number `b.N` based on the actual running time of the benchmark function and the predefined benchmarking time. We can overwrite the default benchmarking time (1 second) by specifying the second argument of the `Benchmark` constructor. In this case, we're using 2 second (i.e. 2e6 us).

Finally, we can launch the benchmark driver, let it finish, and log the result. Reference the [Benchmark](test/lib/Benchmark.js) for more detail.

## Step 2: run this benchmark

You can run this benchmark by

`npm run benchmark-with -- -f test/test-your-benchmark.js`,

which is equivalent to the following command

`jpm test -b Nightly --prefs ./benchmark-prefs.json -f test/test-demo1-benchmark.js`.

Alternatively, you can run all the benchmarks by

`npm run benchmark`.

By default, the framework will set the log level as "error" in order to create a "quiet" work environment. If you do want to do some logging, the benchmark framework provides a "forceLog" function, which acts exactly the same as the `console.log` regardless of the current log level.

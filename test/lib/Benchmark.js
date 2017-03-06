/* globals XPCOMUtils, Services, Task */
"use strict";

const {Ci, Cu} = require("chrome");
const prefs = require("sdk/preferences/service");
const self = require("sdk/self");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyModuleGetter(global, "Task",
                                  "resource://gre/modules/Task.jsm");

// The default benchmark time is 1 second, i.e. 1e6 microseconds
const DEFAULT_BENCH_TIME = 1e6;

// For the performance.now(), so the timer resolution is 1 microsecond
const performance = Services.appShell.hiddenDOMWindow.performance;

// The max iteration number is 1e6 as the timer resolution is 1 microsecond
const MAX_ITERATION = 1e6;

/*
 * Get the DOMHighResTimeStamp in microseconds
 *
 * Note that the actual resolution is subject to the implementation and platforms
 *
 * See more detail at
 *   https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
 *   https://www.w3.org/TR/2013/WD-hr-time-2-20131203/#sec-DOMHighResTimeStamp
 */
function _performanceNowInUs() {
  return performance.now() * 1e3;
}

/*
 * A simple benchmark framework for Activity Stream that runs on top of jpm test
 *
 * If you're new to Javascript benchmarking, here is a list of references:
 *
 *   https://developer.mozilla.org/en-US/docs/Mozilla/Benchmarking
 *   https://mathiasbynens.be/notes/javascript-benchmarking
 *   http://ejohn.org/blog/javascript-benchmark-quality/
 *
 * Suitable use cases:
 *   * functions without or with little side effect, i.e. IO/file system/database dependency
 *
 * Unsuitable use cases:
 *   * benchmark functions running at the nanoseconds level, it doesn't support nanosecond resolution
 *   * measure the functions or code paths with side effects. Although, you may mitigate that by
 *     leveraging the timer functions. But the results could be incorrect and hard to interpret
 *
 * Benchmarking Activity Stream requires extra effort in following cases,
 *   * measure the load latency of Activity Stream with different profiles and browsering history
 *   * measure the time-consuming functions or code paths found by the profiler. In particular,
 *     the performance difference after the improvement or optimization
 * Since Activity Stream is IO intensive, and makes extensive use of cache, the benchmark could be
 * biased by those confounding variables. It's highly recommended to take proper actions inside benchmark
 * function. For instance, cleaning up cache to benchmark the cold start. The benchmark timer functions
 * can be used to prevent benchmark from timing those unrelated operations
 *
 * Example:

  function fib(n) {
    if (n < 2) {
      return n;
    }

    return fib(n - 1) + fib(n - 2);
  }

  exports.test_benchmark = function*() {
    let bench = new Benchmark(b => {
      for (let i = 0; i < b.N; i++) {
        fib(20);
      }
    });
    let result = yield bench.launch();
    console.log(result);
  };
*/

/*
 * Constructor of benchmark
 *
 * {Params} func is the benchmark function/generator that is of the form
 *
   function benchFunc(b) {
     for (let i = 0; i < b.N; i++) {
       // do your stuff here
     }
   }

 * Where the argument b is the current benchmark instance. A couple of timer functions
 * are availale to get the finer-grained control of benchmark timing. For instance,
 * avoid timing the expensive irrelevant functions, like setup of benchmark fixture.
 * See more detail in startTimer(), resetTimer(), and stopTimer()
 *
 * It's intentional to have a for loop inside the benchmark function, otherwise the framework
 * has to call the benchmark function for b.N times, which might introduce some overheads
 * if b.N is a big integer
 *
 * Also note that the framework will choose a good iteration number b.N based on how fast
 * the target benchmark function runs. Therefore, the user should never mutate it
 *
 * {Params} benchTime is the benchmark time in microseconds, by default it's one second
 */
function Benchmark(func, benchTime = DEFAULT_BENCH_TIME) {
  this._failed = false;
  this._benchFunc = func;
  this._benchTime = benchTime;
  this._timerOn = false;
  this._start = 0;
  this._duration = 0;
  // N is public to the benchmark functions
  this.N = 0;
}

Benchmark.prototype = {
  /*
   * Starts the timer for the benchmark. This function is called automatically
   * before each benchmark. It also can be used to resume timing after the
   * stopTimer function call
   */
  startTimer() {
    if (!this._timerOn) {
      this._start = _performanceNowInUs();
      this._timerOn = true;
    }
  },

  /*
   * Resets the timer if it is in use. It also zeros the benchmark's duration
   */
  resetTimer() {
    if (this._timerOn) {
      this._start = _performanceNowInUs();
    }
    this._duration = 0;
  },

  /*
   * Stops the timer if it is in use. It also calculates the benchmark's duration
   */
  stopTimer() {
    if (this._timerOn) {
      this._duration += (_performanceNowInUs() - this._start);
      this._timerOn = false;
    }
  },

  /*
   * Calculates the duration per operation in microseconds
   */
  _usPerOp() {
    if (!this.N) {
      return 0;
    }
    return Math.round(this._duration / this.N);
  },

  /*
   * Rounds the given integer up to be one of [1eX, 2eX, 3eX, 5eX, 10eX]
   *
   * We wanted to apply this adjustment to the iteration numbers to:
   * 1. be more human readable
   * 2. mimic the traditional benchmark approach, where the benchmark designer
   *    specifies some frequently used iteration numbers beforehand
   */
  _roundsUp(n) {
    let nn = n;
    let tens = 0;
    while (nn >= 10) {
      nn /= 10;
      tens++;
    }

    let base = 1;
    for (let i = 0; i < tens; i++) {
      base *= 10;
    }

    if (n <= base) {
      return base;
    } else if (n <= 2 * base) {
      return 2 * base;
    } else if (n <= 3 * base) {
      return 3 * base;
    } else if (n <= 5 * base) {
      return 5 * base;
    }
    return 10 * base;
  },

  /*
   * Runs the benchmark once, this function is used to get the first estimate of
   * the speed of the benchmark
   *
   * Note that this funciton will catch the exceptions in the benchmark function,
   * and will set the flag upon those exceptions accrodingly
   */
  _asyncRun1: Task.async(function*() {
    try {
      yield this._asyncRunN(1);
    } catch (e) {
      this._failed = true;
    }
  }),

  /*
   * Runs the benchmark for a given times with timer
   *
   * It will try to get a fair environment for each run by forcing the garbage collection
   * Note that the Cu.forceGC won't trigger the cycle collector, so it makes use of
   * nsIDOMWindowUtils.garbageCollect for a thorough GC
   *
   * Reference:
   *   https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Language_Bindings/Components.utils.forceGC
   *
   * It will not handle any exceptions thrown from the benchmark function
   */
  _asyncRunN: Task.async(function*(n) {
    Services.appShell.hiddenDOMWindow
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindowUtils)
            .garbageCollect();
    this.N = n;
    this.resetTimer();
    this.startTimer();
    yield this._benchFunc(this);
    this.stopTimer();
  }),

  /*
   * Choose a good iteration number for the benchmark
   *
   * {Params} hz is the current benchmark frequency
   * {Params} last is the last iteration number
   *
   * It returns a integer that is considered as a good iteration number
   */
  _chooseN(hz, last) {
    let n = hz;

    // It runs more (1.2x) than the estimated frequency
    const amplified = Math.round(n * 1.2);

    // Do not grow too fast in case of the incorrect previous timing,
    // so it'll be capped by 100x of last iteration
    const capped = 100 * last;
    n = Math.min(amplified, capped);

    // Make sure it at least runs one more than last iteration
    n = Math.max(n, last + 1);

    // Rounds up the estimate to make it easy to read
    return this._roundsUp(n);
  },

  /*
   * Launches and times the benchmark
   *
   * To begin with, it executes the benchmark function once to figure out its
   * speed. Then it attempts to predict a reasonable iteration number given
   * the pre-defined benchmark time and estimated speed. In case of the incorrect
   * estimations, it will retry the benchmark with a biggr loop until the actual
   * benchmark duration reaches the expected duration
   *
   * This function returns an object with the benchmark status, the iteration number,
   * the actual duration, and the duration per operation in microseconds. The status
   * will be set as failed if any exception is thrown during the benchmark, and the
   * benchmark will abort immediately
   */
  launch: Task.async(function*() {
    let n = 1;

    yield this._asyncRun1();
    while (!this._failed && this._duration < this._benchTime && n < MAX_ITERATION) {
      let last = n;

      // Calulate the iteration number based on the current estimate of duration per op
      if (!this._usPerOp()) {
        n = MAX_ITERATION;
      } else {
        n = Math.round(this._benchTime / this._usPerOp());
      }

      n = this._chooseN(n, last);
      try {
        yield this._asyncRunN(n);
      } catch (e) {
        this._failed = true;
      }
    }

    return {
      ok: !this._failed,
      N: this.N,
      duration: this._duration,
      usPerOp: this._usPerOp()
    };
  })
};

const PREF_LOG_LEVEL = `extensions.${self.id}.sdk.console.logLevel`;

// forceLog allows the user to use the console.log() regardless the current log level
function forceLog() {
  let logLevel = prefs.get(PREF_LOG_LEVEL, "error");
  prefs.set(PREF_LOG_LEVEL, "info");
  console.log.call(console, ...arguments); // eslint-disable-line
  prefs.set(PREF_LOG_LEVEL, logLevel);
}

exports.Benchmark = Benchmark;
exports.forceLog = forceLog;

/* globals XPCOMUtils, Services, Task */
"use strict";

const {Cu} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");
// For the performance.now()
const performance = Services.appShell.hiddenDOMWindow.performance;

/*
 * A simple benchmark framework that runs on top of jpm test
 *
 * Note that the timing resolution for the benchmark is microsecond
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
 * {Params} func is the benchmark function/generator that is of the following form
 *
   function(b) {
     for (let i = 0; i < b.N; i++) {
       // do your stuff here
     }
   }
 * Note that the framework will decide the best iteration number b.N based on
 * how fast the target benchmark function runs
 *
 * {Params} benchTime is the benchmark time in microseconds, by default it's one second
 */
function Benchmark(func, benchTime = 1e6) {
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
   * before each benchmark. It also can be used to resuming timing after the
   * stopTimer function call
   */
  startTimer() {
    if (!this._timerOn) {
      this._start = performance.now() * 1e3;
      this._timerOn = true;
    }
  },

  /*
   * Resets the start timer if the timer is in use. It also zeros the benchmark's
   * duration
   */
  resetTimer() {
    if (this._timerOn) {
      this._start = performance.now() * 1e3;
    }
    this._duration = 0;
  },

  /*
   * Stops the timer if the timer is in use. It also calculates the benchmark's
   * duration
   */
  stopTimer() {
    if (this._timerOn) {
      this._duration += (performance.now() * 1e3 - this._start);
      this._timerOn = false;
    }
  },

  _usPerOp() {
    if (this.N <= 0) {
      return 0;
    }
    return Math.round(this._duration / this.N);
  },

  /*
   * Rounds the given integer up to a number of the form [1eX, 2eX, 3eX, 5eX, 1e(X+1)]
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
   * Runs the benchmark once, this is used to get the basic speed of the benchmark
   */
  _asyncRun1: Task.async(function*() {
    try {
      yield this._asyncRunN(1);
    } catch (e) {
      this._failed = true;
    }
  }),

  _asyncRunN: Task.async(function*(n) {
    this.N = n;
    this.resetTimer();
    this.startTimer();
    yield this._benchFunc(this);
    this.stopTimer();
  }),

  launch: Task.async(function*() {
    let n = 1;

    yield this._asyncRun1();
    while (!this._failed && this._duration < this._benchTime && n < 1e6) {
      let last = n;
      if (!this._usPerOp()) {
        n = 1e6;
      } else {
        n = Math.round(this._benchTime / this._usPerOp());
      }
      // Run more (1.2x) than we predict, don't grow too fast in case of
      // the incorrect previous timing. At least run 1 more than last time
      n = Math.max(Math.min(Math.round(n + n / 5), 100 * last), last + 1);
      n = this._roundsUp(n);
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

exports.Benchmark = Benchmark;

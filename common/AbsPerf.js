"use strict";

let usablePerfObj;

// if we're running in an addon module
if (typeof Window === "undefined") {
  const {Cu} = require("chrome");
  Cu.import("resource://gre/modules/Services.jsm");

  // Borrow the high-resolution timer from the hidden window....
  usablePerfObj = Services.appShell.hiddenDOMWindow.performance;
} else { // we must be running in content space
  usablePerfObj = performance;
}

function _AbsPerf() {
}
_AbsPerf.prototype = {
  /**
   * Drop in replacement for Date.now, using performance.now to get monotonic
   * high resolution timing.  Useful since we need to be able to do math with
   * timestamps obtained both in chrome (from the hidden window) and in
   * content.  At some point, we may want to replace/augment this with
   * something that returns even higher precision (non-integer ms, since
   * Performance.now is supposed to offer 5us granularity).
   *
   * @return {Number} Milliseconds since the UNIX epoch, rounded to the nearest
   * integer.
   *
   */
  now: function now() {
    return Math.round(usablePerfObj.timing.navigationStart + usablePerfObj.now());
  }
};

module.exports = {
  absPerf: new _AbsPerf(),  // a singleton
  _AbsPerf
};

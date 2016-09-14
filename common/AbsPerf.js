/* globals Services */
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
   * returns Performance.now as the absolute number milliseconds since the
   * UNIX epoch, instead of since performance.timing.navigationStart.  We need
   * to be able to do math with timestamps obtained both in chrome (from the
   * hidden window) and in content.
   */
  now: function now() {
    return usablePerfObj.timing.navigationStart + usablePerfObj.now();
  }
};

module.exports = {
  absPerf: new _AbsPerf(),  // a singleton
  _AbsPerf
};

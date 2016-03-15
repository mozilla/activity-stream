/* globals Services */

"use strict";
const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
Cu.import("resource://gre/modules/Services.jsm");

function Memoizer() {
  this._cacheEnabled = simplePrefs.prefs["query.cache"];
  this._memo_all = {};
  this._onPrefChange = this._onPrefChange.bind(this);
  simplePrefs.on("", this._onPrefChange);
}

Memoizer.prototype = {

  memoize(key, func) {
    let concat = String.prototype.concat;
    return (...args) => {
      if (!this._memo_all[key]) {
        this._memo_all[key] = {};
      }
      let memo = this._memo_all[key];

      // allow object params to be passed, as is expected of query functions
      let parts = [];
      for (let arg of args) {
        if (typeof arg === "object") {
          // sort so we have a stable key
          let props = Object.keys(arg).sort();
          for (let prop of props) {
            parts.push(`${prop}:${arg[prop]}`);
          }
        } else {
          parts.push(arg);
        }
      }
      let repr = concat.call(parts);

      if (this._cacheEnabled && repr in memo) {
        Services.obs.notifyObservers(null, `${key}-cache`, "hit");
        return memo[repr];
      } else {
        Services.obs.notifyObservers(null, `${key}-cache`, "miss");
        memo[repr] = func.apply(this, args);
        return memo[repr];
      }
    };
  },

  invalidateMemos(memoKeys) {
    for (let key of memoKeys) {
      delete this._memo_all[key];
    }
  },

  reset() {
    this._memo_all = {};
  },

  _onPrefChange(prefName) {
    if (prefName === "query.cache") {
      this._cacheEnabled = simplePrefs.prefs["query.cache"];
    }
  },

  uninit() {
    simplePrefs.off("", this._onPrefChange);
  }
};

exports.Memoizer = Memoizer;

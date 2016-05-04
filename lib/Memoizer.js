/* globals Services, Task */

"use strict";
const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
const ss = require("sdk/simple-storage");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Task.jsm");

const concat = String.prototype.concat;

function Memoizer() {
  this._cacheEnabled = simplePrefs.prefs["query.cache"];

  if (!ss.storage.queryCache) {
    ss.storage.queryCache = {};
  }
  this._onPrefChange = this._onPrefChange.bind(this);
  simplePrefs.on("", this._onPrefChange);
}

Memoizer.prototype = {

  /**
   * Return a function that will wrap a given function and cache its results.
   *
   * @param {String} key
   *   a key to store/retrieve cached values
   *
   * @param {Function} func
   *   a function to wrap for caching
   *
   * @return {Promise}
   *   A promise whose result contains data
   */
  memoize(key, func) {
    return (...args) => {
      // allow object params to be passed, as is expected of query functions
      let repr = this._makeRepr(args);

      if (this._cacheEnabled && this.hasRepr(key, repr)) {
        Services.obs.notifyObservers(null, `${key}-cache`, "hit");
        return new Promise(resolve => resolve(this.getData(key, repr)));
      } else {
        Services.obs.notifyObservers(null, `${key}-cache`, "miss");
        return Task.spawn(function*() {
          let data = yield func.apply(this, args);
          this.cacheData(key, repr, data);
          return data;
        }.bind(this));
      }
    };
  },

  /**
   * Returns a string representation of parameters to be used as a cache sub-key
   */
  _makeRepr(args) {
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
    return concat.call(parts);
  },

  /**
   * Stores data in the cache
   *
   * @param {String} key
   *   A key for values to be stored
   * @param {String} repr
   *   A sub-key for cached values
   * @param {Object} data
   *   JSON serializable data to cache
   */
  cacheData(key, repr, data) {
    if (!ss.storage.queryCache[key]) {
      ss.storage.queryCache[key] = {};
    }
    ss.storage.queryCache[key][repr] = data;
  },

  getData(key, repr) {
    if (this.hasRepr(key, repr)) {
      return ss.storage.queryCache[key][repr];
    }
    return undefined;
  },

  /**
   * Returns whether or not the cache contains a key/parameter combination
   *
   * @returns {Boolean} presence of key/parameter in cache
   */
  hasRepr(key, repr) {
    return key in ss.storage.queryCache && repr in ss.storage.queryCache[key];
  },

  invalidateMemos(memoKeys) {
    for (let key of memoKeys) {
      delete ss.storage.queryCache[key];
    }
  },

  reset() {
    ss.storage.queryCache = {};
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

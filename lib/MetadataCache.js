"use strict";

const simplePrefs = require("sdk/simple-prefs");
const ss = require("lib/SimpleStorage.js");
const List = require("lib/vendor.bundle").DoublyLinkedList;

const PREF_STRING = "metadata-store.query.cache";

/* A simple LRU cache for metadata store queries based on the simple storage.
 * */
function MetadataCache(onEvicted = null) {
  this._cacheEnabled = simplePrefs.prefs[PREF_STRING];

  if (!ss.storage.metaQueryCache) {
    ss.storage.metaQueryCache = {};
  }
  this._cache = ss.storage.metaQueryCache;
  this._list = new List();
  Object.keys(this._cache).forEach(key => {
    this._list.append(key);
  });
  this._onEvicted = onEvicted;

  this._onPrefChange = this._onPrefChange.bind(this);
  simplePrefs.on("", this._onPrefChange);

  this._onOverQuota = this._onOverQuota.bind(this);
  ss.on("OverQuota", this._onOverQuota);
}

MetadataCache.prototype = {
  /* Add a key value pair to the cache
   * If the key already exists, it overwrites the old value
   */
  add(key, value) {
    if (!this._cacheEnabled) {
      return;
    }

    if (key in this._cache) {
      this._moveToFront(key);
      this._cache[key] = value;
      return;
    }
    this._list.append(key);
    this._cache[key] = value;
  },

  _listGetNode(key) {
    let node = this._list.head();
    while (node) {
      if (node.data === key) {
        return node;
      }
      node = node.next;
    }
    return null;
  },

  _moveToFront(key) {
    const node = this._listGetNode(key);
    if (node === this._list.head()) {
      return;
    }
    if (node) {
      node.remove();
      this._list.append(key);
    }
  },

  get(key) {
    if (key in this._cache) {
      this._moveToFront(key);
      return this._cache[key];
    }
    return null;
  },

  remove(key) {
    if (key in this._cache) {
      this._removeElementByKey(key);
    }
  },

  removeOldest(key) {
    if (this.length) {
      let key = this._list.tail().data;
      this._removeElementByKey(key);
    }
  },

  _removeElementByKey(key) {
    const node = this._listGetNode(key);
    if (node) {
      node.remove();
      const value = this._cache[key];
      delete this._cache[key];
      if (this._onEvicted) {
        this._onEvicted(key, value);
      }
    }
  },

  /* Reset the cache and wipe out the data in the backing store
   * */
  reset() {
    this._cache = {};
    this._list = new List();
  },

  get length() {
    return this._list.size();
  },

  _onOverQuota() {
    while (ss.quotaUsage > 1 && this.length) {
      this.removeOldest();
    }
  },

  _onPrefChange(prefName) {
    if (prefName === PREF_STRING) {
      this._cacheEnabled = simplePrefs.prefs[PREF_STRING];
    }
  },

  uninit() {
    simplePrefs.off("", this._onPrefChange);
    ss.removeListener("OverQuota", this._onOverQuota);
  }
};

exports.MetadataCache = MetadataCache;

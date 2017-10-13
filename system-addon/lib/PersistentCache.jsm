/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "OS", "resource://gre/modules/osfile.jsm");
XPCOMUtils.defineLazyGetter(this, "gTextDecoder", () => new TextDecoder());

/**
 * A file (disk) based persistent cache of a JSON serializable object.
 */
this.PersistentCache = class PersistentCache {

  /**
   * Create a cache object based on a name.
   *
   * @param {string} name Name of the cache. It will be used to create the filename.
   * @param {boolean} preload (optional). Whether the cache should be preloaded from file. Defaults to false.
   */
  constructor(name, preload = false) {
    this.name = name;
    if (preload) {
      this._load();
    }
  }

  /**
   * Set a value to be cached with the specified key.
   *
   * @param {string} key The cache key.
   * @param {object} value The data to be cached.
   */
  async set(key, value) {
    const data = await this._load();
    data[key] = value;
    this._persist(data);
  }

  /**
   * Get a value from the cache.
   *
   * @param {string} key (optional) The cache key. If not provided, we return the full cache.
   * @returns {object} The cached data.
   */
  async get(key) {
    const data = await this._load();
    return key ? data[key] : data;
  }

  /**
   * Load the cache into memory if it isn't already.
   */
  _load() {
    return this._cache || (this._cache = new Promise(async resolve => {
      let data = {};
      const filename = `${this.name}.json`;
      try {
        const filepath = OS.Path.join(OS.Constants.Path.localProfileDir, filename);
        const fileExists = await OS.File.exists(filepath);
        if (fileExists) {
          const binaryData = await OS.File.read(filepath);
          const json = gTextDecoder.decode(binaryData);
          data = JSON.parse(json);
        }
      } catch (error) {
        Cu.reportError(`Failed to load ${filename}: ${error.message}`);
      }
      resolve(data);
    }));
  }

  /**
   * Persist the cache to file.
   */
  _persist(data) {
    const filepath = OS.Path.join(OS.Constants.Path.localProfileDir, `${this.name}.json`);
    this._cache = new Promise(resolve => resolve(data));
    OS.File.writeAtomic(filepath, JSON.stringify(data), {tmpPath: `${filepath}.tmp`});
  }
};

this.EXPORTED_SYMBOLS = ["PersistentCache"];

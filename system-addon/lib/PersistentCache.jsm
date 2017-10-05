/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "OS", "resource://gre/modules/osfile.jsm");
XPCOMUtils.defineLazyGetter(this, "gTextDecoder", () => new TextDecoder());

// Map of filenames to the latest data in them.
XPCOMUtils.defineLazyGetter(this, "gInMemoryCache", () => new Map());
// A list of cache files that has already been loaded.
XPCOMUtils.defineLazyGetter(this, "gFilesLoaded", () => []);

/**
 * A disk based persistent cache.
 */
this.PersistentCache = class PersistentCache {

  /**
   * Create a cache object based on a filename.
   *
   * @param {string} filename Name of the file to use to persist the cache to disk.
   */
  constructor(filename) {
    this.filename = filename;
    gInMemoryCache.set(this.filename, {});
  }

  /**
   * Set a value to be cached with the specified key.
   *
   * @param {string} key The cache key.
   * @param {object} value The data to be cached.
   */
  set(key, value) {
    gInMemoryCache.get(this.filename)[key] = value;
    this.saveToFile();
  }

  /**
   * Get a value from the cache.
   *
   * @param {string} key The cache key.
   * @returns {object} The cached data.
   */
  async get(key) {
    if (!gFilesLoaded.includes(this.filename)) {
      await this.loadFromFile();
    }
    if (key) {
      return gInMemoryCache.get(this.filename)[key];
    }
    return gInMemoryCache.get(this.filename);
  }

  /**
   * Load the cache into memory from the file.
   */
  async loadFromFile() {
    let data = {};
    // let timestamp = 0;
    try {
      const filepath = OS.Path.join(OS.Constants.Path.localProfileDir, this.filename);
      const fileExists = await OS.File.exists(filepath);
      if (fileExists) {
        const binaryData = await OS.File.read(filepath);
        const json = gTextDecoder.decode(binaryData);
        data = JSON.parse(json);
      }
    } catch (error) {
      Cu.reportError(`Failed to load ${this.filename}: ${error.message}`);
    }
    // If there is anything already in the in memory cache, we should keep it.
    data = Object.assign(data, gInMemoryCache.get(this.filename));
    gInMemoryCache.set(this.filename, data);
    gFilesLoaded.push(this.filename);
  }

  /**
   * Save the cache in memory to file.
   */
  saveToFile() {
    const data = gInMemoryCache.get(this.filename);
    const filepath = OS.Path.join(OS.Constants.Path.localProfileDir, this.filename);
    OS.File.writeAtomic(filepath, JSON.stringify(data), {tmpPath: `${filepath}.tmp`});
  }
};

this.EXPORTED_SYMBOLS = ["PersistentCache"];

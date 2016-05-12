/* globals Task, require, exports, Services */
"use strict";

const {Cu} = require("chrome");
const ss = require("sdk/simple-storage");
const simplePrefs = require("sdk/simple-prefs");
const self = require("sdk/self");
const {setTimeout, clearTimeout} = require("sdk/timers");
const {TippyTopProvider} = require("lib/TippyTopProvider");

const EMBEDLY_PREF = "embedly.endpoint";
const EMBEDLY_VERSION_QUERY = "?addon_version=";
const ENABLED_PREF = "previews.enabled";
const ALLOWED_PREFS = new Set([EMBEDLY_PREF, ENABLED_PREF]);

const ALLOWED_QUERY_PARAMS = new Set(["id", "p", "q", "query", "s", "search", "sitesearch", "v"]);
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const DISALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const URL_FILTERS = [
  (item) => !!item.url,
  (item) => !!(new URL(item.url)),
  (item) => ALLOWED_PROTOCOLS.has(new URL(item.url).protocol),
  (item) => !DISALLOWED_HOSTS.has(new URL(item.url).hostname)
];

Cu.importGlobalProperties(["fetch"]);
Cu.importGlobalProperties(["URL"]);
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Services.jsm");

const DEFAULT_OPTIONS = {
  cacheCleanupPeriod: 86400000, // a cache clearing job runs at most once every 24 hours
  cacheRefreshAge: 259200000, // refresh a link every 3 days
  cacheTTL: 2592000000, // cached items expire if they haven't been accessed in 30 days
  cacheUpdateInterval: 3600000, // a cache update job runs every hour
  proxyMaxLinks: 25, // number of links embedly proxy accepts per request
  initFresh: false,
};

function PreviewProvider(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._onPrefChange = this._onPrefChange.bind(this);
  this._tippyTopProvider = new TippyTopProvider();
  this.init();
  this._runPeriodicUpdate();
}

PreviewProvider.prototype = {
  _updateTimeout: null,

  /**
   * Clean-up the preview cache
   */
  cleanUpCacheMaybe(force = false) {
    let currentTime = Date.now();
    this._setupState(currentTime);

    // exit if the last cleanup exceeds a threshold
    if (!force && (currentTime - ss.storage.previewCacheState.lastCleanup) < this.options.cacheCleanupPeriod) {
      return;
    }

    for (let key in ss.storage.embedlyData) {
      // in case accessTime is not set, don't crash, but don't clean up
      let accessTime = ss.storage.embedlyData[key].accessTime;
      if (!accessTime) {
        ss.storage.embedlyData[key].accessTime = Date.now();
      }
      if ((currentTime - accessTime) > this.options.cacheTTL) {
        delete ss.storage.embedlyData[key];
      }
    }
    ss.storage.previewCacheState.lastCleanup = currentTime;
    Services.obs.notifyObservers(null, "activity-streams-preview-cache-cleanup", null);
  },

  _setupState(stateTime) {
    if (!ss.storage.previewCacheState) {
      ss.storage.previewCacheState = {lastCleanup: stateTime};
    }
  },

  _onPrefChange(prefName) {
    if (ALLOWED_PREFS.has(prefName)) {
      switch (prefName) {
        case EMBEDLY_PREF:
          this._embedlyEndpoint = simplePrefs.prefs[EMBEDLY_PREF];
          break;
        case ENABLED_PREF:
          if (this.enabled) {
            // if disabling, remove cache and update
            this._clearPeriodicUpdate();
            this.clearCache();
          } else {
            // if enabling, create cache and start updating
            ss.storage.embedlyData = {};
            this._runPeriodicUpdate();
          }
          this.enabled = simplePrefs.prefs[ENABLED_PREF];
          break;
      }
    }
  },

  /**
    * Filter out sites that do not have acceptable protocols and hosts
    */
  _URLFilter(definition) {
    return function(item) {
      return definition.every(test => test(item));
    };
  },

  /**
    * Santize the URL to remove any unwanted or sensitive information about the link
    */
  _sanitizeURL(url) {
    if (!url) {
      return "";
    }

    let newURL = new URL(url);

    // extract and parse the query parameters, if any
    if (newURL.search.length !== 0) {
      let queryParams = new Map(newURL.search.slice(1).split("&").map(pair => pair.split("=")));

      // filter out the allowed query params and update the query string
      newURL.search = Array.from(queryParams.keys())
        .filter(param => ALLOWED_QUERY_PARAMS.has(param))
        .map(param => param = param + "=" + queryParams.get(param)).join("&");
    }

    // remove extra slashes then construct back a safe pathname
    if (newURL.pathname) {
      let safePathItems = newURL.pathname.split("/").filter(item => item.replace(/\/+/, ""));
      let safePath = "/";
      newURL.pathname = safePath + safePathItems.join("/");
    }

    // if the url contains sensitive information, remove it
    if (newURL.username) {
      newURL.username = "";
    }
    if (newURL.password) {
      newURL.password = "";
    }

    newURL.hash = "";
    return newURL.toString();
  },

  /**
    * Create a key based on a URL in order to dedupe sites
    */
  _createCacheKey(url) {
    url = new URL(url);
    let key = url.host.replace(/www\.?/, "");
    key = key + url.pathname + (url.search || "");
    return key.toString();
  },

  /**
    * Canonicalize urls by sanitizing them, then deduping them
    */
  _uniqueLinks(links) {
    let dedupedLinks = new Map();
    links.forEach(link => {
      link.sanitizedURL = this._sanitizeURL(link.url);
      link.cacheKey = this._createCacheKey(link.sanitizedURL);
      if (!dedupedLinks.has(link.cacheKey)) {
        dedupedLinks.set(link.cacheKey, link);
      }
    });
    return Array.from(dedupedLinks.values());
  },

  /**
    * Process the raw links that come in
    */
  processLinks(links) {
    let sites = this._uniqueLinks(links.filter(this._URLFilter(URL_FILTERS)));
    return sites;
  },

  /**
    * Returns links with previews if available. Optionally return those with previews only
    */
  getEnhancedLinks(links, previewsOnly = false) {
    if (!this.enabled) {
      return links;
    }

    let now = Date.now();

    let results = links.map(link => {
      if (link && link.cacheKey && ss.storage.embedlyData[link.cacheKey]) {
        ss.storage.embedlyData[link.cacheKey].accessTime = now;
        return Object.assign({}, ss.storage.embedlyData[link.cacheKey], link);
      } else {
        return previewsOnly ? null : link;
      }
    })
    .filter(link => link);

    // gives the opportunity to have at least one run with an old
    // preview cache. This is for the case where one hasn't opened
    // the browser since `cacheTTL`
    this.cleanUpCacheMaybe();

    return results;
  },

  /**
   * Request links from embedly, optionally filtering out known links
   */
  asyncSaveLinks: Task.async(function*(links, newOnly = true, updateAccessTime = true) {
    // optionally filter out known links, and links which already have a request in process
    let linksList = links.filter(link => link && (!newOnly || !ss.storage.embedlyData[link.cacheKey]) && !this._alreadyRequested.has(link.cacheKey));
    linksList.forEach(link => this._alreadyRequested.add(link.cacheKey));
    let requestQueue = [];
    let promises = [];
    while (linksList.length !== 0) {
      // we have some new links we need to fetch the embedly data for, put them on the queue
      requestQueue.push(linksList.splice(0, this.options.proxyMaxLinks));
    }
    // for each bundle of 25 links, create a new request to embedly
    requestQueue.forEach(requestBundle => {
      promises.push(this._asyncFetchAndCache(requestBundle, updateAccessTime));
    });
    yield Promise.all(promises);
  }),

  /**
   * Asynchronously update links
   */
  asyncUpdateLinks: Task.async(function*() {
    let links = [];
    let currentTime = Date.now();
    for (let key in ss.storage.embedlyData) {
      let link = ss.storage.embedlyData[key];
      if (!link.refreshTime || (currentTime - link.refreshTime) > this.options.cacheRefreshAge) {
        links.push(link);
      }
    }
    yield this.asyncSaveLinks(links, false, false);
    Services.obs.notifyObservers(null, "activity-streams-preview-cache-update", null);
  }),

  /**
   * Runs a periodic update
   */
  _runPeriodicUpdate() {
    this._updateTimeout = setTimeout(() => {
      this.asyncUpdateLinks().then(() => {
        this._runPeriodicUpdate();
      });
    }, this.options.cacheUpdateInterval);
  },

  /**
   * Makes the necessary requests to embedly to get data for each link
   */
  _asyncGetLinkData: Task.async(function*(newLinks) {
    try {
      let response = yield fetch(this._embedlyEndpoint, {
        method: "POST",
        body: JSON.stringify({urls: newLinks}),
        headers: {"Content-Type": "application/json"}
      });
      return response;
    } catch (err) {
      Cu.reportError(err);
      throw err;
    }
  }),

  /**
   * Extracts data from embedly and caches it
   */
  _asyncFetchAndCache: Task.async(function*(newLinks, updateAccessTime = true) {
    if (!this.enabled) {
      return;
    }
    // extract only the sanitized link urls to send to embedly
    let linkURLs = newLinks.map(link => link.sanitizedURL);
    try {
      // Make network call when enabled
      let response = yield this._asyncGetLinkData(linkURLs);
      if (response.ok) {
        let responseJson = yield response.json();
        let currentTime = Date.now();
        newLinks.forEach(link => {
          let data = responseJson.urls[link.sanitizedURL];
          if (!data) {
            return;
          }
          data = this._tippyTopProvider.processSite(data);
          ss.storage.embedlyData[link.cacheKey] = Object.assign({}, ss.storage.embedlyData[link.cacheKey], data);
          if (updateAccessTime) {
            ss.storage.embedlyData[link.cacheKey].accessTime = currentTime;
          }
          ss.storage.embedlyData[link.cacheKey].refreshTime = currentTime;
        });
      }
    } catch (err) {
      Cu.reportError(err);
      throw err;
    }
    // regardess of if the link has been cached or if the request has failed, we
    // must still remove the in-flight links from the list
    newLinks.forEach(link => this._alreadyRequested.delete(link.cacheKey));
  }),

  /**
   * Initialize the simple storage
   */
  init() {
    this._alreadyRequested = new Set();
    this._embedlyEndpoint = simplePrefs.prefs[EMBEDLY_PREF] + EMBEDLY_VERSION_QUERY + self.version;
    this.enabled = simplePrefs.prefs[ENABLED_PREF];
    if (!ss.storage.embedlyData || this.options.initFresh) {
      ss.storage.embedlyData = {};
    }
    simplePrefs.on("", this._onPrefChange);
    this._setupState(Date.now());
  },

  /**
   * Clear out the preview cache
   */
  clearCache() {
    delete ss.storage.previewCacheState;
    delete ss.storage.embedlyData;
  },

  /**
   * Clear update timeout
   */
  _clearPeriodicUpdate() {
    if (this._updateTimeout) {
      clearTimeout(this._updateTimeout);
    }
  },

  /**
   * Uninit the preview provider
   */
  uninit() {
    this._clearPeriodicUpdate();
    simplePrefs.off("", this._onPrefChange);
    this._alreadyRequested = new Set();
  },
};

exports.PreviewProvider = PreviewProvider;

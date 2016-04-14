/* globals Task, require, exports, Services */
"use strict";

const {Cu} = require("chrome");
const ss = require("sdk/simple-storage");
const simplePrefs = require("sdk/simple-prefs");
const EMBEDLY_PREF = "embedly.endpoint";
const ENABLED_PREF = "previews.enabled";
const ALLOWED_PREFS = new Set([EMBEDLY_PREF, ENABLED_PREF]);

const ALLOWED_QUERY_PARAMS = new Set(["id", "p", "q", "query", "s", "search", "sitesearch"]);
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
  proxyMaxLinks: 25, // number of links embedly proxy accepts per request
  initFresh: false,
};

function PreviewProvider(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._onPrefChange = this._onPrefChange.bind(this);
  this.init();
}

PreviewProvider.prototype = {
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
      if ((currentTime - ss.storage.embedlyData[key].accessTime) > this.options.cacheTTL) {
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
            // if disabling, remove cache
            this.clearCache();
          } else {
            // if enabling, create cache
            ss.storage.embedlyData = {};
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
      let queryParams = new Map(newURL.search.slice(1).split("&").map(pair => pair.split("=").map(decodeURIComponent)));

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
    key = key + url.pathname;
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
    * Filter cached links out, and store their embedly data
    */
  getCachedLinks(links) {
    if (!this.enabled) {
      return links;
    }

    this.cleanUpCacheMaybe();
    let now = Date.now();

    return links.map(link => {
      if (link && link.cacheKey && ss.storage.embedlyData[link.cacheKey]) {
        ss.storage.embedlyData[link.cacheKey].accessTime = now;
        return Object.assign({}, ss.storage.embedlyData[link.cacheKey], link);
      } else {
        return null;
      }
    })
    .filter(link => link);
  },

  /**
   * Request links from embedly, optionally filtering out known links
   */
  asyncSaveLinks: Task.async(function*(links, newOnly = true, updateAccessTime = true) {
    let linksList = links.filter(link => link && (!newOnly || !ss.storage.embedlyData[link.cacheKey]));
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
          const data = responseJson.urls[link.sanitizedURL];
          if (!data) {
            return;
          }
          ss.storage.embedlyData[link.cacheKey] = data;
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
  }),

  /**
   * Initialize the simple storage
   */
  init() {
    this._embedlyEndpoint = simplePrefs.prefs[EMBEDLY_PREF];
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
   * Uninit the preview provider
   */
  uninit() {
    simplePrefs.off("", this._onPrefChange);
  },
};

exports.PreviewProvider = PreviewProvider;

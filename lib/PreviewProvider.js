/* globals Task, require, exports, Services */
"use strict";

const {Cu} = require("chrome");
const ss = require("sdk/simple-storage");
const simplePrefs = require("sdk/simple-prefs");
const self = require("sdk/self");
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
  proxyMaxLinks: 25, // number of links embedly proxy accepts per request
  initFresh: false,
};

function PreviewProvider(tabTracker, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._onPrefChange = this._onPrefChange.bind(this);
  this._tippyTopProvider = new TippyTopProvider();
  this._tabTracker = tabTracker;
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
      if (!dedupedLinks.has(link.cacheKey)) {
        dedupedLinks.set(link.cacheKey, link);
      }
    });
    return Array.from(dedupedLinks.values());
  },

  /**
    * Process the raw links that come in,
    * adds a sanitizeURL and cacheKey
    */
  processLinks(links) {
    return links
      .filter(this._URLFilter(URL_FILTERS))
      .map(link => {
        const sanitizedURL = this._sanitizeURL(link.url);
        const cacheKey = this._createCacheKey(sanitizedURL);
        return Object.assign({}, link, {sanitizedURL, cacheKey});
      });
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
      if (!link) {
        return link;
      }

      // Add tippy top data, if available
      link = this._tippyTopProvider.processSite(link);

      if (link.cacheKey && ss.storage.embedlyData[link.cacheKey]) {
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
   * Determine if a cached link has expired
   */
  isLinkExpired(link) {
    const cachedLink = ss.storage.embedlyData[link.cacheKey];
    if (!cachedLink) {
      return false;
    }
    let currentTime = Date.now();
    return (currentTime - cachedLink.refreshTime) > this.options.cacheRefreshAge;
  },

  /**
   * Request links from embedly, optionally filtering out known links
   */
  asyncSaveLinks: Task.async(function*(links, event = {}, newOnly = true, updateAccessTime = true) {
    let linksList = this._uniqueLinks(links)
      .filter(link => link)
      // If a request is in progress, don't re-request it
      .filter(link => !this._alreadyRequested.has(link.cacheKey))
      // If we already have the link in the cache, don't request it again...
      // ... UNLESS it has expired
      .filter(link => !newOnly || !ss.storage.embedlyData[link.cacheKey] || this.isLinkExpired(link));

    linksList.forEach(link => this._alreadyRequested.add(link.cacheKey));

    let requestQueue = [];
    let promises = [];
    while (linksList.length !== 0) {
      // we have some new links we need to fetch the embedly data for, put them on the queue
      requestQueue.push(linksList.splice(0, this.options.proxyMaxLinks));
    }
    // for each bundle of 25 links, create a new request to embedly
    requestQueue.forEach(requestBundle => {
      promises.push(this._asyncFetchAndCache(requestBundle, event, updateAccessTime));
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
  _asyncFetchAndCache: Task.async(function*(newLinks, event, updateAccessTime = true) {
    if (!this.enabled) {
      return;
    }
    // extract only the sanitized link urls to send to embedly
    let linkURLs = newLinks.map(link => link.sanitizedURL);
    this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestSentCount", newLinks.length);
    try {
      // Make network call when enabled and record how long the network call took
      const startNetworkCall = Date.now();
      let response = yield this._asyncGetLinkData(linkURLs);
      const endNetworkCall = Date.now();
      this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestTime", endNetworkCall - startNetworkCall);

      if (response.ok) {
        let responseJson = yield response.json();
        this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestReceivedCount", responseJson.urls.length);
        this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestSucess", 1);
        let currentTime = Date.now();
        newLinks.forEach(link => {
          let data = responseJson.urls[link.sanitizedURL];
          if (!data) {
            return;
          }
          ss.storage.embedlyData[link.cacheKey] = Object.assign({}, ss.storage.embedlyData[link.cacheKey], data);
          if (updateAccessTime) {
            ss.storage.embedlyData[link.cacheKey].accessTime = currentTime;
          }
          ss.storage.embedlyData[link.cacheKey].refreshTime = currentTime;
        });
      } else {
        this._tabTracker.handlePerformanceEvent(event, "embedlyProxyFailure", 1);
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
   * Uninit the preview provider
   */
  uninit() {
    simplePrefs.off("", this._onPrefChange);
    this._alreadyRequested = new Set();
  },
};

exports.PreviewProvider = PreviewProvider;

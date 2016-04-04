/* globals Task, require, exports*/
"use strict";

const {Cu} = require("chrome");
const ss = require("sdk/simple-storage");
const {setTimeout, clearTimeout} = require("sdk/timers");
const simplePrefs = require("sdk/simple-prefs");
const EMBEDLY_ENDPOINT = "embedly.endpoint";

const EMBEDLY_PROXY_MAX_LINKS = 25; // number of links embedly proxy accepts per request
const CLEAR_CACHE_TIMEOUT = 86400000; // 24 hours to clear cache
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

function PreviewProvider() {
  this.init();
  this._embedlyEndpoint = simplePrefs.prefs[EMBEDLY_ENDPOINT];
}

PreviewProvider.prototype = {
  _timeoutID: null,

  /**
    * Clean up cache on addon bootup
    */
  cleanUpCache: Task.async(function*() {
    let currentTime = Date.now();
    Object.keys(ss.storage.embedlyData).forEach(item => {
      if (currentTime - ss.storage.embedlyData[item].accessTime > CLEAR_CACHE_TIMEOUT) {
        delete ss.storage.embedlyData[item];
      }
    });
    this._cacheTimeout();
  }),

  /**
    * Set up the timer for the cache to be cleaned every 24 hours
    */
  _cacheTimeout() {
    this._timeoutID = setTimeout(() => {
      this.cleanUpCache();
    }, CLEAR_CACHE_TIMEOUT);
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
    links.forEach(site => {
      site.sanitizedURL = this._sanitizeURL(site.url);
      site.cacheKey = this._createCacheKey(site.sanitizedURL);
      if (!dedupedLinks.has(site.cacheKey)) {
        dedupedLinks.set(site.cacheKey, site);
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
    let cachedLinks = [];
    links.forEach(link => {
      if (link && ss.storage.embedlyData[link.cacheKey] && link.cacheKey === ss.storage.embedlyData[link.cacheKey].cacheKey) {
        cachedLinks.push(ss.storage.embedlyData[link.cacheKey]);
      }
    });

    return cachedLinks;
  },

  /**
   * Filter out new links and request them from embedly
   */
  saveNewLinks: Task.async(function*(links) {
    let newLinks = links.filter(link => link && !ss.storage.embedlyData[link.cacheKey]);
    let requestQueue = [];
    while (newLinks.length !== 0) {
      // we have some new links we need to fetch the embedly data for, put them on the queue
      requestQueue.push(newLinks.splice(0, EMBEDLY_PROXY_MAX_LINKS));
    }
    // for each bundle of 25 links, create a new request to embedly
    requestQueue.forEach(requestBundle => {
      this._fetchAndCache(requestBundle);
    });
  }),

  /**
   * Makes the necessary requests to embedly to get data for each link
   */
  _getLinkData: Task.async(function*(newLinks) {
    try {
      let response = yield fetch(this._embedlyEndpoint, {
        method: "POST",
        body: JSON.stringify({urls: newLinks}),
        headers: {"Content-Type": "application/json"}
      });
      return response;
    } catch (err) {
      Cu.reportError(err);
    }
  }),

  /**
   * Extracts data from embedly and caches it
   */
  _fetchAndCache: Task.async(function*(newLinks) {
    // extract only the sanitized link urls to send to embedly
    let linkURLs = newLinks.map(link => link.sanitizedURL);
    try {
      let response = yield this._getLinkData(linkURLs);
      if (response.ok) {
        let responseJson = yield response.json();
        const data = newLinks
            .map(site => {
              const details = responseJson.urls[site.sanitizedURL];
              if (!details) {
                return site;
              }
              return Object.assign({}, details, site);
            });
        // store embedly data in cache
        data.map(link => {
          ss.storage.embedlyData[link.cacheKey] = link;
          ss.storage.embedlyData[link.cacheKey].accessTime = Date.now();
        });
      }
    } catch (err) {
      Cu.reportError(err);
    }
  }),

  /**
    * Initialize the simple storage
    */
  init() {
    if (!ss.storage.embedlyData) {
      ss.storage.embedlyData = {};
    }
  },

  /**
    * Unload the preview provider
    */
  unload() {
    clearTimeout(this._timeoutID);
  },
};

exports.PreviewProvider = PreviewProvider;

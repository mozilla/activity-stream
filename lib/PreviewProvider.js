/* globals Task, require, exports */
"use strict";

const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
const self = require("sdk/self");
const {TippyTopProvider} = require("lib/TippyTopProvider");
const {getColor} = require("lib/ColorAnalyzerProvider");

const EMBEDLY_PREF = "embedly.endpoint";
const EMBEDLY_VERSION_QUERY = "?addon_version=";
const ENABLED_PREF = "previews.enabled";
const ALLOWED_PREFS = new Set([EMBEDLY_PREF, ENABLED_PREF]);

const ALLOWED_QUERY_PARAMS = new Set(["id", "p", "q", "query", "s", "search", "sitesearch", "v"]);
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const DISALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const URL_FILTERS = [
  item => !!item.url,
  item => !!(new URL(item.url)),
  item => ALLOWED_PROTOCOLS.has(new URL(item.url).protocol),
  item => !DISALLOWED_HOSTS.has(new URL(item.url).hostname)
];

Cu.importGlobalProperties(["fetch"]);
Cu.importGlobalProperties(["URL"]);
Cu.import("resource://gre/modules/Task.jsm");

const DEFAULT_OPTIONS = {
  metadataTTL: 3 * 24 * 60 * 60 * 1000, // 3 days for the metadata to live
  proxyMaxLinks: 25, // number of links embedly proxy accepts per request
  initFresh: false,
};

function PreviewProvider(tabTracker, metadataStore, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._onPrefChange = this._onPrefChange.bind(this);
  this._tippyTopProvider = new TippyTopProvider();
  this._tabTracker = tabTracker;
  this._metadataStore = metadataStore;
  this.init();
}

PreviewProvider.prototype = {

  _onPrefChange(prefName) {
    if (ALLOWED_PREFS.has(prefName)) {
      switch (prefName) {
        case EMBEDLY_PREF:
          this._embedlyEndpoint = simplePrefs.prefs[EMBEDLY_PREF];
          break;
        case ENABLED_PREF:
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
    * Sanitize the URL to remove any unwanted or sensitive information about the link
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
      if (!dedupedLinks.has(link.cache_key)) {
        dedupedLinks.set(link.cache_key, link);
      }
    });
    return Array.from(dedupedLinks.values());
  },

  /**
    * Process the raw links that come in,
    * adds a sanitizeURL and cacheKey
    */
  _processLinks(links) {
    return links
      .filter(this._URLFilter(URL_FILTERS))
      .map(link => {
        const sanitizedURL = this._sanitizeURL(link.url);
        const cacheKey = this._createCacheKey(sanitizedURL);
        return Object.assign({}, link, {sanitized_url: sanitizedURL, cache_key: cacheKey, places_url: link.url});
      });
  },

  /**
    * Get the main colors from the favicon
    */
  _getFaviconColors(links) {
    return Promise.all(
      links.map(link => {
        return new Promise(resolve => {
          if (!link.favicon) {
            return resolve(link);
          }
          getColor(link.favicon)
            .then(color => {
              resolve(Object.assign({}, link, {favicon_color: color}));
            }, () => resolve(link));
        });
      })
    );
  },

  /**
    * Collects all the metadata about the set of links that are requested
    */
  getLinkMetadata(links, event = {}, skipPreviewRequest = false, previewsOnly = false) {
    let processedLinks = this._processLinks(links);
    if (!skipPreviewRequest) {
      this._asyncSaveLinks(processedLinks, event);
    }

    return this._asyncGetEnhancedLinks(processedLinks, previewsOnly, event).then(cachedLinks => {
      return this._getFaviconColors(cachedLinks);
    });
  },

  /**
    * Returns links with previews if available. Optionally return those with previews only
    * Also, collect some metrics on how many links were returned by PlacesProvider vs how
    * how many were returned by the cache
    */
  _asyncGetEnhancedLinks: Task.async(function*(processedLinks, previewsOnly, event) {
    this._tabTracker.handlePerformanceEvent(event, "previewCacheRequest", processedLinks.length);
    if (!this.enabled) {
      return processedLinks;
    }
    // Collect all items in the DB that we requested and create a mapping between that
    // object's metadata and it's cache key
    let dbLinks = yield this._asyncFindItemsInDB(processedLinks);
    let existingLinks = new Map();
    dbLinks.forEach(item => existingLinks.set(item.cache_key, item));
    let results = processedLinks.map(link => {
      if (!link) {
        return link;
      }

      // Add tippy top data, if available
      link = this._tippyTopProvider.processSite(link);

      // Find the item in the map and return it if it exists
      if (existingLinks.has(link.cache_key)) {
        return Object.assign({}, existingLinks.get(link.cache_key), link);
      } else {
        return previewsOnly ? null : link;
      }
    }).filter(link => link);

    this._tabTracker.handlePerformanceEvent(event, "previewCacheHits", results.length);
    this._tabTracker.handlePerformanceEvent(event, "previewCacheMisses", processedLinks.length - results.length);
    return results;
  }),

  /**
   * Find the metadata for each link in the database
   */
  _asyncFindItemsInDB: Task.async(function*(links) {
    const cacheKeyArray = links.map(link => link.cache_key);
    let linksMetadata = yield this._metadataStore.asyncGetMetadataByCacheKey(cacheKeyArray);
    return linksMetadata;
  }),

  /**
   * Request links from embedly, optionally filtering out known links
   */
  _asyncSaveLinks: Task.async(function*(processedLinks, event) {
    let dbLinks = yield this._asyncFindItemsInDB(processedLinks);
    let existingLinks = new Set();
    dbLinks.forEach(item => existingLinks.add(item.cache_key));
    let linksList = this._uniqueLinks(processedLinks)
      // If a request is in progress, don't re-request it
      .filter(link => !this._alreadyRequested.has(link.cache_key))
      // If we already have the link in the database don't request it again
      .filter(link => !existingLinks.has(link.cache_key));

    linksList.forEach(link => this._alreadyRequested.add(link.cache_key));

    let requestQueue = [];
    let promises = [];
    while (linksList.length !== 0) {
      // we have some new links we need to fetch the embedly data for, put them on the queue
      requestQueue.push(linksList.splice(0, this.options.proxyMaxLinks));
    }
    // for each bundle of 25 links, create a new request to embedly
    requestQueue.forEach(requestBundle => {
      promises.push(this._asyncFetchAndStore(requestBundle, event));
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
   * Extracts data from embedly and saves in the MetadataStore
   * Also, collect metrics on how many requests were made, how much time each
   * request took to complete, and their success or failure status
   */
  _asyncFetchAndStore: Task.async(function*(newLinks, event) {
    if (!this.enabled) {
      return;
    }
    // extract only the sanitized link urls to send to embedly
    let linkURLs = newLinks.map(link => link.sanitized_url);
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
        let linksToInsert = newLinks.filter(link => responseJson.urls[link.sanitized_url])
          .map(link => Object.assign({}, link, responseJson.urls[link.sanitized_url], {expired_at: (this.options.metadataTTL) + Date.now()}));
        this._metadataStore.asyncInsert(linksToInsert);
      } else {
        this._tabTracker.handlePerformanceEvent(event, "embedlyProxyFailure", 1);
      }
    } catch (err) {
      Cu.reportError(err);
      throw err;
    }
    // regardess of if the link has been cached or if the request has failed, we
    // must still remove the in-flight links from the list
    newLinks.forEach(link => this._alreadyRequested.delete(link.cache_key));
  }),

  /**
   * Initialize Preview Provider
   */
  init() {
    this._alreadyRequested = new Set();
    this._embedlyEndpoint = simplePrefs.prefs[EMBEDLY_PREF] + EMBEDLY_VERSION_QUERY + self.version;
    this.enabled = simplePrefs.prefs[ENABLED_PREF];
    simplePrefs.on("", this._onPrefChange);
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

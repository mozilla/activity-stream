/* globals Task, require, exports */
"use strict";

const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
const self = require("sdk/self");
const {TippyTopProvider} = require("addon/TippyTopProvider");
const {getColor} = require("addon/ColorAnalyzerProvider");
const {absPerf} = require("common/AbsPerf");
const {consolidateBackgroundColors, consolidateFavicons} = require("addon/lib/utils");

const {BACKGROUND_FADE} = require("../common/constants");
const ENABLED_PREF = "previews.enabled";
const METADATA_SOURCE_PREF = "metadataSource";
const EMBEDLY_SOURCE_NAME = "Embedly";
const METADATA_SERVICE_SOURCE_NAME = "MetadataService";
const VERSION_SUFFIX = `?addon_version=${self.version}`;
const ALLOWED_PREFS = new Set([ENABLED_PREF]);

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
  initFresh: false
};

function PreviewProvider(tabTracker, metadataStore, experimentProvider, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._onPrefChange = this._onPrefChange.bind(this);
  this._tippyTopProvider = new TippyTopProvider();
  this._tabTracker = tabTracker;
  this._metadataStore = metadataStore;
  this._experimentProvider = experimentProvider;
  this.init();
}

PreviewProvider.prototype = {

  _onPrefChange(prefName) {
    if (ALLOWED_PREFS.has(prefName)) {
      switch (prefName) {
        case ENABLED_PREF:
          this.enabled = simplePrefs.prefs[ENABLED_PREF];
          break;
      }
    }
  },

  /**
    * Gets the current metadata source name based on the
    * pref or the experiment, and falls back to Embedly if it doesn't exist
    */
  _getMetadataSourceName() {
    let source = simplePrefs.prefs[METADATA_SOURCE_PREF];
    if (!this._metadataEndpoints.has(source)) {
      // set it to a default if the current endpoint was poorly set by the user
      // defensive programming ftw
      source = EMBEDLY_SOURCE_NAME;
    }
    return source;
  },

  /**
    * Builds the current endpoint based on a source
    */
  _getMetadataEndpoint() {
    return (this._metadataEndpoints.get(this._getMetadataSourceName()) + VERSION_SUFFIX);
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
        .map(param => `${param}=${queryParams.get(param)}`)
        .join("&");
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
  _createCacheKey(spec) {
    let url = new URL(spec);
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
  _getFaviconColors(link) {
    return new Promise(resolve => {
      if (!link.favicon) {
        resolve(null);
        return null;
      }
      return getColor(link.favicon, link.url)
        .then(color => {
          if (!color) {
            resolve(null);
          } else {
            resolve([...color, BACKGROUND_FADE]);
          }
        })
        .catch(err => {
          Cu.reportError(err);
          resolve(null);
        });
    });
  },

  /**
    * Returns links with previews if available. Optionally return those with previews only
    * Also, collect some metrics on how many links were returned by PlacesProvider vs how
    * how many were returned by the cache
    */
  asyncGetEnhancedLinks: Task.async(function*(links, event) {
    this._tabTracker.handlePerformanceEvent(event, "previewCacheRequest", links.length);
    if (!this.enabled) {
      return links;
    }
    let processedLinks = this._processLinks(links);

    // Collect all items in the DB that we requested and create a mapping between that
    // object's metadata and it's cache key
    let dbLinks = yield this._asyncFindItemsInDB(processedLinks);
    let existingLinks = new Map();
    dbLinks.forEach(item => existingLinks.set(item.cache_key, item));
    let results = [];
    for (let link of processedLinks) {
      if (!link) {
        break;
      }
      // copy over fields we need from the original site object
      let enhancedLink = {};
      enhancedLink.title = link.title;
      enhancedLink.type = link.type;
      enhancedLink.url = link.url;
      enhancedLink.eTLD = link.eTLD;
      enhancedLink.cache_key = link.cache_key;
      enhancedLink.lastVisitDate = link.lastVisitDate;
      enhancedLink.bookmarkDateCreated = link.bookmarkDateCreated;
      enhancedLink.bookmarkGuid = link.bookmarkGuid;

      // get favicon and background color from firefox
      const firefoxBackgroundColor = yield this._getFaviconColors(link);
      const firefoxFavicon = link.favicon;

      // get favicon and background color from tippytop
      const {favicon_url: tippyTopFavicon, background_color: tippyTopBackgroundColor, metadata_source} = this._tippyTopProvider.processSite(link);
      enhancedLink.metadata_source = metadata_source;

      // Find the item in the map and return it if it exists, then unpack that
      // object onto our new link
      let metadataLinkFavicons = null;
      if (existingLinks.has(link.cache_key)) {
        const cachedMetadataLink = existingLinks.get(link.cache_key);
        metadataLinkFavicons = cachedMetadataLink.favicons;
        enhancedLink.metadata_source = cachedMetadataLink.metadata_source;
        enhancedLink.title = cachedMetadataLink.title;
        enhancedLink.description = cachedMetadataLink.description;
        enhancedLink.provider_name = cachedMetadataLink.provider_name;
        enhancedLink.images = cachedMetadataLink.images;
      }

      // consolidate favicons, background color and metadata source, then return the final link
      enhancedLink.favicon_url = consolidateFavicons(tippyTopFavicon, metadataLinkFavicons, firefoxFavicon);
      enhancedLink.background_color = consolidateBackgroundColors(tippyTopBackgroundColor, metadataLinkFavicons, firefoxBackgroundColor);
      results.push(enhancedLink);
    }

    this._tabTracker.handlePerformanceEvent(event, "previewCacheHits", existingLinks.size);
    this._tabTracker.handlePerformanceEvent(event, "previewCacheMisses", processedLinks.length - existingLinks.size);
    return results;
  }),

  /**
   * Find the metadata for each link in the database
   */
  _asyncFindItemsInDB: Task.async(function*(links) {
    let cacheKeys = [];

    // Create the cache keys
    links.forEach(link => {
      const key = link.cache_key;
      cacheKeys.push(key);
    });

    // Hit the database for the missing keys
    let linksMetadata;
    try {
      linksMetadata = yield this._metadataStore.asyncGetMetadataByCacheKey(cacheKeys);
    } catch (e) {
      Cu.reportError(`Failed to fetch metadata: ${e.message}`);
      return [];
    }
    return linksMetadata;
  }),

  /**
   * Request links from embedly, optionally filtering out known links
   */
  asyncSaveLinks: Task.async(function*(links, event) {
    let processedLinks = this._processLinks(links);
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
    yield Promise.all(promises).catch(err => Cu.reportError(err));
  }),

  /**
   * Makes the necessary requests to embedly to get data for each link
   */
  _asyncGetLinkData: Task.async(function*(newLinks) {
    try {
      let response = yield fetch(this._getMetadataEndpoint(), {
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
      const startNetworkCall = absPerf.now();
      let response = yield this._asyncGetLinkData(linkURLs);
      const endNetworkCall = absPerf.now();
      this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestTime", endNetworkCall - startNetworkCall);

      if (response.ok) {
        let responseJson = yield response.json();
        this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestReceivedCount", Object.keys(responseJson.urls).length);
        this._tabTracker.handlePerformanceEvent(event, "embedlyProxyRequestSucess", 1);
        let linksToInsert = newLinks.filter(link => responseJson.urls[link.sanitized_url])
          .map(link => Object.assign({}, link, responseJson.urls[link.sanitized_url]));

        this.insertMetadata(linksToInsert, this._getMetadataSourceName());
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
   * Do some post-processing on the links before inserting them into the metadata
   * DB and adding them to the metadata cache
   */
  insertMetadata(links, metadataSource) {
    const linksToInsert = links.map(link => Object.assign({}, link, {
      expired_at: (this.options.metadataTTL) + Date.now(),
      metadata_source: metadataSource
    }));
    this._metadataStore.asyncInsert(linksToInsert, true).catch(err => {
      // TODO: add more exception handling code, e.g. sending exception report
      Cu.reportError(err);
    });
  },

  /**
   * Do some pre-processing on the link before inserting it into the metadata
   * DB and adding them to the metadata cache
   */
  processAndInsertMetadata(link, metadataSource) {
    const processedLink = this._processLinks([link]);
    this.insertMetadata(processedLink, metadataSource);
  },

  /**
   * Check if a single link exists in the metadata DB
   */
  asyncLinkExist: Task.async(function*(url) {
    let key = this._createCacheKey(url);
    if (!key) {
      return false;
    }

    const linkExists = yield this._metadataStore.asyncCacheKeyExists(key);
    return linkExists;
  }),

  /**
   * Initialize Preview Provider
   */
  init() {
    this._alreadyRequested = new Set();
    this._metadataEndpoints = new Map();
    this._metadataEndpoints.set(METADATA_SERVICE_SOURCE_NAME, simplePrefs.prefs["metadata.endpoint"]);
    this._metadataEndpoints.set(EMBEDLY_SOURCE_NAME, simplePrefs.prefs["embedly.endpoint"]);
    this.enabled = simplePrefs.prefs[ENABLED_PREF];
    simplePrefs.on("", this._onPrefChange);

    // if we are in the experiment change the metadata source
    if (this._experimentProvider.data.metadataService) {
      simplePrefs.prefs[METADATA_SOURCE_PREF] = METADATA_SERVICE_SOURCE_NAME;
    }
  },

  /**
   * Uninit the preview provider
   */
  uninit() {
    simplePrefs.off("", this._onPrefChange);
    this._alreadyRequested = new Set();
    this._metadataEndpoints = new Map();
  }
};

exports.PreviewProvider = PreviewProvider;

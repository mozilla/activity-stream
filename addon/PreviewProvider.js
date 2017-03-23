/* globals Task, Services, require, exports */
"use strict";

const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
const self = require("sdk/self");
const {TippyTopProvider} = require("addon/TippyTopProvider");
const {getColor} = require("addon/ColorAnalyzerProvider");
const {absPerf} = require("common/AbsPerf");
const {consolidateBackgroundColors, consolidateFavicons, extractMetadataFaviconFields} = require("addon/lib/utils");

const {BACKGROUND_FADE} = require("../common/constants");
const ENABLED_PREF = "previews.enabled";
const ENDPOINT = "metadata.endpoint";
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
Cu.import("resource://gre/modules/Services.jsm");

const DEFAULT_OPTIONS = {
  metadataTTL: 30 * 24 * 60 * 60 * 1000, // 30 days for the metadata to live
  proxyMaxLinks: 25, // number of links proxy accepts per request
  initFresh: false
};

function PreviewProvider(tabTracker, metadataStore, store, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._onPrefChange = this._onPrefChange.bind(this);
  this._tippyTopProvider = new TippyTopProvider();
  this._tabTracker = tabTracker;
  this._metadataStore = metadataStore;
  this._store = store;
  this.init();
}

function createCacheKey(spec) {
  let url = new URL(spec);
  let key = url.host.replace(/www\.?/, "");
  key = key + url.pathname + (url.search || "");
  return key.toString();
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
      return null;
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
    return newURL;
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
        const sanitizedURLObject = this._sanitizeURL(link.url);
        const sanitizedURL = sanitizedURLObject ? sanitizedURLObject.toString() : "";
        const cacheKey = createCacheKey(sanitizedURL);
        const hostname = sanitizedURLObject && sanitizedURLObject.hostname;
        return Object.assign({}, link, {
          sanitized_url: sanitizedURL,
          cache_key: cacheKey,
          hostname,
          places_url: link.url
        });
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
      enhancedLink.hostname = link.hostname;
      enhancedLink.eTLD = link.eTLD;
      enhancedLink.cache_key = link.cache_key;
      enhancedLink.lastVisitDate = link.lastVisitDate;
      enhancedLink.bookmarkDateCreated = link.bookmarkDateCreated;
      enhancedLink.bookmarkGuid = link.bookmarkGuid;

      // get favicon and background color from firefox
      const firefoxBackgroundColor = yield this._getFaviconColors(link);
      const firefoxFaviconURL = link.favicon;

      // get favicon and background color from tippytop
      const {
        favicon_height: tippyTopFaviconHeight,
        favicon_width: tippyTopFaviconWidth,
        favicon_url: tippyTopFaviconURL,
        background_color: tippyTopBackgroundColor,
        metadata_source
      } = this._tippyTopProvider.processSite(link);
      enhancedLink.metadata_source = metadata_source;

      // Find the item in the map and return it if it exists, then unpack that
      // object onto our new link
      let metadataLinkFaviconURL = null;
      let metadataLinkFaviconColor = null;
      let metadataLinkFaviconHeight = null;
      let metadataLinkFaviconWidth = null;
      if (existingLinks.has(link.cache_key)) {
        const cachedMetadataLink = existingLinks.get(link.cache_key);
        const {url, color, height, width} = extractMetadataFaviconFields(cachedMetadataLink);
        metadataLinkFaviconURL = url;
        metadataLinkFaviconColor = color;
        metadataLinkFaviconHeight = height;
        metadataLinkFaviconWidth = width;
        enhancedLink.hasMetadata = true;
        enhancedLink.metadata_source = cachedMetadataLink.metadata_source;
        enhancedLink.title = cachedMetadataLink.title;
        enhancedLink.description = cachedMetadataLink.description;
        enhancedLink.provider_name = cachedMetadataLink.provider_name;
        enhancedLink.images = cachedMetadataLink.images;
      }

      // consolidate favicons, background color and metadata source, then return the final link
      enhancedLink.favicon_url = consolidateFavicons(tippyTopFaviconURL, metadataLinkFaviconURL, firefoxFaviconURL);
      enhancedLink.favicon_width = tippyTopFaviconWidth || metadataLinkFaviconWidth;
      enhancedLink.favicon_height = tippyTopFaviconHeight || metadataLinkFaviconHeight;
      enhancedLink.background_color = consolidateBackgroundColors(tippyTopBackgroundColor, metadataLinkFaviconColor, firefoxBackgroundColor);
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
   * Request links from metadata service, optionally filtering out known links
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
      // we have some new links we need to fetch the metadata for, put them on the queue
      requestQueue.push(linksList.splice(0, this.options.proxyMaxLinks));
    }
    // for each bundle of 25 links, create a new request to metadata service
    requestQueue.forEach(requestBundle => {
      promises.push(this._asyncFetchAndStore(requestBundle, event));
    });
    yield Promise.all(promises).catch(err => Cu.reportError(err));
  }),

  /**
   * Makes the necessary requests to metadata service to get data for each link
   */
  _asyncGetLinkData: Task.async(function*(newLinks) {
    try {
      let response = yield fetch(this._metadataEndpoint, {
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
   * Extracts data from metadata service and saves in the MetadataStore
   * Also, collect metrics on how many requests were made, how much time each
   * request took to complete, and their success or failure status
   */
  _asyncFetchAndStore: Task.async(function*(newLinks, event) {
    if (!this.enabled) {
      return;
    }
    // extract only the sanitized link urls to send to metadata service
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

        // add favicon_height and favicon_width to the favicon and store it in db
        yield this._asyncAddFaviconHeightAndWidth(linksToInsert);
        this.insertMetadata(linksToInsert, "MetadataService");
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
    return this._metadataStore.asyncInsert(linksToInsert, true).then(() => {
      this._store.dispatch({type: "METADATA_UPDATED"});
    }).catch(err => {
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
    return this.insertMetadata(processedLink, metadataSource);
  },

  /**
   * Computes and sets the favicon dimensions
   */
  _asyncAddFaviconHeightAndWidth: Task.async(function*(links) {
    for (let link of links) {
      try {
        const {width, height} = yield this._computeImageSize(link.favicon_url);
        if (height && width) {
          link.favicon_width = width;
          link.favicon_height = height;
        }
      } catch (err) {}  // eslint-disable-line no-empty
    }
  }),

  /**
   * Locally compute the size of the image
   */
  _computeImageSize(url) {
    return new Promise((resolve, reject) => {
      let image = new Services.appShell.hiddenDOMWindow.Image();
      image.src = url;
      image.addEventListener("load", () => {
        let imageWithSize = {
          url: image.src,
          width: image.width,
          height: image.height
        };
        resolve(imageWithSize);
      });
      image.addEventListener("error", () => reject(`Error loading image: ${url}`));
    });
  },

  /**
   * Check if a single link exists in the metadata DB
   */
  asyncLinkExist: Task.async(function*(url) {
    let key = createCacheKey(url);
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
    const endpoint = simplePrefs.prefs[ENDPOINT];
    this._metadataEndpoint = `${endpoint}${VERSION_SUFFIX}`;
    this.enabled = simplePrefs.prefs[ENABLED_PREF];
    simplePrefs.on("", this._onPrefChange);
  },

  /**
   * Uninit the preview provider
   */
  uninit() {
    simplePrefs.off("", this._onPrefChange);
    this._alreadyRequested = new Set();
    this._metadataEndpoint = null;
  }
};

exports.PreviewProvider = PreviewProvider;

"use strict";

const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
const {TippyTopProvider} = require("addon/TippyTopProvider");
const {getColor} = require("addon/ColorAnalyzerProvider");
const {consolidateBackgroundColors, consolidateFavicons, extractMetadataFaviconFields} = require("addon/lib/utils");

const {BACKGROUND_FADE, MIN_HIGHRES_ICON_SIZE} = require("../common/constants");
const ENABLED_PREF = "previews.enabled";
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

  _getMetadataTTL() {
    return 90 * 24 * 60 * 60 * 1000; // 90 days for the metadata to live
  },

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
      let enhancedLink = {
        title: link.title,
        type: link.type,
        url: link.url,
        hostname: link.hostname,
        eTLD: link.eTLD,
        cache_key: link.cache_key,
        lastVisitDate: link.lastVisitDate,
        bookmarkDateCreated: link.bookmarkDateCreated,
        bookmarkLastModified: link.lastModified,
        bookmarkGuid: link.bookmarkGuid,
        hasMetadata: false
      };

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

      // check whether we have a high res icon
      enhancedLink.hasIcon = !!(enhancedLink.favicon_width && enhancedLink.favicon_height);
      enhancedLink.hasHighResIcon = !!(
        enhancedLink.hasMetadata &&
        enhancedLink.hasIcon &&
        (enhancedLink.favicon_width > MIN_HIGHRES_ICON_SIZE) && (enhancedLink.favicon_height > MIN_HIGHRES_ICON_SIZE));

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
   * Do some post-processing on the links before inserting them into the metadata
   * DB and adding them to the metadata cache
   */
  insertMetadata(links, metadataSource) {
    const linksToInsert = links.map(link => Object.assign({}, link, {
      expired_at: (this._getMetadataTTL()) + Date.now(),
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
    const sanitizedURLObject = this._sanitizeURL(url);
    const sanitizedURL = sanitizedURLObject ? sanitizedURLObject.toString() : "";
    const key = createCacheKey(sanitizedURL);
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
    this.enabled = simplePrefs.prefs[ENABLED_PREF];
    simplePrefs.on("", this._onPrefChange);
  },

  /**
   * Uninit the preview provider
   */
  uninit() {
    simplePrefs.off("", this._onPrefChange);
  }
};

exports.PreviewProvider = PreviewProvider;

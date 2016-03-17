/* globals Task */
"use strict";

const {Cu} = require("chrome");
const ss = require("sdk/simple-storage");
const {setTimeout, clearTimeout} = require("sdk/timers");
const EMBEDLY_ENDPOINT = require("sdk/simple-prefs").prefs.embedlyEndpoint;

const EMBEDLY_PROXY_MAX_LINKS = 25; // number of links embedly proxy accepts per request
const CLEAR_CACHE_TIMEOUT = 86400000; // 24 hours to clear cache
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
}

PreviewProvider.prototype = {
  _timeoutID: null,

  // TODO: santize, filter, and dedupe urls
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
      let result = true;
      definition.forEach((test) => {
        if (!test(item)) {
          result = false;
        }
      });
      return result;
    };
  },

  /**
    * Filter cached links out, and store their embedly data
    */
  getCachedLinks(links) {
    let cachedLinks = [];
    links.forEach(link => {
      if (link && ss.storage.embedlyData[link.url] && link.url === ss.storage.embedlyData[link.url].url) {
        cachedLinks.push(ss.storage.embedlyData[link.url]);
      }
    });
    return cachedLinks;
  },

  /**
   * Filter out new links and request them from embedly
   */
  saveNewLinks: Task.async(function*(links) {
    let newLinks = links.filter(link => link && !ss.storage.embedlyData[link.url]);
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
   * Makes the necessary requests to embedly to get data and store it in the cache
   */
  _fetchAndCache: Task.async(function*(newLinks) {
    let json = null;
    // extract only the link urls to send to embedly
    let linkURLs = newLinks.map(link => link.url);
    let sites = newLinks.filter(this._URLFilter(URL_FILTERS));
    try {
      let response = yield fetch(EMBEDLY_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({urls: linkURLs}),
        headers: {"Content-Type": "application/json"}
      });
      if (response.ok) {
        json = yield response.json();
        const data = sites
            .map(site => {
              const details = json.urls[site.url];
              if (!details) {
                return site;
              }
              return Object.assign({}, details, site);
            });
        // store embedly data in cache
        data.map(link => {
          ss.storage.embedlyData[link.url] = link;
          ss.storage.embedlyData[link.url].accessTime = Date.now();
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

const gPreview = new PreviewProvider();

exports.PreviewProvider = {
  preview: gPreview,
};

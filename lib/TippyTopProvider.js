/* globals require, JSON */
"use strict";

const data = require("sdk/self").data;
const URL = require("sdk/url").URL;

const DEFAULT_OPTIONS = {sites: null};

function TippyTopProvider(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this.init();
}

TippyTopProvider.prototype = {
  /**
   * Initialize the sites object
   */
  init() {
    // If the sites were passed into the constructor (for testability), use those.
    // Else, read them from top_sites.json.
    let sites;
    if (this.options.sites) {
      sites = this.options.sites;
    } else {
      sites = JSON.parse(data.load("content/favicons/top_sites.json"));
    }

    this._sitesByDomain = {};
    sites.forEach(site => {
      this._sitesByDomain[this._getKey(site.url)] = site;
    });
  },

  /**
    * Process the site, adding tippy top favicon and background color if URL is known.
    */
  processSite(site) {
    let enhancedSite = Object.assign({}, site);
    let key;
    try {
      key = this._getKey(site.url);
    } catch (e) {
      key = null;
    }
    if (key && key in this._sitesByDomain) {
      let tippyTopSite = this._sitesByDomain[key];
      enhancedSite.favicon_url = data.url("content/favicons/images/" + tippyTopSite.image_url);
      enhancedSite.background_color = tippyTopSite.background_color;
    }
    return enhancedSite;
  },

  /**
    * Create a key using the domain (minus the www.).
    */
  _getKey(url) {
    let domain = URL(url).host;
    if (domain && domain.startsWith("www.")) {
      domain = domain.slice(4);
    }
    return domain;
  }
};

exports.TippyTopProvider = TippyTopProvider;

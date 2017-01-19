/* globals require, JSON */
"use strict";

const data = require("sdk/self").data;
const getSiteData = require("common/vendor")("tippy-top-sites").getSiteData;

const DEFAULT_OPTIONS = {sites: null};
const FAVICON_DIMENSIONS = {width: 64, height: 64};

function TippyTopProvider(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this.init();
}

TippyTopProvider.prototype = {
  /**
   * Initialize provider.
   */
  init() {
    // If a getSiteData function is passed into the constructor (for testability), use it.
    // Else, use the one provided by tippy-top-sites.
    this._getTippyTopData = this.options.getSiteData || getSiteData;
  },

  /**
    * Process the site, adding tippy top favicon and background color if URL is known.
    */
  processSite(site) {
    let enhancedSite = Object.assign({}, site);
    let tippyTopSite = this._getTippyTopData(site.url);
    let usedTippyTopData = false;
    if ("image_url" in tippyTopSite) {
      enhancedSite.favicon_url = data.url(`content/favicons/images/${tippyTopSite.image_url}`);
      enhancedSite.favicon_height = FAVICON_DIMENSIONS.height;
      enhancedSite.favicon_width = FAVICON_DIMENSIONS.width;
      usedTippyTopData = true;
    }
    if ("background_color" in tippyTopSite) {
      enhancedSite.background_color = tippyTopSite.background_color;
      usedTippyTopData = true;
    }
    if (!enhancedSite.metadata_source && usedTippyTopData) {
      enhancedSite.metadata_source = "TippyTopProvider";
    }
    return enhancedSite;
  }
};

exports.TippyTopProvider = TippyTopProvider;

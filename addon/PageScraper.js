/* globals Services, Task */
"use strict";

const {MetadataParser} = require("addon/MetadataParser");
const {Cu} = require("chrome");
const options = require("@loader/options");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.importGlobalProperties(["URL"]);

const DEFAULT_OPTIONS = {
  framescriptPath: new URL("data/page-scraper-content-script.js", options.prefixURI),
  blacklist: ["about:", "localhost:", "resource://"]
};

function PageScraper(previewProvider, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._previewProvider = previewProvider;
  this._metadataParser = new MetadataParser();
}

/**
 * Receives raw HTML from a page and sends it to a service to be parsed and the
 * metadata extracted, and then stores that in the metadata DB. It takes an instance
 * of PreviewProvider, since all the link processing takes places in PreviewProvider
 */

PageScraper.prototype = {
  /**
   * Check if the link is already in the metadata database. If not, parse the
   * HTML and insert it in the metadata database
   */
  _asyncParseAndSave: Task.async(function*(rawHTML, url) {
    let link = yield this._previewProvider.asyncLinkExist(url);
    if (!link) {
      let metadata;
      try {
        metadata = yield this._metadataParser.parseHTMLText(rawHTML, url);
      } catch (e) {
        Cu.reportError(`MetadataParser failed to parse ${url}`);
      }
      if (this._shouldSaveMetadata(metadata)) {
        this._insertMetadata(metadata);
      }
    }
  }),

  /**
   * Insert the metadata in the metadata database, along with it's source.
   */
  _insertMetadata(metadata) {
    this._previewProvider.processAndInsertMetadata(metadata, "Local");
  },

  /**
   * If metadata has neither a title, nor a favicon_url we do not want to insert
   * it into the metadata DB
   */
  _shouldSaveMetadata(metadata) {
    return (metadata && !!metadata.title && !!metadata.favicon_url);
  },

  /**
   * Ensure that the page doesn't belong to a blacklist by checking that the
   * url is not a substring of a restricted set of knows urls that should not
   * collect metadata
   */
  _blacklistFilter(url) {
    return (this.options.blacklist.every(item => url.indexOf(item) === -1));
  },

  /**
   * Initialize the Page Scraper
   */
  init() {
    Services.mm.loadFrameScript(this.options.framescriptPath, true);
    Services.mm.addMessageListener("page-scraper-message", message => {
      let {text, url} = message.data.data;
      if (message.data.type === "PAGE_HTML" && this._blacklistFilter(url)) {
        this._asyncParseAndSave(text, url);
      }
    });
  },

  /**
   * Uninitialize the Page Scraper
   */
  uninit() {
    Services.mm.removeMessageListener("page-scraper-message", this);
    Services.mm.removeDelayedFrameScript(this.options.framescriptPath);
  }
};

exports.PageScraper = PageScraper;

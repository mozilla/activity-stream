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
  metadataTTL: 3 * 24 * 60 * 60 * 1000, // 3 days for the metadata to live
  framescriptPath: new URL("data/page-scraper-content-script.js", options.prefixURI),
  blackList: ["about:", "localhost", "resource://"]
};

function PageScraper(previewProvider, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._previewProvider = previewProvider;
  this._metadataParser = new MetadataParser();
}

PageScraper.prototype = {
  /**
   * Check if the link is already in the metadata database. If not, parse the
   *  HTML and insert it in the metadata database
   */
  _asyncParseAndSave: Task.async(function*(raw, url) {
    let link = yield this._previewProvider.asyncDoesSingleLinkExist(url);
    if (!link) {
      let metadata = yield this._metadataParser.parseHTMLText(raw, url);
      this._insertMetadata(metadata);
    }
  }),

  /**
   * Insert the metadata in the metadata database, along with it's source.
   * Also add it to the metadata cache
   */
  _insertMetadata(metadata) {
    if (Object.keys(metadata).length) {
      this._previewProvider.processAndInsertMetadata([metadata], "Local");
    }
  },

  /**
   * Ensure that the page doesn't belong to a black list
   */
  _blackListFiter(url) {
    return (this.options.blackList.every(item => url.indexOf(item) === -1));
  },

  /**
   * Initialize the Page Scraper
   */
  init() {
    Services.mm.loadFrameScript(this.options.framescriptPath, true);
    Services.mm.addMessageListener("page-scraper-message", message => {
      let {text, url} = message.data.data;
      if (message.data.type === "PAGE_HTML" && this._blackListFiter(url)) {
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

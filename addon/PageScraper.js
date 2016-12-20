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

function PageScraper(previewProvider, tabTracker, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  this._previewProvider = previewProvider;
  this._tabTracker = tabTracker;
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
  _asyncParseAndSave: Task.async(function*(rawHTML, url, event) {
    let startTime = Date.now();
    this._tabTracker.handlePerformanceEvent(event, "metadataReceivedRawHTML", startTime);

    let link = yield this._previewProvider.asyncLinkExist(url);
    if (!link) {
      const metadata = this._metadataParser.parseHTMLText(rawHTML, url);
      if (this._shouldSaveMetadata(metadata)) {
        try {
          metadata.images = yield this._computeImageSize(metadata);
        } catch (e) {
          Cu.reportError(`PageScraper failed to compute image size for ${url}`);
        }
        this._insertMetadata(metadata);
        this._tabTracker.handlePerformanceEvent(event, "metadataParseSuccess", Date.now() - startTime);
      } else {
        this._tabTracker.handlePerformanceEvent(event, "metadataInvalidReceived", Date.now() - startTime);
      }
    } else {
      this._tabTracker.handlePerformanceEvent(event, "metadataExists", Date.now() - startTime);
    }
  }),

  /**
   * Locally compute the size of the preview image
   */
  _computeImageSize(metadata) {
    return new Promise(resolve => {
      if (metadata.images.length) {
        const metadataImage = metadata.images[0];
        let image = new Services.appShell.hiddenDOMWindow.Image();
        image.src = metadataImage.url;
        image.addEventListener("load", () => {
          let imageWithSize = {
            url: image.src,
            width: image.width || 500,
            height: image.height || 500
          };
          resolve([imageWithSize]);
        });
      } else {
        resolve([]);
      }
    });
  },

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
        const event = this._tabTracker.generateEvent({source: "PAGE_SCRAPER"});
        this._asyncParseAndSave(text, url, event).catch(err => {
          Cu.reportError(`MetadataParser failed to parse ${url}. ${err}`);
          this._tabTracker.handlePerformanceEvent(event, "metadataParseFail", Date.now());
        });
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

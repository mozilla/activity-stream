/* globals Services, Task */
"use strict";

const {MetadataParser} = require("addon/MetadataParser");
const {Cu} = require("chrome");
const options = require("@loader/options");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.importGlobalProperties(["URL"]);
Cu.importGlobalProperties(["fetch"]);

const DEFAULT_OPTIONS = {
  framescriptPath: new URL("data/page-scraper-content-script.js", options.prefixURI),
  blacklist: ["about:", "localhost:", "resource://"]
};
const PERFORMANCE_EVENT_NAMES = {
  metadata_raw_html: "metadataReceivedRawHTML",
  metadata_exists: "metadataExists",
  metadata_invalid: "metadataInvalidReceived",
  metadata_sucess: "metadataParseSuccess",
  metadata_fail: "metadataParseFail"
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
   * Parse the HTML and attempt to insert it in the metadata database
   */
  _asyncParseAndSave(rawHTML, url, event) {
    this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_raw_html, Date.now());
    const metadata = this._metadataParser.parseHTMLText(rawHTML, url);
    this._asyncSaveMetadata(metadata, event);
  },

  /**
   * Save the metadata in the MetadataStore DB
   */
  _asyncSaveMetadata: Task.async(function*(metadata, event) {
    const startTime = Date.now();
    let linkExists = yield this._previewProvider.asyncLinkExist(metadata.url);
    if (linkExists) {
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_exists, Date.now());
      return;
    }
    if (!this._shouldSaveMetadata(metadata)) {
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_invalid, Date.now() - startTime);
      return;
    }
    try {
      metadata.images = yield this._computeImageSize(metadata);
    } catch (e) {
      Cu.reportError(`PageScraper failed to compute image size for ${metadata.url}`);
    }
    this._insertMetadata(metadata);
    this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_sucess, Date.now() - startTime);
  }),

  /**
   * Make a network request for links that the MetadataFeed has requested metadata for.
   * Attempt to parse the html from that page and insert into the DB
   */
  asyncFetchLinks: Task.async(function*(links, event) {
    for (let link of links) {
      let linkExists = yield this._previewProvider.asyncLinkExist(link.url);
      if (linkExists) {
        this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_exists, Date.now());
        return;
      }
      const rawHTML = yield this._fetchContent(link.url);
      this._asyncParseAndSave(rawHTML, link.url, event);
    }
  }),

  /**
   * Wrapper for requesting the URL and returning it's DOM
   */
  _fetchContent: Task.async(function*(url) {
    let response = yield fetch(url);
    let rawHTML = yield response.text();
    return rawHTML;
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
   * Message handler for the incoming framescript messages
   */
  _messageHandler(message) {
    let {text, url} = message.data.data;
    if (message.data.type === "PAGE_HTML" && this._blacklistFilter(url)) {
      const event = this._tabTracker.generateEvent({source: "PAGE_SCRAPER"});
      try {
        this._asyncParseAndSave(text, url);
      } catch (err) {
        Cu.reportError(`MetadataParser failed to parse ${url}. ${err}`);
        this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_fail, Date.now());
      }
    }
  },

  /**
   * Initialize the Page Scraper
   */
  init() {
    Services.mm.loadFrameScript(this.options.framescriptPath, true);
    Services.mm.addMessageListener("page-scraper-message", this._messageHandler.bind(this));
  },

  /**
   * Uninitialize the Page Scraper
   */
  uninit() {
    Services.mm.removeMessageListener("page-scraper-message", this._messageHandler);
    Services.mm.removeDelayedFrameScript(this.options.framescriptPath);
  }
};

exports.PageScraper = PageScraper;

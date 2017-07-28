"use strict";

const {MetadataParser} = require("addon/MetadataParser");
const {Cu} = require("chrome");
const loaderOptions = require("@loader/options");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.importGlobalProperties(["URL"]);
Cu.importGlobalProperties(["fetch"]);

const DEFAULT_OPTIONS = {
  framescriptPath: new URL("data/page-scraper-content-script.js", loaderOptions.prefixURI),
  blacklist: ["about:", "localhost:", "resource://"]
};
const PERFORMANCE_EVENT_NAMES = {
  framescript_event: "framescriptMessageReceived",
  local_fetch_event: "localFetchStarted",
  metadata_raw_html: "metadataReceivedRawHTML",
  metadata_exists: "metadataExists",
  metadata_invalid: "metadataInvalidReceived",
  metadata_sucess: "metadataParseSuccess",
  metadata_fail: "metadataParseFail",
  network_fail: "networkRequestFailed",
  local_fetch_received: "localFetchReceived",
  local_fetch_saved: "localFetchSaved"
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
  _parseAndSave(rawHTML, url, event) {
    this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_raw_html, 1);
    let metadata;
    try {
      metadata = this._metadataParser.parseHTMLText(rawHTML, url);
    } catch (err) {
      Cu.reportError(`MetadataParser failed to parse ${url}. ${err}`);
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_fail, 1);
      return;
    }
    this._asyncSaveMetadata(metadata, event);
  },

  /**
   * Save the metadata in the MetadataStore DB
   */
  _asyncSaveMetadata: Task.async(function*(metadata, event) {
    const startTime = Date.now();
    const shouldSaveMetadata = yield this._shouldSaveMetadata(metadata);
    if (!shouldSaveMetadata) {
      return;
    }
    try {
      if (metadata.images && metadata.images.length) {
        let {url, height, width} = yield this._previewProvider._computeImageSize(metadata.images[0].url);
        metadata.images[0].height = height || 500;
        metadata.images[0].width = width || 500;
        metadata.images[0].url = url;
      }
      if (metadata.favicon_url) {
        let {height, width} = yield this._previewProvider._computeImageSize(metadata.favicon_url);
        if (height && width) {
          metadata.favicon_height = height;
          metadata.favicon_width = width;
        }
      }
    } catch (e) {
      Cu.reportError(`PageScraper failed to compute image size for ${metadata.url}`);
    }
    this._previewProvider.processAndInsertMetadata(metadata, "Local");
    this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_sucess, Date.now() - startTime);
  }),

  /**
   * Make a network request for links that the MetadataFeed has requested metadata for.
   * Attempt to parse the html from that page and insert into the DB
   *
   * @param {Array} links Links that need metadata.
   *        {String} eventType Source event of request.
   *        {Bool} forceFetch Flag to avoid checking if metadata exists. Used for unvisited bookmarks.
   */
  asyncFetchLinks: Task.async(function*(links, eventType, forceFetch = false) {
    let savedUrlsCount = 0;

    for (let link of links) {
      const linkEvent = this._tabTracker.generateEvent({source: eventType});
      this._tabTracker.handlePerformanceEvent(linkEvent, PERFORMANCE_EVENT_NAMES.local_fetch_event, 1);

      // When we are not certain if metadata exists.
      if (!forceFetch) {
        let linkExists = yield this._previewProvider.asyncLinkExist(link.url);
        if (linkExists) {
          this._tabTracker.handlePerformanceEvent(linkEvent, PERFORMANCE_EVENT_NAMES.metadata_exists, 1);
          continue;
        }
      }

      let rawHTML;
      try {
        rawHTML = yield this._fetchContent(link.url);
      } catch (err) {
        Cu.reportError(`PageScraper failed to get page content for ${link.url}. ${err}`);
        this._tabTracker.handlePerformanceEvent(linkEvent, PERFORMANCE_EVENT_NAMES.network_fail, 1);
        continue;
      }
      this._parseAndSave(rawHTML, link.url, linkEvent);
      savedUrlsCount++;
    }

    const fetchEvent = this._tabTracker.generateEvent({source: eventType});
    this._tabTracker.handlePerformanceEvent(fetchEvent, PERFORMANCE_EVENT_NAMES.local_fetch_received, links.length);
    this._tabTracker.handlePerformanceEvent(fetchEvent, PERFORMANCE_EVENT_NAMES.local_fetch_saved, savedUrlsCount);
  }),

  /**
   * Wrapper for requesting the URL and returning it's DOM
   */
  _fetchContent: Task.async(function*(url) {
    const response = yield fetch(url);
    const rawHTML = yield response.text();
    return rawHTML;
  }),

  /**
   * If metadata has neither a title, nor a favicon_url we do not want to insert
   * it into the metadata DB. If the link already exists we do not want to insert
   * it into the metadata DB. Capture both events
   */
  _shouldSaveMetadata: Task.async(function*(metadata, event) {
    const linkExists = yield this._previewProvider.asyncLinkExist(metadata.url);
    if (linkExists) {
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_exists, 1);
    }
    const hasMetadata = metadata && !!metadata.title && !!metadata.favicon_url;
    if (!hasMetadata) {
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.metadata_invalid, 1);
    }
    return (hasMetadata && !linkExists);
  }),

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
      this._tabTracker.handlePerformanceEvent(event, PERFORMANCE_EVENT_NAMES.framescript_event, 1);
      this._parseAndSave(text, url, event);
    }
  },

  /**
   * Initialize the Page Scraper
   */
  init() {
    this._messageHandler = this._messageHandler.bind(this);
    Services.mm.loadFrameScript(this.options.framescriptPath, true);
    Services.mm.addMessageListener("page-scraper-message", this._messageHandler);
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

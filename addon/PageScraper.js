/* globals XPCOMUtils, Services, EventEmitter, Task */
"use strict";

const {MetadataParser} = require("addon/MetadataParser");
const {Cu} = require("chrome");
const options = require("@loader/options");
const PAGE_PARSED_NOTIF = "page-scraper-page-parsed";

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.importGlobalProperties(["URL"]);

const FRAME_SCRIPT_PATH = new URL("data/page-scraper-content-script.js", options.prefixURI);

XPCOMUtils.defineLazyGetter(this, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

function PageScraper(previewProvider, metadataStore) {
  EventEmitter.decorate(this);
  this._metadataStore = metadataStore;
  this._previewProvider = previewProvider;
  this._metadataParser = new MetadataParser(previewProvider);
  this.init();
}

PageScraper.prototype = {
  /**
   * Parse the raw HTML and save into the metadata DB if it is not found
   */
  _asyncParseAndSave: Task.async(function*(raw, url) {
    let link = yield this._asyncDoesLinkExist({url});
    if (!link) {
      this._metadataParser.parseHTMLText(raw, url).then(metadata => {
        this._metadataStore.asyncInsert(metadata);
        Services.obs.notifyObservers(null, PAGE_PARSED_NOTIF, JSON.stringify(metadata));
      });
    }
  }),

  /**
   * Check if the URL is already in the metadata DB
   */
  _asyncDoesLinkExist: Task.async(function*(urlObject) {
    const link = this._previewProvider.processLinks([urlObject]);
    const linkInDB = yield this._previewProvider._asyncFindItemsInDB(link);
    return linkInDB.length;
  }),

  /**
   * Observer for the page scraper notification
   */
  observe(subject, topic, data) {
    this.emit(topic, data);
  },

  /**
   * Initialize the Page Scraper
   */
  init() {
    Services.obs.addObserver(this, PAGE_PARSED_NOTIF, false);
    Services.mm.loadFrameScript(FRAME_SCRIPT_PATH, true);
    Services.mm.addMessageListener("page-scraper-message", message => {
      let {text, url} = message.data.data;
      if (message.data.type === "PAGE_HTML") {
        this._asyncParseAndSave(text, url);
      }
    });
  },

  /**
   * Uninitialize the Page Scraper
   */
  uninit() {
    Services.obs.removeObserver(this, PAGE_PARSED_NOTIF);
    Services.mm.removeMessageListener("page-scraper-message", this);
    Services.mm.removeDelayedFrameScript(FRAME_SCRIPT_PATH);
  }
};

exports.PageScraper = PageScraper;

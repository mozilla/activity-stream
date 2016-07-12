/* globals XPCOMUtils, Services, EventEmitter */
"use strict";

const simplePrefs = require("sdk/simple-prefs");
const {PageMod} = require("sdk/page-mod");
const {data} = require("sdk/self");
const {parseHTMLText} = require("lib/MetadataParser");
const {Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function() {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

class PageScraper {
  constructor() {
    EventEmitter.decorate(this);
    this.pageMod = null;
    this.enabled = false;

    simplePrefs.on(PageScraper.PAGE_SCRAPER_PREF, () => {
      const newEnabledValue = simplePrefs.prefs[PageScraper.PAGE_SCRAPER_PREF];
      if (newEnabledValue && !this.enabled) {
        this.load();
      } else if (!newEnabledValue && this.enabled) {
        this.unload();
      }
    });
    if (simplePrefs.prefs[PageScraper.PAGE_SCRAPER_PREF]) {
      this.load();
    }
  }
  parseAndSave(raw, url) {
    parseHTMLText(raw, url)
      .then(metadata => {
        // Todo: save in store
        console.log(metadata); // eslint-disable-line no-console
        Services.obs.notifyObservers(null, PageScraper.PAGE_PARSED_NOTIF, JSON.stringify(metadata));
      });
  }
  observe(subject, topic, data) {
    this.emit(topic, data);
  }
  load() {
    if (this.pageMod) {
      return;
    }
    Services.obs.addObserver(this, PageScraper.PAGE_PARSED_NOTIF);
    this.pageMod = PageMod({
      include: "*",
      attachTo: ["existing", "top"],
      contentScriptFile: data.url("page-scraper-content-script.js"),
      onAttach: worker => {
        worker.port.on("message", action => {
          if (action.type === "PAGE_HTML") {
            this.parseAndSave(action.data.text, action.data.url);
          }
        });
      }
    });
    this.enabled = true;
  }
  unload() {
    if (this.enabled) {
      Services.obs.removeObserver(this, PageScraper.PAGE_PARSED_NOTIF);
      this.pageMod.destroy();
    }
    this.pageMod = null;
    this.enabled = false;
  }
}

PageScraper.PAGE_SCRAPER_PREF = "page.scraper";
PageScraper.PAGE_PARSED_NOTIF = "page-scraper-page-parsed";

exports.PageScraper = PageScraper;

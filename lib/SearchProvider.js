/* global XPCOMUtils, ContentSearch, Task, Services, EventEmitter */

"use strict";
const {Ci, Cu} = require("chrome");

const CURRENT_ENGINE = "browser-search-engine-modified";

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "ContentSearch",
                                  "resource:///modules/ContentSearch.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function() {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

let NewTabSearchProvider = function NewTabSearchProvider() {
  EventEmitter.decorate(this);
};

NewTabSearchProvider.prototype = {

  observe(subject, topic, data) {
    if (topic === CURRENT_ENGINE && data === "engine-current") {
      Task.spawn(function*() {
        let engine = yield ContentSearch._currentEngineObj();
        this.emit(CURRENT_ENGINE, engine);
      }.bind(this));
    } else if (data === "engine-default") {
      // engine-default is always sent with engine-current and isn't
      // relevant to content searches.
      return;
    } else {
      Cu.reportError(new Error("NewTabSearchProvider observing unknown topic"));
    }
  },

  init() {
    Services.obs.addObserver(this, CURRENT_ENGINE, true);
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver,
    Ci.nsISupportsWeakReference
  ]),

  uninit() {
    Services.obs.removeObserver(this, CURRENT_ENGINE, true);
  },

  removeFormHistoryEntry(browser, entry) {
    if ("removeFormHistoryEntry" in ContentSearch) {
      // ContentSearch.jsm from Firefox 49+
      ContentSearch.removeFormHistoryEntry({target: browser}, entry);
    } else {
      // legacy ContentSearch
      ContentSearch._onMessageRemoveFormHistoryEntry({target: browser}, entry);
    }
  },

  get state() {
    return Task.spawn(function*() {
      let state;
      try {
        if ("currentStateObj" in ContentSearch) {
          // ContentSearch.jsm from Firefox 49+
          state = yield ContentSearch.currentStateObj(true);
        } else {
          // legacy ContentSearch
          state = yield ContentSearch._currentStateObj();
        }
        return state;
      } catch (e) {
        Cu.reportError(e);
      }
    }.bind(this));
  },

  performSearch(browser, searchData) {
    if ("performSearch" in ContentSearch) {
      // ContentSearch.jsm from Firefox 49+
      ContentSearch.performSearch({target: browser}, searchData);
      ContentSearch.addFormHistoryEntry({target: browser}, searchData.searchString);
    } else {
      // legacy ContentSearch
      ContentSearch._onMessageSearch({target: browser}, searchData);
      ContentSearch._onMessageAddFormHistoryEntry({target: browser}, searchData);
    }
  },
};

const gSearch = new NewTabSearchProvider();

exports.SearchProvider = {
  search: gSearch,
};

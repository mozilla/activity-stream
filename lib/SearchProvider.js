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

  get state() {
    return Task.spawn(function*() {
      // a new version of ContentSearch.jsm landed in nightly but not firefox
      // therefore, for now, we need to accomodate for both versions.
      let state;
      try {
        state = yield ContentSearch.currentStateObj(true);
      } catch (e) {
        state = yield ContentSearch._currentStateObj();
        Cu.reportError(e);
      }
      return state;
    }.bind(this));
  },

  performSearch(browser, searchData) {
   ContentSearch._onMessageSearch({target: browser}, searchData);
 },
};

const gSearch = new NewTabSearchProvider();

exports.SearchProvider = {
  search: gSearch,
};

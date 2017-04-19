/* global XPCOMUtils, Task, Services, EventEmitter, FormHistory,
SearchSuggestionController, PrivateBrowsingUtils, exports, require */

"use strict";
const {Ci, Cu} = require("chrome");
const {PrefsTarget} = require("sdk/preferences/event-target");
const SEARCH_ENGINE_TOPIC = "browser-search-engine-modified";
const HIDDEN_ENGINES_PREF = "browser.search.hiddenOneOffs";
const ENGINE_ICON_SIZE = 16;
const MAX_LOCAL_SUGGESTIONS = 3;
const MAX_SUGGESTIONS = 6;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.importGlobalProperties(["URL", "Blob", "FileReader", "atob"]);

XPCOMUtils.defineLazyModuleGetter(this, "FormHistory",
                                  "resource://gre/modules/FormHistory.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PrivateBrowsingUtils",
                                  "resource://gre/modules/PrivateBrowsingUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "SearchSuggestionController",
                                  "resource://gre/modules/SearchSuggestionController.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

function SearchProvider() {
  EventEmitter.decorate(this);
  this._target = PrefsTarget();
  this._onPrefChange = this._onPrefChange.bind(this);
}

SearchProvider.prototype = {

  // This is used to handle search suggestions.  It maps xul:browsers to objects
  // { controller, previousFormHistoryResult }.
  _suggestionMap: new WeakMap(),
  QueryInterface: XPCOMUtils.generateQI([
    Ci.nsIObserver,
    Ci.nsISupportsWeakReference
  ]),

  /**
   * Event listener for the HIDDEN_ENGINES_PREF pref change
   */
  _onPrefChange(e) {
    this.emit(SEARCH_ENGINE_TOPIC, "hiddenOneOffs");
  },

  /**
   *  Observe current engine changes to notify all other newtab pages.
   */
  observe(subject, topic, data) {
    if (topic !== SEARCH_ENGINE_TOPIC) {
      return;
    }
    switch (data) {
      case "engine-current":
      case "engine-changed":
      case "engine-added":
      case "engine-removed":
        this.emit(SEARCH_ENGINE_TOPIC, data);
    }
  },

  /**
   *  Initialize the Search Provider.
   */
  init() {
    this._target.on(HIDDEN_ENGINES_PREF, this._onPrefChange);
    Services.obs.addObserver(this, SEARCH_ENGINE_TOPIC, true);
  },

  /**
   *  Unintialize the Search Provider.
   */
  uninit() {
    this._target.removeListener(HIDDEN_ENGINES_PREF, this._onPrefChange);
    Services.obs.removeObserver(this, SEARCH_ENGINE_TOPIC, true);
  },

  /**
   *  Gets the current engine - a combination of the engine name and the icon URI.
   */
  get currentEngine() {
    const engine = Services.search.currentEngine;
    const favicon = engine.getIconURLBySize(ENGINE_ICON_SIZE, ENGINE_ICON_SIZE);
    let obj = {
      name: engine.name,
      iconBuffer: favicon
    };
    return obj;
  },

  /**
   *  Removes an entry from the form history.
   */
  removeFormHistoryEntry(browser, entry) {
    let {previousFormHistoryResult} = this._suggestionMap.get(browser);
    if (!previousFormHistoryResult) {
      return false;
    }
    for (let i = 0; i < previousFormHistoryResult.matchCount; i++) {
      if (previousFormHistoryResult.getValueAt(i) === entry) {
        previousFormHistoryResult.removeValueAt(i, true);
        return true;
      }
    }
    return false;
  },

  /**
   *  Opens about:preferences#search in order to manage search settings.
   */
  manageEngines(browser) {
    const browserWindow = browser.ownerGlobal;
    browserWindow.openPreferences("paneSearch");
  },

  /**
   *  Change the current search engine and capture the new state.
   */
  cycleCurrentEngine(engineName) {
    Services.search.currentEngine = Services.search.getEngineByName(engineName);
    const newEngine = this.currentEngine;
    this.emit("CURRENT_ENGINE", newEngine);
  },

  /**
   *  Gets the state - a combination of the current engine and all the visible engines.
   */
  get currentState() {
    let state = {
      engines: [],
      currentEngine: this.currentEngine
    };
    const pref = Services.prefs.getCharPref(HIDDEN_ENGINES_PREF);
    const hiddenEngines = pref ? pref.split(",") : [];
    let result = Services.search.getVisibleEngines().filter(engine => !hiddenEngines.includes(engine.name));
    for (let engine of result) {
      let favicon = engine.getIconURLBySize(ENGINE_ICON_SIZE, ENGINE_ICON_SIZE);
      state.engines.push({
        name: engine.name,
        iconBuffer: favicon
      });
    }
    return state;
  },

  /**
   *  Gets the suggestion based on the search string and the current engine.
   */
  asyncGetSuggestions: Task.async(function*(browser, data) {
    const engine = Services.search.getEngineByName(data.engineName);
    if (!engine) {
      throw new Error(`Unknown engine name: ${data.engineName}`);
    }
    let {controller} = this._getSuggestionData(browser);
    let ok = SearchSuggestionController.engineOffersSuggestions(engine);
    controller.maxLocalResults = ok ? MAX_LOCAL_SUGGESTIONS : MAX_SUGGESTIONS;
    controller.maxRemoteResults = ok ? MAX_SUGGESTIONS : 0;
    let isPrivate = PrivateBrowsingUtils.isBrowserPrivate(browser);

    let suggestions;
    try {
      // If fetch() rejects due to it's asynchronous behaviour, the suggestions
      // are null and is then handled.
      suggestions = yield controller.fetch(data.searchString, isPrivate, engine);
    } catch (e) {
      Cu.reportError(e);
    }

    let result = null;
    if (suggestions) {
      this._suggestionMap.get(browser).previousFormHistoryResult = suggestions.formHistoryResult;
      result = {
        engineName: data.engineName,
        searchString: suggestions.term,
        formHistory: suggestions.local,
        suggestions: suggestions.remote
      };
    }
    return result;
  }),

  /**
   *  Performs a search in the browser.
   */
  asyncPerformSearch: Task.async(function*(browser, data) {
    const engine = Services.search.getEngineByName(data.engineName);
    const submission = engine.getSubmission(data.searchString, "", data.searchPurpose);

    // The browser may have been closed between the time its content sent the
    // message and the time we handle it. In that case, trying to call any
    // method on it will throw.
    const browserWindow = browser.ownerGlobal;
    const whereToOpen = browserWindow.whereToOpenLink(data.originalEvent);

    // There is a chance that by the time we receive the search message, the user
    // has switched away from the tab that triggered the search. If, based on the
    // event, we need to load the search in the same tab that triggered it (i.e.
    // where === "current"), openUILinkIn will not work because that tab is no
    // longer the current one. For this case we manually load the URI.
    if (whereToOpen === "current") {
      browser.loadURIWithFlags(submission.uri.spec, Ci.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, submission.postData);
    } else {
      let params = {
        postData: submission.postData,
        inBackground: Services.prefs.getBoolPref("browser.tabs.loadInBackground")
      };
      browserWindow.openUILinkIn(submission.uri.spec, whereToOpen, params);
    }
    yield this._asyncAddFormHistoryEntry(browser, data.searchString);
    return browserWindow;
  }),

  /**
   *  Add an entry to the form history - after a search happens.
   */
  _asyncAddFormHistoryEntry: Task.async(function*(browser, entry = "") {
    let {controller} = this._getSuggestionData(browser);
    let isPrivate = false;
    try {
      isPrivate = PrivateBrowsingUtils.isBrowserPrivate(browser);
    } catch (e) {
      // The browser might have already been destroyed.
      return false;
    }
    if (isPrivate || entry === "") {
      return false;
    }
    let result = yield new Promise((resolve, reject) => {
      const ops = {
        op: "bump",
        fieldname: controller.formHistoryParam,
        value: entry
      };
      const callbacks = {
        handleCompletion: () => resolve(true),
        handleError: () => reject()
      };
      FormHistory.update(ops, callbacks);
    }).catch(err => Cu.reportError(err));
    return result;
  }),

  /**
   *  Gets the suggestions data for the current browser.
   */
  _getSuggestionData(browser) {
    let data = this._suggestionMap.get(browser);
    if (!data) {
      // Since one SearchSuggestionController instance is meant to be used per
      // autocomplete widget, this means that we assume each xul:browser has at
      // most one such widget.
      data = {
        controller: new SearchSuggestionController(),
        previousFormHistoryResult: undefined
      };
      this._suggestionMap.set(browser, data);
    }
    return data;
  }
};

exports.SearchProvider = SearchProvider;
exports.HIDDEN_ENGINES_PREF = HIDDEN_ENGINES_PREF;

/* global XPCOMUtils, Task, Services, EventEmitter, FormHistory,
SearchSuggestionController, PrivateBrowsingUtils, exports, require */

"use strict";
const {Ci, Cu} = require("chrome");
const CURRENT_ENGINE = "browser-search-engine-modified";
const HIDDEN_ENGINES = "browser.search.hiddenOneOffs";
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

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function() {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

let NewTabSearchProvider = function NewTabSearchProvider() {
  EventEmitter.decorate(this);
};

NewTabSearchProvider.prototype = {

  // This is used to handle search suggestions.  It maps xul:browsers to objects
  // { controller, previousFormHistoryResult }.
  _suggestionMap: new WeakMap(),

  /**
   *  Observe current engine changes to notify all other newtab pages.
   */
  observe(subject, topic, data) {
    if (topic === CURRENT_ENGINE && data === "engine-current") {
      Task.spawn(function*() {
        let engine = this.currentEngine;
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

  /**
   *  Initialize the Search Provider.
   */
  init() {
    Services.obs.addObserver(this, CURRENT_ENGINE, true);
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver,
    Ci.nsISupportsWeakReference
  ]),

  /**
   *  Unintialize the Search Provider.
   */
  uninit() {
    Services.obs.removeObserver(this, CURRENT_ENGINE, true);
  },

  /**
   *  Sets the UI strings.
   */
  get searchSuggestionUIStrings() {
    return {
      "searchHeader": "%S Search",
      "searchForSomethingWith": "Search for",
      "searchSettings": "Change Search Settings",
      "searchPlaceholder": "Search the Web"
    };
  },

  /**
   *  Gets the current engine - a combination of the engine name and the icon URI.
   */
  get currentEngine() {
    const engine = Services.search.currentEngine;
    const favicon = engine.getIconURLBySize(ENGINE_ICON_SIZE, ENGINE_ICON_SIZE);
    let obj = {
      name: engine.name,
      iconBuffer: favicon,
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
    const browserWindow = browser.ownerDocument.defaultView;
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
  asyncGetCurrentState: Task.async(function*() {
    let state = {
      engines: [],
      currentEngine: this.currentEngine,
    };
    const pref = Services.prefs.getCharPref(HIDDEN_ENGINES);
    const hiddenEngines = pref ? pref.split(",") : [];
    let result =  Services.search.getVisibleEngines().filter(engine => !hiddenEngines.includes(engine.name));
    for (let engine of result) {
      let favicon = engine.getIconURLBySize(ENGINE_ICON_SIZE, ENGINE_ICON_SIZE);
      state.engines.push({
        name: engine.name,
        iconBuffer: favicon,
      });
    }
    return state;
  }),

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
    controller.remoteTimeout = data.remoteTimeout || undefined;
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
        suggestions: suggestions.remote,
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
    const browserWindow = browser.ownerDocument.defaultView;
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
        inBackground: Services.prefs.getBoolPref("browser.tabs.loadInBackground"),
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
        value: entry,
      };
      const callbacks = {
        handleCompletion: () => resolve(true),
        handleError: () => reject(),
      };
      FormHistory.update(ops, callbacks);
    });
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
        previousFormHistoryResult: undefined,
      };
      this._suggestionMap.set(browser, data);
    }
    return data;
  },
};

exports.SearchProvider = {
  search: new NewTabSearchProvider()
};

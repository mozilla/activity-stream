/* globals NewTabURL, EventEmitter, XPCOMUtils, windowMediator, Task, Services */

"use strict";

const {Cu} = require("chrome");
const {data} = require("sdk/self");
const {PageMod} = require("sdk/page-mod");
const {setTimeout, clearTimeout} = require("sdk/timers");
const tabs = require("sdk/tabs");
const simplePrefs = require("sdk/simple-prefs");
const privateBrowsing = require("sdk/private-browsing");
const windows = require("sdk/windows").browserWindows;
const prefService = require("sdk/preferences/service");
const ss = require("sdk/simple-storage");
const {PlacesProvider} = require("addon/PlacesProvider");
const {SearchProvider} = require("addon/SearchProvider");
const {ShareProvider} = require("addon/ShareProvider");
const {PreviewProvider} = require("addon/PreviewProvider");
const {RecommendationProvider} = require("addon/RecommendationProvider");
const {PerfMeter} = require("addon/PerfMeter");
const {AppURLHider} = require("addon/AppURLHider");
const am = require("common/action-manager");
const {CONTENT_TO_ADDON, ADDON_TO_CONTENT} = require("common/event-constants");
const {ExperimentProvider} = require("addon/ExperimentProvider");
const {PrefsProvider} = require("addon/PrefsProvider");
const createStore = require("common/create-store");
const PageWorker = require("addon/PageWorker");
const {PageScraper} = require("addon/PageScraper");

const FeedController = require("addon/lib/FeedController.js");
const feeds = require("addon/Feeds/feeds.js");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/NewTabURL.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

const DEFAULT_OPTIONS = {
  pageURL: data.url("content/activity-streams.html"),
  onAddWorker: null,
  onRemoveWorker: null,
  recommendationTTL: 3600000, // every hour, get a new recommendation
  shareProvider: null,
  pageScraper: null,
  pageWorker: null,
  searchProvider: null,
  recommendationProvider: null
};

const PLACES_CHANGES_EVENTS = [
  "deleteURI",
  "clearHistory",
  "linkChanged",
  "manyLinksChanged",
  "bookmarkAdded",
  "bookmarkRemoved",
  "bookmarkChanged"
];

const HOME_PAGE_PREF = "browser.startup.homepage";

function ActivityStreams(metadataStore, tabTracker, telemetrySender, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  EventEmitter.decorate(this);
  this._metadataStore = metadataStore;
  this._tabTracker = tabTracker;
  this._telemetrySender = telemetrySender;
  this._newTabURL = `${this.options.pageURL}#/`;
  Services.prefs.setIntPref("places.favicons.optimizeToDimension", 64);
  this._experimentProvider = new ExperimentProvider(
    options.experiments,
    options.rng
  );
  this._searchProvider = this.options.searchProvider || new SearchProvider();
  this._feeds = new FeedController({
    feeds,
    searchProvider: this._searchProvider,
    // TODO: move this into Feeds. Requires previewProvider/tabTracker to be independent
    getMetadata: (links, type) => {
      const event = this._tabTracker.generateEvent({source: type});
      return this._previewProvider.getLinkMetadata(links, event);
    }
  });
  this._store = createStore({middleware: this._feeds.reduxMiddleware});
  this._feeds.connectStore(this._store);
}

ActivityStreams.prototype = {

  _pagemod: null,
  _newRecommendationTimeoutID: null,
  _isUnloaded: false,

  init() {
    this._initializePerfMeter();
    this._initializeAppURLHider();

    if (!this.options.shield_variant) {
      this._experimentProvider.init();
    }
    this._tabTracker.init(this.appURLs, this._experimentProvider.experimentId, this._store);
    this._searchProvider.init();
    this._initializePreviewProvier(this._experimentProvider, this._metadataStore, this._tabTracker);
    this._initializePageScraper(this._previewProvider, this._tabTracker);
    this._initializeRecommendationProvider(this._experimentProvider, this._previewProvider, this._tabTracker);
    this._initializeShareProvider(this._tabTracker);
    this._initializePrefProvider();

    this._setupPageMod();
    this._setupListeners();
    NewTabURL.override(this._newTabURL);
    this._setHomePage();
    this._setUpPageWorker(this._store);

    this._initializeAppData();
    this._store.dispatch({type: "APP_INIT"});
  },

  /**
   * Send a message to a worker
   */
  send(action, worker, skipMasterStore) {
    // if the function is async, the worker might not be there yet, or might have already disappeared
    try {
      if (!skipMasterStore) {
        this._store.dispatch(action);
      }
      worker.port.emit(ADDON_TO_CONTENT, action);
      this._perfMeter.log(worker.tab, action.type);
    } catch (err) {
      this.workers.delete(worker);
      Cu.reportError(err);
    }
  },

  /**
   * Broadcast a message to all workers
   */
  broadcast(action) {
    this._store.dispatch(action);
    for (let worker of this.workers) {
      this.send(action, worker, true);
    }
  },

  _initializeAppData() {
    this._refreshAppState();
  },

  _setUpPageWorker(store) {
    this._pageWorker = null;
    if (!this.options.pageWorker) {
      this._pageWorker = new PageWorker({store});
      this._pageWorker.connect();
    } else {
      this._pageWorker = this.options.pageWorker;
    }
  },

  _initializePerfMeter() {
    this._perfMeter = new PerfMeter(this.appURLs);
  },

  _initializeAppURLHider() {
    this._appURLHider = new AppURLHider(this.appURLs);
  },

  _initializePreviewProvier(experimentProvider, metadataStore, tabTracker) {
    this._previewProvider = new PreviewProvider(tabTracker, metadataStore, experimentProvider);
  },

  _initializePrefProvider() {
    this._prefsProvider = new PrefsProvider({
      simplePrefs,
      broadcast: this.broadcast.bind(this),
      send: this.send.bind(this)
    });
    this._prefsProvider.init();
  },

  _initializeShareProvider(tabTracker) {
    if (this.options.shareProvider) {
      this._shareProvider = this.options.shareProvider;
    } else {
      this._shareProvider = new ShareProvider({eventTracker: tabTracker});
    }
    this._shareProvider.init();
  },

  _initializeRecommendationProvider(experimentProvider, previewProvider, tabTracker) {
    // Only create RecommendationProvider if they are in the experiment
    this._recommendationProvider = null;
    if (experimentProvider.data.recommendedHighlight) {
      if (!this.options.recommendationProvider) {
        this._recommendationProvider = new RecommendationProvider(previewProvider, tabTracker);
      } else {
        this._recommendationProvider = this.options.recommendationProvider;
      }
      this._recommendationProvider.init();
      if (simplePrefs.prefs.recommendations) {
        this._recommendationProvider.asyncSetRecommendedContent();
      }
      this._refreshRecommendations(this.options.recommendationTTL);
    }
  },

  _initializePageScraper(previewProvider, tabTracker) {
    this._pageScraper = null;

    if (!this.options.pageScraper) {
      this._pageScraper = new PageScraper(previewProvider, tabTracker);
    } else {
      this._pageScraper = this.options.pageScraper;
    }
    this._pageScraper.init();
  },

  /**
   * _refreshAppState - This function replaces all messages that used to be requested on a page reload.
   *                    instead, they dispatch actions on the master store directly.
   *                    TODO: Refactor this in to a different functions that handle refreshing data separately
   */
  _refreshAppState() {
    this._store.dispatch(am.actions.Response("EXPERIMENTS_RESPONSE", this._experimentProvider.data));

    this._store.dispatch(am.actions.Response("PREFS_RESPONSE", simplePrefs.prefs));

    this._store.dispatch(am.actions.Response("SHARE_PROVIDERS_RESPONSE", this._shareProvider.socialProviders));
  },

  _respondOpenWindow({msg}) {
    if (msg.type === am.type("NOTIFY_OPEN_WINDOW")) {
      windows.open({
        url: msg.data.url,
        isPrivate: msg.data.isPrivate
      });
    }
  },

  /**
   * Responds to places requests
   */
  _respondToPlacesRequests({msg, worker}) {
    switch (msg.type) {
      case am.type("NOTIFY_BOOKMARK_ADD"):
        PlacesProvider.links.asyncAddBookmark(msg.data);
        break;
      case am.type("NOTIFY_BOOKMARK_DELETE"):
        PlacesProvider.links.asyncDeleteBookmark(msg.data);
        break;
      case am.type("NOTIFY_HISTORY_DELETE"):
        PlacesProvider.links.deleteHistoryLink(msg.data);
        break;
      case am.type("NOTIFY_BLOCK_URL"):
        PlacesProvider.links.blockURL(msg.data);
        break;
      case am.type("NOTIFY_UNBLOCK_URL"):
        PlacesProvider.links.unblockURL(msg.data);
        break;
      case am.type("NOTIFY_BLOCK_RECOMMENDATION"):
        this._recommendationProvider.setBlockedRecommendation(msg.data);
        break;
    }
  },

  /**
   * Responds to search requests
   */
  _respondToSearchRequests({msg, worker}) {
    const win = windowMediator.getMostRecentWindow("navigator:browser");
    const gBrowser = win.getBrowser();
    const browser = gBrowser.selectedBrowser;
    switch (msg.type) {
      case am.type("NOTIFY_PERFORM_SEARCH"):
        this._searchProvider.asyncPerformSearch(browser, msg.data);
        break;
      case am.type("SEARCH_SUGGESTIONS_REQUEST"):
        Task.spawn(function*() {
          try {
            const suggestions = yield this._searchProvider.asyncGetSuggestions(browser, msg.data);
            if (suggestions) {
              this.send(am.actions.Response("SEARCH_SUGGESTIONS_RESPONSE", suggestions), worker, true);
            }
          } catch (e) {
            Cu.reportError(e);
          }
        }.bind(this));
        break;
      case am.type("NOTIFY_REMOVE_FORM_HISTORY_ENTRY"): {
        let entry = msg.data;
        this._searchProvider.removeFormHistoryEntry(browser, entry);
        break;
      }
      case am.type("NOTIFY_MANAGE_ENGINES"):
        this._searchProvider.manageEngines(browser);
        break;
      case am.type("SEARCH_CYCLE_CURRENT_ENGINE_REQUEST"): {
        this._searchProvider.cycleCurrentEngine(msg.data);
        let engine = this._searchProvider.currentEngine;
        this.send(am.actions.Response("SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE", {currentEngine: engine}), worker);
        break;
      }
    }
  },

  /**
   * Responds to share requests
   */
  _respondToShareRequests({msg, worker}) {
    const win = windowMediator.getMostRecentWindow("navigator:browser");
    switch (msg.type) {
      case am.type("NOTIFY_SHARE_URL"):
        this._shareProvider.shareLink(msg.data.provider, {url: msg.data.url, title: msg.data.title}, null, win);
        break;
      case am.type("NOTIFY_COPY_URL"):
        this._shareProvider.copyLink(msg.data.url);
        break;
      case am.type("NOTIFY_EMAIL_URL"):
        this._shareProvider.emailLink(msg.data.url, msg.data.title, win);
        break;
    }
  },

  _respondToExperimentsRequest({worker}) {
    this.send(am.actions.Response("EXPERIMENTS_RESPONSE", this._experimentProvider.data), worker);
  },

  /**
   * Handles changes to places
   */
  _handlePlacesChanges(eventName, data) {
    switch (eventName) {
      case "bookmarkAdded":
        this.broadcast(am.actions.Response("RECEIVE_BOOKMARK_ADDED", data));
        break;
      case "bookmarkRemoved":
        this.broadcast(am.actions.Response("RECEIVE_BOOKMARK_REMOVED", data));
        break;
      default:
        this.broadcast(am.actions.Response("RECEIVE_PLACES_CHANGES", data));
    }
  },

  /*
   * Broadcast current engine has changed to all open newtab pages
   */
  _handleCurrentEngineChanges(eventName, data) {
    this.broadcast(am.actions.Response("SEARCH_ENGINES_CHANGED", data));
  },

  _handleUserEvent({msg}) {
    this._tabTracker.handleUserEvent(msg.data);
  },

  _respondToRecommendationToggle() {
    simplePrefs.prefs.recommendations = !simplePrefs.prefs.recommendations;
  },

  _onRouteChange({msg} = {}) {
    if (msg) {
      this._tabTracker.handleRouteChange(tabs.activeTab, msg.data);
    }
  },

  _respondToUIChanges(args) {
    const {msg} = args;
    switch (msg.type) {
      case am.type("NOTIFY_ROUTE_CHANGE"):
        return this._onRouteChange(args);
      case am.type("NOTIFY_USER_EVENT"):
        return this._handleUserEvent(args);
      case am.type("EXPERIMENTS_REQUEST"):
        return this._respondToExperimentsRequest(args);
      case am.type("NOTIFY_TOGGLE_RECOMMENDATIONS"):
        return this._respondToRecommendationToggle();
    }
    return undefined;
  },

  _logPerfMeter({msg, worker}) {
    this._perfMeter.log(worker.tab, msg.type, msg.data);
  },

  /**
   * Sets up various listeners for the pages
   */
  _setupListeners() {
    this._handlePlacesChanges = this._handlePlacesChanges.bind(this);
    PLACES_CHANGES_EVENTS.forEach(event => PlacesProvider.links.on(event, this._handlePlacesChanges));

    this._handleCurrentEngineChanges = this._handleCurrentEngineChanges.bind(this);
    this._searchProvider.on("browser-search-engine-modified", this._handleCurrentEngineChanges);

    // This is a collection of handlers that receive messages from content
    this._contentToAddonHandlers = (msgName, args) => {
      // Log requests first so that the requests are logged before responses
      // in synchronous response cases.
      this._logPerfMeter(args);

      // Dispatch to store, to synchronize it
      if (!args.msg.meta || !args.msg.meta.skipMasterStore) {
        this._store.dispatch(args.msg);
      }

      // Other handlers
      this._respondToUIChanges(args);
      this._respondToPlacesRequests(args);
      this._respondToSearchRequests(args);
      this._respondToShareRequests(args);
      this._respondOpenWindow(args);
      this._prefsProvider.actionHandler(args);
    };
    this.on(CONTENT_TO_ADDON, this._contentToAddonHandlers);
  },

  /**
   * Turns off various listeners for the pages
   */
  _removeListeners() {
    PLACES_CHANGES_EVENTS.forEach(event => PlacesProvider.links.off(event, this._handlePlacesChanges));
    this._searchProvider.off("browser-search-engine-modified", this._handleCurrentEngineChanges);
    this.off(CONTENT_TO_ADDON, this._contentToAddonHandlers);
  },

  /**
    * Start a timer to fetch a new recommendation every hour. This will only
    * run for those in the experiment
    */
  _refreshRecommendations(recommendationTTL) {
    if (recommendationTTL) {
      this._newRecommendationTimeoutID = setTimeout(() => {
        if (simplePrefs.prefs.recommendations) {
          this._recommendationProvider.getRecommendation(true);
        }
        this._refreshRecommendations(recommendationTTL);
      }, recommendationTTL);
    }
  },

  /**
   * Sets up communications with the pages and manages the lifecycle of workers
   */
  _setupPageMod() {
    // `this` here refers to the object instance
    this.workers = new Set();
    this._pagemod = new PageMod({
      include: [`${this.options.pageURL}*`],
      contentScriptFile: data.url("content-bridge.js"),
      contentScriptWhen: "start",
      attachTo: ["existing", "top"],
      onAttach: worker => {
        this._refreshAppState();

        // Don't attach when in private browsing. Send user to about:privatebrowsing
        if (privateBrowsing.isPrivate(worker)) {
          worker.tab.url = "about:privatebrowsing";
          return;
        }

        // This detaches workers on reload or closing the tab
        worker.on("detach", () => this._removeWorker(worker));

        // add the worker to a set to enable broadcasting
        if (!this.workers.has(worker)) {
          this._addWorker(worker);
        }

        worker.port.on(CONTENT_TO_ADDON, msg => {
          if (!msg.type) {
            Cu.reportError("ActivityStreams.dispatch error: unknown message type");
            return;
          }
          // This detaches workers if a new url is launched
          // it is important to remove the worker from the set, otherwise we will leak memory
          if (msg.type === "pagehide") {
            this._removeWorker(worker);
          }
          this.emit(CONTENT_TO_ADDON, {msg, worker});
        });
      },
      onError: err => {
        Cu.reportError(err);
      }
    });
  },

  /**
   * Adds a worker and calls callback if defined
   */
  _addWorker(worker) {
    this._perfMeter.log(worker.tab, "WORKER_ATTACHED");
    this.workers.add(worker);
    if (this.options.onAddWorker) {
      this.options.onAddWorker();
    }
  },

  /**
   * Removes a worker and calls callback if defined
   */
  _removeWorker(worker) {
    this.workers.delete(worker);
    if (this.options.onRemoveWorker) {
      this.options.onRemoveWorker();
    }
  },

  /*
   * Replace the home page with the ActivityStream new tab page.
   */
  _setHomePage() {
    // Only hijack the home page if it isn't set by user or if it is set to
    // about:home/about:blank
    // AND the user didn't previously override the preference.
    if (!ss.storage.homepageOverriden &&
        (!prefService.isSet(HOME_PAGE_PREF) ||
         ["about:home", "about:blank"].includes(prefService.get(HOME_PAGE_PREF)))) {
      prefService.set(HOME_PAGE_PREF, `${this._newTabURL}HOME`);
    }
  },

  _unsetHomePage() {
    if (prefService.get(HOME_PAGE_PREF) === `${this._newTabURL}HOME`) {
      // Reset home page back if user didn't change it.
      prefService.reset(HOME_PAGE_PREF);
    } else {
      // The user changed the pref. Keep track of that so next time we don't
      // hijack it again.
      ss.storage.homepageOverriden = true;
    }
  },

  /**
   * The URLs for the app.
   */
  get appURLs() {
    if (!this._appURLs) {
      let baseUrl = this.options.pageURL;
      this._appURLs = [
        baseUrl,
        `${baseUrl}#/`,
        `${baseUrl}#/HOME`
      ];
    }
    return this._appURLs;
  },

  get tabData() {
    return this._tabTracker.tabData;
  },

  get performanceData() {
    return this._perfMeter.events;
  },

  /**
   * Unload the application
   */
  unload(reason) { // eslint-disable-line no-unused-vars
    let defaultUnload = () => {
      if (this._newRecommendationTimeoutID) {
        clearTimeout(this._newRecommendationTimeoutID);
      }
      this._previewProvider.uninit();
      this._searchProvider.uninit();
      this._pageScraper.uninit();
      if (this._recommendationProvider) {
        this._recommendationProvider.uninit();
      }
      NewTabURL.reset();
      Services.prefs.clearUserPref("places.favicons.optimizeToDimension");
      this.workers.clear();
      this._removeListeners();
      this._pagemod.destroy();
      this._tabTracker.uninit();
      this._telemetrySender.uninit();
      this._appURLHider.uninit();
      this._perfMeter.uninit();
      this._prefsProvider.destroy();
      this._shareProvider.uninit(reason);
      this._experimentProvider.destroy();
      this._pageWorker.destroy();
    };

    switch (reason) {
      // can be one of: uninstall/disable/shutdown/upgrade/downgrade
      case "disable":
      case "uninstall":
        this._tabTracker.handleUserEvent({event: reason});
        this._experimentProvider.clearPrefs();
        this._unsetHomePage();
        defaultUnload();
        break;
      default:
        defaultUnload();
    }
    this._isUnloaded = true;
  }
};

exports.ActivityStreams = ActivityStreams;

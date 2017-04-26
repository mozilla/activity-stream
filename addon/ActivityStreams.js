/* globals NewTabURL, EventEmitter, XPCOMUtils, Services, Pocket */

"use strict";

const {Cu} = require("chrome");
const self = require("sdk/self");
const simplePrefs = require("sdk/simple-prefs");
const windows = require("sdk/windows").browserWindows;
const prefService = require("sdk/preferences/service");
const PageModProvider = require("addon/PageModProvider");
const {PlacesProvider} = require("addon/PlacesProvider");
const {SearchProvider} = require("addon/SearchProvider");
const {PreviewProvider} = require("addon/PreviewProvider");
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
const getCurrentBrowser = require("addon/lib/getCurrentBrowser");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/NewTabURL.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

XPCOMUtils.defineLazyModuleGetter(this, "Pocket", "chrome://pocket/content/Pocket.jsm");

const DEFAULT_OPTIONS = {
  pageURL: self.data.url("content/activity-streams.html"),
  onAddWorker: null,
  onRemoveWorker: null,
  pageScraper: null,
  pageWorker: null,
  searchProvider: null
};

const PLACES_CHANGES_EVENTS = [
  "deleteURI",
  "linkChanged",
  "manyLinksChanged",
  "bookmarkAdded",
  "bookmarkRemoved",
  "bookmarkChanged",
  "clearHistory"
];

const HOME_PAGE_PREF = "browser.startup.homepage";

const TOPIC_SYNC_COMPLETE = "services.sync.tabs.changed";

function ActivityStreams(metadataStore, tabTracker, telemetrySender, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  EventEmitter.decorate(this);
  this._pagemod = new PageModProvider({
    pageURL: this.options.pageURL,
    onAddWorker: this.options.onAddWorker,
    onRemoveWorker: this.options.onRemoveWorker
  });
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
    broadcast: this.broadcast.bind(this),
    send: this.sendById.bind(this),
    searchProvider: this._searchProvider,
    metadataStore: this._metadataStore,
    tabTracker: this._tabTracker,
    // TODO: move this into Feeds. Requires previewProvider/tabTracker to be independent
    getCachedMetadata: (links, type) => {
      const event = this._tabTracker.generateEvent({source: type});
      return this._previewProvider.asyncGetEnhancedLinks(links, event);
    },
    fetchNewMetadata: (links, type) => {
      const event = this._tabTracker.generateEvent({source: type});
      return this._previewProvider.asyncSaveLinks(links, event);
    },
    fetchNewMetadataLocally: (links, type) => this._pageScraper.asyncFetchLinks(links, type)
  });
  this._store = createStore({middleware: this._feeds.reduxMiddleware});
  this._feeds.connectStore(this._store);
  this.browser = getCurrentBrowser();
}

ActivityStreams.prototype = {

  _pagemod: null,
  _isUnloaded: false,

  init() {
    this._initializePerfMeter();
    this._initializeAppURLHider();

    if (!this.options.shield_variant) {
      this._experimentProvider.init();
    }
    this._tabTracker.init(this.appURLs, this._experimentProvider.experimentId, this._store);
    this._searchProvider.init();
    this._initializePreviewProvider(this._metadataStore, this._tabTracker, this._store);
    this._initializePageScraper(this._previewProvider, this._tabTracker);
    this._initializePrefProvider(this._tabTracker);

    this._setupPageMod();
    this._setupListeners();
    NewTabURL.override(this._newTabURL);
    this._setHomePage();
    this._setUpPageWorker(this._store);

    this._initializeAppData();
    this._store.dispatch({type: "APP_INIT"});

    Services.obs.addObserver(this, TOPIC_SYNC_COMPLETE, false);
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
      this._pagemod.removeWorker(worker);
      Cu.reportError(err);
    }
  },

  sendById(action, workerId, skipMasterStore) {
    const worker = this._pagemod.getWorkerById(workerId);
    this.send(action, worker, skipMasterStore);
  },

  /**
   * Broadcast a message to all workers
   */
  broadcast(action) {
    this._store.dispatch(action);
    this._pagemod.workers.forEach((id, worker) => {
      this.send(action, worker, true);
    });
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

  _initializePreviewProvider(metadataStore, tabTracker, store) {
    this._previewProvider = new PreviewProvider(tabTracker, metadataStore, store);
  },

  _initializePrefProvider(tabTracker) {
    this._prefsProvider = new PrefsProvider({eventTracker: tabTracker, broadcast: this.broadcast.bind(this)});
    this._prefsProvider.init();
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
      case am.type("NOTIFY_SAVE_TO_POCKET"):
        Pocket.savePage(this.browser, msg.data.url, msg.data.title);
        break;
    }
  },

  /**
   * Responds to a Pref Change request triggered from the UI.
   */
  _respondToPrefChange({msg}) {
    if (msg.type === am.type("NOTIFY_PREF_CHANGE")) {
      simplePrefs.prefs[msg.data.name] = msg.data.value;
    }
  },

  /**
   * Handles changes to places
   */
  _handlePlacesChanges(eventName, data) {
    switch (eventName) {
      case "bookmarkAdded":
        // Note: Firefox sometimes fires bookmarkAdded and bookmarkRemoved events
        // that have no data associated with them
        if (!data) {
          return;
        }
        this.broadcast(am.actions.Response("RECEIVE_BOOKMARK_ADDED", data));
        break;
      case "bookmarkRemoved":
        if (!data) {
          return;
        }
        this.broadcast(am.actions.Response("RECEIVE_BOOKMARK_REMOVED", data));
        break;
      case "manyLinksChanged":
        this.broadcast({type: "MANY_LINKS_CHANGED"});
        break;
      case "clearHistory":
        this._tabTracker.handleUserEvent({event: "CLEAR_HISTORY"});
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

  _handleUndesiredEvent({msg}) {
    this._tabTracker.handleUndesiredEvent(msg.data);
  },

  _handleNewTabStats({msg}) {
    this._tabTracker.handleNewTabStats(msg.data);
  },

  _handleImpressionStats({msg}) {
    this._tabTracker.handleImpressionStats(msg.data);
  },

  _handleExperimentChange(prefName) {
    this._tabTracker.experimentId = this._experimentProvider.experimentID;
    this.broadcast(am.actions.Response("EXPERIMENTS_RESPONSE", this._experimentProvider.data));
  },

  _respondToUIChanges(args) {
    const {msg} = args;
    switch (msg.type) {
      case am.type("NOTIFY_USER_EVENT"):
        return this._handleUserEvent(args);
      case am.type("NOTIFY_UNDESIRED_EVENT"):
        return this._handleUndesiredEvent(args);
      case am.type("NOTIFY_NEWTAB_STATS"):
        return this._handleNewTabStats(args);
      case am.type("NOTIFY_IMPRESSION_STATS"):
        return this._handleImpressionStats(args);
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

    this._handleExperimentChange = this._handleExperimentChange.bind(this);
    this._experimentProvider.on("change", this._handleExperimentChange);

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
      this._respondOpenWindow(args);
      this._respondToPrefChange(args);
    };
    this.on(CONTENT_TO_ADDON, this._contentToAddonHandlers);
  },

  /**
   * Turns off various listeners for the pages
   */
  _removeListeners() {
    PLACES_CHANGES_EVENTS.forEach(event => PlacesProvider.links.off(event, this._handlePlacesChanges));
    this._searchProvider.off("browser-search-engine-modified", this._handleCurrentEngineChanges);
    this._experimentProvider.off("change", this._handleExperimentChange);
    this.off(CONTENT_TO_ADDON, this._contentToAddonHandlers);
  },

  /**
   * Sets up communications with the pages and manages the lifecycle of workers
   */
  _setupPageMod() {
    this._pagemod.init({
      onAttach: this._refreshAppState.bind(this),
      onMessage: message => this.emit(CONTENT_TO_ADDON, message),
      logEvent: this._perfMeter.log.bind(this._perfMeter)
    });
  },

  /*
   * Replace the home page with the ActivityStream new tab page.
   */
  _setHomePage() {
    // Only hijack the home page if it isn't set by user or if it is set to
    // about:home/about:blank
    // AND the user didn't previously override the preference.
    if (!simplePrefs.prefs.homepageOverridden &&
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
      simplePrefs.prefs.homepageOverridden = true;
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

  observe(subject, topic, data) {
    switch (topic) {
      case TOPIC_SYNC_COMPLETE:
        this._store.dispatch({type: "SYNC_COMPLETE"});
        break;
      default:
        break;
    }
  },

  /**
   * Unload the application
   */
  unload(reason) {
    let defaultUnload = () => {
      this._store.dispatch({type: "APP_UNLOAD", data: reason});
      this._previewProvider.uninit();
      this._searchProvider.uninit();
      this._pageScraper.uninit();
      NewTabURL.reset();
      Services.prefs.clearUserPref("places.favicons.optimizeToDimension");
      this._removeListeners();
      this._pagemod.destroy();
      this._tabTracker.uninit();
      this._telemetrySender.uninit();
      this._appURLHider.uninit();
      this._perfMeter.uninit();
      this._prefsProvider.destroy();
      this._experimentProvider.destroy();
      this._pageWorker.destroy();

      Services.obs.removeObserver(this, TOPIC_SYNC_COMPLETE);
    };

    switch (reason) {
      // can be one of: uninstall/disable/shutdown/upgrade/downgrade
      case "disable":
      case "uninstall":
        this._tabTracker.handleUserEvent({event: reason});
        this._unsetHomePage();
        defaultUnload();
        this._experimentProvider.clearPrefs();
        break;
      default:
        defaultUnload();
    }
    this._isUnloaded = true;
  }
};

exports.ActivityStreams = ActivityStreams;

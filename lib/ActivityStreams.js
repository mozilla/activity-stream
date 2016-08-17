/* globals NewTabURL, EventEmitter, XPCOMUtils, windowMediator, Task, Services */

"use strict";

const {Cu} = require("chrome");
const {data} = require("sdk/self");
const {PageMod} = require("sdk/page-mod");
const {setTimeout, clearTimeout} = require("sdk/timers");
const {ActionButton} = require("sdk/ui/button/action");
const tabs = require("sdk/tabs");
const simplePrefs = require("sdk/simple-prefs");
const privateBrowsing = require("sdk/private-browsing");
const windows = require("sdk/windows").browserWindows;
const prefService = require("sdk/preferences/service");
const ss = require("sdk/simple-storage");
const {Memoizer} = require("lib/Memoizer");
const {PlacesProvider} = require("lib/PlacesProvider");
const {SearchProvider} = require("lib/SearchProvider");
const {ShareProvider} = require("lib/ShareProvider");
const {TabTracker} = require("lib/TabTracker");
const {PreviewProvider} = require("lib/PreviewProvider");
const {RecommendationProvider} = require("lib/RecommendationProvider");
const {TelemetrySender} = require("lib/TelemetrySender");
const {PerfMeter} = require("lib/PerfMeter");
const {AppURLHider} = require("lib/AppURLHider");
const am = require("common/action-manager");
const {CONTENT_TO_ADDON, ADDON_TO_CONTENT} = require("common/event-constants");
const {ExperimentProvider} = require("lib/ExperimentProvider");
const {Recommender} = require("common/recommender/Recommender");
const {PrefsProvider} = require("lib/PrefsProvider");

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
  placesCacheTimeout: 1800000, // every 30 minutes, rebuild/repopulate the cache
  recommendationTTL: 3600000, // every hour, get a new recommendation
  shareProvider: null
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

function ActivityStreams(metadataStore, options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  EventEmitter.decorate(this);

  this._newTabURL = `${this.options.pageURL}#/`;

  this._perfMeter = new PerfMeter(this.appURLs);

  Services.prefs.setIntPref("places.favicons.optimizeToDimension", 64);

  this._appURLHider = new AppURLHider(this.appURLs);

  this._memoizer = new Memoizer();
  this._memoized = this._get_memoized(this._memoizer);

  this._telemetrySender = new TelemetrySender();

  this._experimentProvider = new ExperimentProvider(
    options.clientID,
    options.experiments,
    options.rng
  );

  this._tabTracker = new TabTracker(
    this.appURLs,
    options.clientID,
    this._memoized,
    this._experimentProvider.experimentId
  );

  this._previewProvider = new PreviewProvider(this._tabTracker, metadataStore);

  this._populatingCache = {places: false};

  this._asyncBuildPlacesCache();

  // Only create RecommendationProvider if they are in the experiment
  if (this._experimentProvider.data.recommendedHighlight) {
    this._recommendationProvider = new RecommendationProvider(this._previewProvider, this._tabTracker);
    if (simplePrefs.prefs.recommendations) {
      this._recommendationProvider.asyncSetRecommendedContent();
    }
    this._refreshRecommendations(this.options.recommendationTTL);
  }

  if (this.options.shareProvider) {
    this._shareProvider = this.options.shareProvider;
  } else {
    this._shareProvider = new ShareProvider({eventTracker: this._tabTracker});
  }
  this._shareProvider.init();

  this._setupPageMod();
  this._setupListeners();
  this._setupButton();
  NewTabURL.override(this._newTabURL);
  this._setHomePage();
  this._prefsProvider = new PrefsProvider({
    simplePrefs,
    broadcast: this.broadcast.bind(this),
    send: this.send.bind(this)
  });

  this._prefsProvider.init();
  // This is instantiated with a recommender based on weights if pref is true. Used to score highlights.
  this._baselineRecommender = null;
  if (simplePrefs.prefs.weightedHighlights) {
    this._loadRecommender();
  }
}

ActivityStreams.prototype = {

  _pagemod: null,
  _button: null,
  _newRecommendationTimeoutID: null,

  /**
   * Send a message to a worker
   */
  send(action, worker) {
    // if the function is async, the worker might not be there yet, or might have already disappeared
    try {
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
    for (let worker of this.workers) {
      this.send(action, worker);
    }
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
   * Instantiate the recommender that scores the highlights items.
   * Called when weightedHighlights prefs is toggled to true.
   * @private
   */
  _loadRecommender() {
    // Only need to load history items once per session.
    if (this._baselineRecommender !== null) {
      return;
    }

    this._memoized.getAllHistoryItems().then(historyItems => {
      let highlightsCoefficients = this._loadWeightedHighlightsCoefficients();
      this._baselineRecommender = new Recommender(historyItems, {highlightsCoefficients});
    });
  },

  _loadWeightedHighlightsCoefficients() {
    try {
      let value = JSON.parse(simplePrefs.prefs.weightedHighlightsCoefficients);
      if (Array.isArray(value)) {
        return value;
      }

      Cu.reportError("Coefficients values must be a valid array");
    } catch (e) {
      Cu.reportError(e);
    }

    return null;
  },

  /**
   * Responds to places requests
   */
  _respondToPlacesRequests({msg, worker}) {
    let provider = this._memoized;
    if (msg.data && (msg.data.afterDate || msg.data.beforeDate)) {
      // Only use the Memoizer cache for the default first page of data.
      provider = PlacesProvider.links;
    }
    switch (msg.type) {
      case am.type("WEIGHTED_HIGHLIGHTS_REQUEST"):
        // Empty response in case the recommender is not instantiated, no need for the extra requests.
        if (this._baselineRecommender === null) {
          this.send(am.actions.Response("WEIGHTED_HIGHLIGHTS_RESPONSE", [], {append: msg.meta.append}), worker);
          break;
        }

        provider.getHighlightsLinks(msg.data).then(highlightsLinks => {
          // Decorate links with meta information.
          let cachedLinks = this._processLinks(highlightsLinks, "WEIGHTED_HIGHLIGHTS_RESPONSE", msg.meta);
          cachedLinks.then(highlightsWithMeta => {
            this.send(am.actions.Response("WEIGHTED_HIGHLIGHTS_RESPONSE",
                                          this._baselineRecommender.scoreEntries(highlightsWithMeta),
                                          {append: msg.meta.append}), worker);
          });
        });
        break;
      case am.type("TOP_FRECENT_SITES_REQUEST"):
        provider.getTopFrecentSites(msg.data).then(links => {
          this._processAndSendLinks(links, "TOP_FRECENT_SITES_RESPONSE", worker, msg.meta);
        });
        break;
      case am.type("RECENT_BOOKMARKS_REQUEST"):
        provider.getRecentBookmarks(msg.data).then(links => {
          this._processAndSendLinks(links, "RECENT_BOOKMARKS_RESPONSE", worker, msg.meta);
        });
        break;
      case am.type("RECENT_LINKS_REQUEST"):
        provider.getRecentLinks(msg.data).then(links => {
          this._processAndSendLinks(links, "RECENT_LINKS_RESPONSE", worker, msg.meta);
        });
        break;
      case am.type("HIGHLIGHTS_LINKS_REQUEST"):
        provider.getHighlightsLinks(msg.data).then(links => {
          this._processAndSendLinks(links, "HIGHLIGHTS_LINKS_RESPONSE", worker, msg.meta);
        });
        break;
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
      case am.type("NOTIFY_UNBLOCK_ALL"):
        PlacesProvider.links.unblockAll();
        break;
      case am.type("NOTIFY_BLOCK_RECOMMENDATION"):
        this._recommendationProvider.setBlockedRecommendation(msg.data);
        break;
    }
  },

  /**
   * Get from cache and response to content.
   *
   * @private
   */
  _processAndSendLinks(placesLinks, responseType, worker, options) {
    let {append} = options || {};
    let cachedLinks = this._processLinks(placesLinks, responseType, options);

    cachedLinks.then(linksToSend => this.send(am.actions.Response(responseType, linksToSend, {append}), worker));
  },

  /**
   * Process the passed in links, save them.
   *
   * @private
   */
  _processLinks(placesLinks, responseType, options) {
    let {previewsOnly, skipPreviewRequest} = options || {};
    const event = this._tabTracker.generateEvent({source: responseType});
    let inExperiment = this._experimentProvider.data.recommendedHighlight;
    let isAHighlight = responseType === "HIGHLIGHTS_LINKS_RESPONSE";
    let shouldGetRecommendation = isAHighlight && simplePrefs.prefs.recommendations && inExperiment;
    let recommendation = shouldGetRecommendation ? this._recommendationProvider.getRecommendation() : null;
    let linksToProcess = placesLinks.concat([recommendation]).filter(link => link);
    return this._previewProvider.getLinkMetadata(linksToProcess, event, skipPreviewRequest, previewsOnly);
  },

  /**
   * Responds to search requests
   */
  _respondToSearchRequests({msg, worker}) {
    const win = windowMediator.getMostRecentWindow("navigator:browser");
    const gBrowser = win.getBrowser();
    const browser = gBrowser.selectedBrowser;
    switch (msg.type) {
      case am.type("SEARCH_STATE_REQUEST"):
        SearchProvider.search.asyncGetCurrentState().then(state => {
          let currentEngine = JSON.stringify(state.currentEngine);
          state.currentEngine = currentEngine;
          this.send(am.actions.Response("SEARCH_STATE_RESPONSE", state), worker);
        });
        break;
      case am.type("NOTIFY_PERFORM_SEARCH"):
        SearchProvider.search.asyncPerformSearch(browser, msg.data);
        break;
      case am.type("SEARCH_UISTRINGS_REQUEST"): {
        const strings = SearchProvider.search.searchSuggestionUIStrings;
        this.send(am.actions.Response("SEARCH_UISTRINGS_RESPONSE", strings), worker);
        break;
      }
      case am.type("SEARCH_SUGGESTIONS_REQUEST"):
        Task.spawn(function*() {
          try {
            const suggestions = yield SearchProvider.search.asyncGetSuggestions(browser, msg.data);
            if (suggestions) {
              this.send(am.actions.Response("SEARCH_SUGGESTIONS_RESPONSE", suggestions), worker);
            }
          } catch (e) {
            Cu.reportError(e);
          }
        }.bind(this));
        break;
      case am.type("NOTIFY_REMOVE_FORM_HISTORY_ENTRY"): {
        let entry = msg.data;
        SearchProvider.search.removeFormHistoryEntry(browser, entry);
        break;
      }
      case am.type("NOTIFY_MANAGE_ENGINES"):
        SearchProvider.search.manageEngines(browser);
        break;
      case am.type("SEARCH_CYCLE_CURRENT_ENGINE_REQUEST"): {
        SearchProvider.search.cycleCurrentEngine(msg.data);
        let engine = SearchProvider.search.currentEngine;
        this.send(am.actions.Response("SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE", {currentEngine: engine}), worker);
        break;
      }
    }
  },

  _respondToExperimentsRequest({worker}) {
    this.send(am.actions.Response("EXPERIMENTS_RESPONSE", this._experimentProvider.data), worker);
  },

  /**
   * Handles changes to places
   */
  _handlePlacesChanges(eventName, data) {
    // note: this will execute for each of the 3 notifications that occur when
    // adding a visit: frecency:-1, frecency: real frecency, title
    if (this._populatingCache && !this._populatingCache.places) {
      this._asyncBuildPlacesCache();
    }

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
    this.broadcast(am.actions.Response("RECEIVE_CURRENT_ENGINE"), data);
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
    this._appURLHider.maybeHideURL(tabs.activeTab);
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
    SearchProvider.search.on("browser-search-engine-modified", this._handleCurrentEngineChanges);

    // This is a collection of handlers that receive messages from content
    this._contentToAddonHandlers = (msgName, args) => {
      // Log requests first so that the requests are logged before responses
      // in synchronous response cases.
      this._logPerfMeter(args);
      this._respondToUIChanges(args);
      this._respondToPlacesRequests(args);
      this._respondToSearchRequests(args);
      this._respondOpenWindow(args);
      this._prefsProvider.actionHandler(args);
    };
    this.on(CONTENT_TO_ADDON, this._contentToAddonHandlers);

    this._weightedHiglightsListeners = this._weightedHiglightsListeners.bind(this);
    simplePrefs.on("", this._weightedHiglightsListeners);
  },

  /**
   * Listen for changes to weighted highlights pref or associated options.
   *
   * @param {String} prefName - name of the pref that changed.
   * @private
   */
  _weightedHiglightsListeners(prefName) {
    // Update the feature weights only if we are doing weighted highlights.
    if (prefName === "weightedHighlightsCoefficients" && simplePrefs.prefs.weightedHighlights) {
      let highlightsCoefficients = this._loadWeightedHighlightsCoefficients();
      this._baselineRecommender.updateOptions({highlightsCoefficients});
    }
    if (prefName === "weightedHighlights") {
      this._loadRecommender();
    }
  },

  /**
   * Turns off various listeners for the pages
   */
  _removeListeners() {
    PLACES_CHANGES_EVENTS.forEach(event => PlacesProvider.links.off(event, this._handlePlacesChanges));
    SearchProvider.search.off("browser-search-engine-modified", this._handleCurrentEngineChanges);
    this.off(CONTENT_TO_ADDON, this._contentToAddonHandlers);
    simplePrefs.off("", this._weightedHiglightsListeners);
  },

  /**
   * Returns an object of functions with results cached
   */
  _get_memoized(cache) {
    let linksObj = PlacesProvider.links;
    return {
      getTopFrecentSites: cache.memoize("getTopFrecentSites", PlacesProvider.links.getTopFrecentSites.bind(linksObj)),
      getAllHistoryItems: cache.memoize("getAllHistoryItems", PlacesProvider.links.getAllHistoryItems.bind(linksObj)),
      getRecentBookmarks: cache.memoize("getRecentBookmarks", PlacesProvider.links.getRecentBookmarks.bind(linksObj)),
      getRecentLinks: cache.memoize("getRecentLinks", PlacesProvider.links.getRecentLinks.bind(linksObj)),
      getHighlightsLinks: cache.memoize("getHighlightsLinks", PlacesProvider.links.getHighlightsLinks.bind(linksObj)),
      getHistorySize: cache.memoize("getHistorySize", PlacesProvider.links.getHistorySize.bind(linksObj)),
      getBookmarksSize: cache.memoize("getBookmarksSize", PlacesProvider.links.getBookmarksSize.bind(linksObj))
    };
  },

  /**
   * Builds a places pageload cache
   *
   * Requires this._memoized to have been initialized.
   */
  _asyncBuildPlacesCache: Task.async(function*() {
    if (simplePrefs.prefs["query.cache"]) {
      if (this._populatingCache && !this._populatingCache.places) {
        this._populatingCache.places = true;
        let opt = {replace: true};
        yield Promise.all([
          this._memoized.getTopFrecentSites(opt),
          this._memoized.getRecentBookmarks(opt),
          this._memoized.getAllHistoryItems(opt),
          this._memoized.getRecentLinks(opt),
          this._memoized.getHighlightsLinks(opt),
          this._memoized.getHistorySize(opt),
          this._memoized.getBookmarksSize(opt)
        ]);
        this._populatingCache.places = false;
        Services.obs.notifyObservers(null, "activity-streams-places-cache-complete", null);
      }

      // Call myself when cache expires to repopulate.
      // This is needed because some of the queries are time dependent (for example,
      // highlights excludes links from the past 30 minutes).
      if (this._placesCacheTimeoutID) {
        clearTimeout(this._placesCacheTimeoutID);
      }
      this._placesCacheTimeoutID = setTimeout(() => {
        this._asyncBuildPlacesCache();
      }, this.options.placesCacheTimeout);
    }
  }),

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

  _setupButton() {
    this._button = ActionButton({
      id: "activity-streams-link",
      label: "Activity Stream",
      icon: data.url("content/img/list-icon.svg"),
      onClick: () => tabs.open(`${this.options.pageURL}#/timeline`)
    });
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
      prefService.set(HOME_PAGE_PREF, this._newTabURL);
    }
  },

  _unsetHomePage() {
    if (prefService.get(HOME_PAGE_PREF) === this._newTabURL) {
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
        `${baseUrl}#/timeline`,
        `${baseUrl}#/timeline/bookmarks`
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
      clearTimeout(this._placesCacheTimeoutID);
      if (this._newRecommendationTimeoutID) {
        clearTimeout(this._newRecommendationTimeoutID);
      }
      this._previewProvider.uninit();
      if (this._recommendationProvider) {
        this._recommendationProvider.uninit();
      }
      NewTabURL.reset();
      Services.prefs.clearUserPref("places.favicons.optimizeToDimension");
      this.workers.clear();
      this._removeListeners();
      this._pagemod.destroy();
      this._button.destroy();
      this._tabTracker.uninit();
      this._telemetrySender.uninit();
      this._appURLHider.uninit();
      this._perfMeter.uninit();
      this._memoizer.uninit();
      this._populatingCache = {places: false};
      this._prefsProvider.destroy();
      this._shareProvider.uninit(reason);
    };

    switch (reason) {
      // can be one of: uninstall/disable/shutdown/upgrade/downgrade
      case "disable":
      case "uninstall":
        this._tabTracker.handleUserEvent({event: reason});
        this._unsetHomePage();
        defaultUnload();
        break;
      default:
        defaultUnload();
    }
  }
};

exports.ActivityStreams = ActivityStreams;

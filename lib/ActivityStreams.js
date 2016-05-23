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
const {Memoizer} = require("lib/Memoizer");
const {PlacesProvider} = require("lib/PlacesProvider");
const {SearchProvider} = require("lib/SearchProvider");
const {TabTracker} = require("lib/TabTracker");
const {PreviewProvider} = require("lib/PreviewProvider");
const {TelemetrySender} = require("lib/TelemetrySender");
const {PerfMeter} = require("lib/PerfMeter");
const {AppURLHider} = require("lib/AppURLHider");
const am = require("common/action-manager");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/NewTabURL.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function() {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

const DEFAULT_OPTIONS = {
  pageURL: data.url("content/activity-streams.html"),
  onAddWorker: null,
  onRemoveWorker: null,
  previewCacheTimeout: 21600000, // every 6 hours, rebuild/repopulate the cache
};

function ActivityStreams(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  EventEmitter.decorate(this);

  this._setupPageMod();
  this._setupListeners();
  this._setupButton();
  NewTabURL.override(`${this.options.pageURL}#/`);

  this._appURLHider = new AppURLHider(this.appURLs);
  this._perfMeter = new PerfMeter(this.appURLs);

  this._memoizer = new Memoizer();
  this._memoized = this._get_memoized(this._memoizer);

  this._telemetrySender = new TelemetrySender();
  this._tabTracker = new TabTracker(this.appURLs, options.clientID, this._memoized);

  this._previewProvider = new PreviewProvider();
  this._populatingCache = {
    places: false,
    preview: false,
  };

  this._asyncBuildPlacesCache();

  this._asyncBuildPreviewCache();
  this._startPeriodicBuildPreviewCache(this.options.previewCacheTimeout);
}

ActivityStreams.prototype = {

  _pagemod: null,
  _button: null,
  _previewCacheTimeoutID: null,

  /**
   * Send a message to a worker
   */
  send(action, worker) {
    // if the function is async, the worker might not be there yet, or might have already disappeared
    try {
      worker.port.emit("addon-to-content", action);
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

  /**
   * Responds to places requests
   */
  _respondToPlacesRequests(msgName, params) {
    let {msg, worker} = params;
    const append = msg.meta && msg.meta.append;
    switch (msgName) {
      case am.type("TOP_FRECENT_SITES_REQUEST"):
        this._memoized.getTopFrecentSites(msg.data).then(links => {
          this._processAndSendLinks(links, "TOP_FRECENT_SITES_RESPONSE", append, worker);
        });
        break;
      case am.type("RECENT_BOOKMARKS_REQUEST"):
        this._memoized.getRecentBookmarks(msg.data).then(links => {
          this._processAndSendLinks(links, "RECENT_BOOKMARKS_RESPONSE", append, worker);
        });
        break;
      case am.type("RECENT_LINKS_REQUEST"):
        this._memoized.getRecentLinks(msg.data).then(links => {
          this._processAndSendLinks(links, "RECENT_LINKS_RESPONSE", append, worker);
        });
        break;
      case am.type("HIGHLIGHTS_LINKS_REQUEST"):
        this._memoized.getHighlightsLinks(msg.data).then(links => {
          this._processAndSendLinks(links, "HIGHLIGHTS_LINKS_RESPONSE", append, worker);
        });
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
    }
  },

  /*
   * Process the passed in links, save them, get from cache and response to content.
   */
  _processAndSendLinks(links, responseType, append, worker, previewsOnly = false) {
    let processedLinks = this._previewProvider.processLinks(links);
    this._previewProvider.asyncSaveLinks(processedLinks);
    const cachedLinks = this._previewProvider.getEnhancedLinks(processedLinks, previewsOnly);
    this.send(am.actions.Response(responseType, cachedLinks, {append}), worker);
  },

  _respondToSearchRequests(msgName, params) {
    let {msg, worker} = params;
    switch (msgName) {
      case am.type("SEARCH_STATE_REQUEST"):
        SearchProvider.search.state.then(state => {
          this.send(am.actions.Response("SEARCH_STATE_RESPONSE", state), worker);
        });
        break;
      case am.type("NOTIFY_PERFORM_SEARCH"):
        SearchProvider.search.state.then(state => {
          let win = windowMediator.getMostRecentWindow("navigator:browser");
          let gBrowser = win.getBrowser();
          let browser = gBrowser.selectedBrowser;
          let searchData = {
            engineName: state.currentEngine.name,
            searchString: msg.data,
            healthReportKey: "d",
            searchPurpose: "d"
          };
          SearchProvider.search.performSearch(browser, searchData);
        });
        break;
    }
  },

  /**
   * Handles changes to places
   */
  _handlePlacesChanges(eventName, data) {
    /* note: this will execute for each of the 3 notifications that occur
     * when adding a visit: frecency:-1, frecency: real frecency, title */
    if (this._populatingCache && !this._populatingCache.places) {
      this._asyncBuildPlacesCache();
    }

    if (eventName.startsWith("bookmark")) {
      this.broadcast(am.actions.Response("RECEIVE_BOOKMARKS_CHANGES", data));
    } else {
      this.broadcast(am.actions.Response("RECEIVE_PLACES_CHANGES", data));
    }
  },

  /*
   * Broadcast current engine has changed to all open newtab pages
   */
  _handleCurrentEngineChanges(eventName, data) {
    this.broadcast(am.actions.Response("RECEIVE_CURRENT_ENGINE"), data);
  },

  _handleUserEvent(eventName, data) {
    this._tabTracker.handleUserEvent(data.msg.data);
  },

  _onRouteChange(eventName, data) {
    if (data) {
      this._tabTracker.handleRouteChange(tabs.activeTab, data.msg.data);
    }
    this._appURLHider.maybeHideURL(tabs.activeTab);
  },

  /**
   * Sets up various listeners for the pages
   */
  _setupListeners() {
    this._handlePlacesChanges = this._handlePlacesChanges.bind(this);
    this._handleCurrentEngineChanges = this._handleCurrentEngineChanges.bind(this);
    this._respondToPlacesRequests = this._respondToPlacesRequests.bind(this);
    this._respondToSearchRequests = this._respondToSearchRequests.bind(this);
    this._onRouteChange = this._onRouteChange.bind(this);
    this._handleUserEvent = this._handleUserEvent.bind(this);
    PlacesProvider.links.on("deleteURI", this._handlePlacesChanges);
    PlacesProvider.links.on("clearHistory", this._handlePlacesChanges);
    PlacesProvider.links.on("linkChanged", this._handlePlacesChanges);
    PlacesProvider.links.on("manyLinksChanged", this._handlePlacesChanges);
    PlacesProvider.links.on("bookmarkAdded", this._handlePlacesChanges);
    PlacesProvider.links.on("bookmarkRemoved", this._handlePlacesChanges);
    PlacesProvider.links.on("bookmarkChanged", this._handlePlacesChanges);
    SearchProvider.search.on("browser-search-engine-modified", this._handleCurrentEngineChanges);

    this.on(am.type("TOP_FRECENT_SITES_REQUEST"), this._respondToPlacesRequests);
    this.on(am.type("HIGHLIGHTS_LINKS_REQUEST"), this._respondToPlacesRequests);
    this.on(am.type("RECENT_BOOKMARKS_REQUEST"), this._respondToPlacesRequests);
    this.on(am.type("RECENT_LINKS_REQUEST"), this._respondToPlacesRequests);
    this.on(am.type("NOTIFY_HISTORY_DELETE"), this._respondToPlacesRequests);
    this.on(am.type("NOTIFY_BLOCK_URL"), this._respondToPlacesRequests);
    this.on(am.type("NOTIFY_UNBLOCK_URL"), this._respondToPlacesRequests);
    this.on(am.type("NOTIFY_UNBLOCK_ALL"), this._respondToPlacesRequests);
    this.on(am.type("NOTIFY_BOOKMARK_DELETE"), this._respondToPlacesRequests);
    this.on(am.type("SEARCH_STATE_REQUEST"), this._respondToSearchRequests);
    this.on(am.type("NOTIFY_PERFORM_SEARCH"), this._respondToSearchRequests);
    this.on(am.type("NOTIFY_ROUTE_CHANGE"), this._onRouteChange);
    this.on(am.type("NOTIFY_USER_EVENT"), this._handleUserEvent);
  },

  /**
   * Turns off various listeners for the pages
   */
  _removeListeners() {
    PlacesProvider.links.off("deleteURI", this._handlePlacesChanges);
    PlacesProvider.links.off("clearHistory", this._handlePlacesChanges);
    PlacesProvider.links.off("linkChanged", this._handlePlacesChanges);
    PlacesProvider.links.off("manyLinksChanged", this._handlePlacesChanges);
    PlacesProvider.links.off("bookmarkAdded", this._handlePlacesChanges);
    PlacesProvider.links.off("bookmarkRemoved", this._handlePlacesChanges);
    PlacesProvider.links.off("bookmarkChanged", this._handlePlacesChanges);
    SearchProvider.search.off("browser-search-engine-modified", this._handleCurrentEngineChanges);

    this.off(am.type("TOP_FRECENT_SITES_REQUEST"), this._respondToPlacesRequests);
    this.off(am.type("RECENT_BOOKMARKS_REQUEST"), this._respondToPlacesRequests);
    this.off(am.type("RECENT_LINKS_REQUEST"), this._respondToPlacesRequests);
    this.off(am.type("NOTIFY_HISTORY_DELETE"), this._respondToPlacesRequests);
    this.off(am.type("NOTIFY_BLOCK_URL"), this._respondToPlacesRequests);
    this.off(am.type("NOTIFY_UNBLOCK_URL"), this._respondToPlacesRequests);
    this.off(am.type("NOTIFY_UNBLOCK_ALL"), this._respondToPlacesRequests);
    this.off(am.type("NOTIFY_BOOKMARK_DELETE"), this._respondToPlacesRequests);
    this.off(am.type("SEARCH_STATE_REQUEST"), this._respondToSearchRequests);
    this.off(am.type("NOTIFY_PERFORM_SEARCH"), this._respondToSearchRequests);
    this.off(am.type("NOTIFY_ROUTE_CHANGE"), this._onRouteChange);
    this.off(am.type("NOTIFY_USER_EVENT"), this._handleUserEvent);
  },

  /**
   * Returns an object of functions with results cached
   */
  _get_memoized(cache) {
    let linksObj = PlacesProvider.links;
    return {
      getTopFrecentSites: cache.memoize("getTopFrecentSites", PlacesProvider.links.getTopFrecentSites.bind(linksObj)),
      getRecentBookmarks: cache.memoize("getRecentBookmarks", PlacesProvider.links.getRecentBookmarks.bind(linksObj)),
      getRecentLinks: cache.memoize("getRecentLinks", PlacesProvider.links.getRecentLinks.bind(linksObj)),
      getHighlightsLinks: cache.memoize("getHighlightsLinks", PlacesProvider.links.getHighlightsLinks.bind(linksObj)),
      getHistorySize: cache.memoize("getHistorySize", PlacesProvider.links.getHistorySize.bind(linksObj)),
      getBookmarksSize: cache.memoize("getBookmarksSize", PlacesProvider.links.getBookmarksSize.bind(linksObj)),
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
            this._memoized.getRecentLinks(opt),
            this._memoized.getHighlightsLinks(opt),
            this._memoized.getHistorySize(opt),
            this._memoized.getBookmarksSize(opt),
        ]);
        this._populatingCache.places = false;
        Services.obs.notifyObservers(null, "activity-streams-places-cache-complete", null);
      }
    }
  }),

  /**
   * Builds a preview cache with links from a normal content page load
   */
  _asyncBuildPreviewCache: Task.async(function*() {
    if (this._populatingCache && !this._populatingCache.preview) {
      this._populatingCache.preview = true;
      let linksToSend = [];
      let promises = [];

      promises.push(PlacesProvider.links.getTopFrecentSites().then(links => {
        linksToSend.push(...links);
      }));

      promises.push(PlacesProvider.links.getRecentBookmarks().then(links => {
        linksToSend.push(...links);
      }));

      promises.push(PlacesProvider.links.getRecentLinks().then(links => {
        linksToSend.push(...links);
      }));

      promises.push(PlacesProvider.links.getHighlightsLinks().then(links => {
        linksToSend.push(...links);
      }));

      yield Promise.all(promises);
      linksToSend = this._previewProvider.processLinks(linksToSend);
      yield this._previewProvider.asyncSaveLinks(linksToSend);
      this._populatingCache.preview = false;
      Services.obs.notifyObservers(null, "activity-streams-previews-cache-complete", null);
    }
  }),

  /**
   * Set up preview cache to be repopulated every 6 hours
   */
  _startPeriodicBuildPreviewCache(previewCacheTimeout) {
    if (previewCacheTimeout) {
      // only set a timeout if a non-null value is provided otherwise this will
      // effectively be an infinite loop
      this._previewCacheTimeoutID = setTimeout(() => {
        this._asyncBuildPreviewCache();
        this._startPeriodicBuildPreviewCache(previewCacheTimeout);
      }, previewCacheTimeout);
    }
  },

  /**
   * Sets up communications with the pages and manages the lifecycle of workers
   */
  _setupPageMod() {
    // `this` here refers to the object instance
    this.workers = new Set();
    this._pagemod = new PageMod({
      include: [this.options.pageURL + "*"],
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

        worker.port.on("content-to-addon", msg => {
          if (!msg.type) {
            Cu.reportError("ActivityStreams.dispatch error: unknown message type");
            return;
          }
          // This detaches workers if a new url is launched
          // it is important to remove the worker from the set, otherwise we will leak memory
          if (msg.type === "pagehide") {
            this._removeWorker(worker);
          }
          this._perfMeter.log(worker.tab, msg.type, msg.data);
          this.emit(msg.type, {msg, worker});
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
      clearTimeout(this._previewCacheTimeoutID);
      this._previewProvider.uninit();
      NewTabURL.reset();
      this.workers.clear();
      this._removeListeners();
      this._pagemod.destroy();
      this._button.destroy();
      this._tabTracker.uninit();
      this._telemetrySender.uninit();
      this._appURLHider.uninit();
      this._perfMeter.uninit();
      this._memoizer.uninit();
      this._populatingCache = {
        places: false,
        preview: false,
      };
    };

    switch (reason){
      // can be one of: disable/shutdown/upgrade/downgrade
      case "disable":
        this._previewProvider.clearCache();
        defaultUnload();
        break;
      default:
        defaultUnload();
    }
  }
};

exports.ActivityStreams = ActivityStreams;

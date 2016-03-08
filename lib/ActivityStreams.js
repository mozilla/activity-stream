/* globals NewTabURL, EventEmitter, XPCOMUtils, windowMediator */

"use strict";

const {Cu} = require("chrome");
const {data} = require("sdk/self");
const {PageMod} = require("sdk/page-mod");
const {ActionButton} = require("sdk/ui/button/action");
const tabs = require("sdk/tabs");
const {PlacesProvider} = require("lib/PlacesProvider");
const {SearchProvider} = require("lib/SearchProvider");
const {TabTracker} = require("lib/TabTracker");
const {TelemetrySender} = require("lib/TelemetrySender");
const {AppURLHider} = require("lib/AppURLHider");
const am = require("content-src/actions/action-manager");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/NewTabURL.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function() {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

const DEFAULT_OPTIONS = {
  pageURL: data.url("content/activity-streams.html"),
  onAddWorker: null,
  onRemoveWorker: null
};

function ActivityStreams(options = {}) {
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);
  EventEmitter.decorate(this);

  this._setupPageMod();
  this._setupListeners();
  this._setupButton();
  NewTabURL.override(`${this.options.pageURL}#/`);
  if (this.options.telemetry) {
    this._telemetrySender = new TelemetrySender();
    this._tabTracker = new TabTracker(this.appURLs);
  }
  this._appURLHider = new AppURLHider(this.appURLs);
}

ActivityStreams.prototype = {

  _pagemod: null,
  _button: null,

  /**
   * Send a message to a worker
   */
  send(action, worker) {
    // if the function is async, the worker might not be there yet, or might have already disappeared
    try {
      worker.port.emit("addon-to-content", action);
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
    switch (msgName) {
      case am.type("TOP_FRECENT_SITES_REQUEST"):
        PlacesProvider.links.getTopFrecentSites(msg.data).then(links => {
          this.send(am.actions.Response("TOP_FRECENT_SITES_RESPONSE", links), worker);
        });
        break;
      case am.type("RECENT_BOOKMARKS_REQUEST"):
        PlacesProvider.links.getRecentBookmarks(msg.data).then(links => {
          this.send(am.actions.Response("RECENT_BOOKMARKS_RESPONSE", links), worker);
        });
        break;
      case am.type("RECENT_LINKS_REQUEST"):
        PlacesProvider.links.getRecentLinks(msg.data).then(links => {
          this.send(am.actions.Response("RECENT_LINKS_RESPONSE", links), worker);
        });
        break;
      case am.type("FRECENT_LINKS_REQUEST"):
        PlacesProvider.links.getFrecentLinks(msg.data).then(links => {
          this.send(am.actions.Response("FRECENT_LINKS_RESPONSE", links), worker);
        });
        break;
      case am.type("NOTIFY_HISTORY_DELETE"):
        PlacesProvider.links.deleteHistoryLink(msg.data);
        break;
    }
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
   * Broadcast places changes to pages
   */
  _handlePlacesChanges(eventName, data) {
    this.broadcast(am.actions.Response("RECEIVE_PLACES_CHANGES", data));
  },

  /**
   * Broadcast bookmark changes to pages
   */
  _handleBookmarkChanges(eventName, data) {
    this.broadcast(am.actions.Response("RECEIVE_BOOKMARKS_CHANGES", data));
  },

  /*
   * Broadcast current engine has changed to all open newtab pages
   */
  _handleCurrentEngineChanges(eventName, data) {
    this.broadcast(am.actions.Response("RECEIVE_CURRENT_ENGINE"), data);
  },

  _onRouteChange() {
    this._appURLHider.hideURL();
  },

  /**
   * Sets up various listeners for the pages
   */
  _setupListeners() {
    this._handlePlacesChanges = this._handlePlacesChanges.bind(this);
    this._handleBookmarkChanges = this._handleBookmarkChanges.bind(this);
    this._handleCurrentEngineChanges = this._handleCurrentEngineChanges.bind(this);
    this._respondToPlacesRequests = this._respondToPlacesRequests.bind(this);
    this._respondToSearchRequests = this._respondToSearchRequests.bind(this);
    this._onRouteChange = this._onRouteChange.bind(this);
    PlacesProvider.links.on("deleteURI", this._handlePlacesChanges);
    PlacesProvider.links.on("clearHistory", this._handlePlacesChanges);
    PlacesProvider.links.on("linkChanged", this._handlePlacesChanges);
    PlacesProvider.links.on("manyLinksChanged", this._handlePlacesChanges);
    PlacesProvider.links.on("bookmarkAdded", this._handleBookmarkChanges);
    PlacesProvider.links.on("bookmarkRemoved", this._handleBookmarkChanges);
    PlacesProvider.links.on("bookmarkChanged", this._handleBookmarkChanges);
    SearchProvider.search.on("browser-search-engine-modified", this._handleCurrentEngineChanges);

    this.on(am.type("TOP_FRECENT_SITES_REQUEST"), this._respondToPlacesRequests);
    this.on(am.type("RECENT_BOOKMARKS_REQUEST"), this._respondToPlacesRequests);
    this.on(am.type("RECENT_LINKS_REQUEST"), this._respondToPlacesRequests);
    this.on(am.type("NOTIFY_HISTORY_DELETE"), this._respondToPlacesRequests);
    this.on(am.type("SEARCH_STATE_REQUEST"), this._respondToSearchRequests);
    this.on(am.type("NOTIFY_PERFORM_SEARCH"), this._respondToSearchRequests);
    this.on(am.type("NOTIFY_ROUTE_CHANGE"), this._onRouteChange);
  },

  /**
   * Turns off various listeners for the pages
   */
  _removeListeners() {
    PlacesProvider.links.off("deleteURI", this._handlePlacesChanges);
    PlacesProvider.links.off("clearHistory", this._handlePlacesChanges);
    PlacesProvider.links.off("linkChanged", this._handlePlacesChanges);
    PlacesProvider.links.off("manyLinksChanged", this._handlePlacesChanges);
    PlacesProvider.links.off("bookmarkAdded", this._handleBookmarkChanges);
    PlacesProvider.links.off("bookmarkRemoved", this._handleBookmarkChanges);
    PlacesProvider.links.off("bookmarkChanged", this._handleBookmarkChanges);
    SearchProvider.search.off("browser-search-engine-modified", this._handleCurrentEngineChanges);

    this.off(am.type("TOP_FRECENT_SITES_REQUEST"), this._respondToPlacesRequests);
    this.off(am.type("RECENT_BOOKMARKS_REQUEST"), this._respondToPlacesRequests);
    this.off(am.type("RECENT_LINKS_REQUEST"), this._respondToPlacesRequests);
    this.off(am.type("NOTIFY_HISTORY_DELETE"), this._respondToPlacesRequests);
    this.off(am.type("SEARCH_STATE_REQUEST"), this._respondToSearchRequests);
    this.off(am.type("NOTIFY_PERFORM_SEARCH"), this._respondToSearchRequests);
    this.off(am.type("NOTIFY_ROUTE_CHANGE"), this._onRouteChange);
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
    this.workers.add(worker);
    if (this.options.onAddWorker) {
      this.options.onAddWorker();
    }
  },

  _removeWorker(worker) {
    this.workers.delete(worker);
    if (this.options.onRemoveWorker) {
      this.options.onRemoveWorker();
    }
  },

  /**
   * Removes a worker and calls callback if defined
   */
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

  /**
   * Unload the application
   */
  unload(reason) { // eslint-disable-line no-unused-vars
    switch (reason){
      // can be one of: uninstall/disable/shutdown/upgrade/downgrade
      default:
        NewTabURL.reset();
        this.workers.clear();
        this._removeListeners();
        this._pagemod.destroy();
        this._button.destroy();
        if (this._tabTracker) {
          this._tabTracker.uninit();
          this._telemetrySender.uninit();
        }
        this._appURLHider.uninit();
    }
  }
};

exports.ActivityStreams = ActivityStreams;

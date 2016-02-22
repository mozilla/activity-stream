/* globals NewTabURL, EventEmitter, XPCOMUtils, Services */

"use strict";

const {Ci,Cu} = require("chrome");
const {data} = require("sdk/self");
const {PageMod} = require("sdk/page-mod");
const {ActionButton} = require("sdk/ui/button/action");
const tabs = require("sdk/tabs");
const {PlacesProvider} = require("lib/PlacesProvider");
const am = require("content-src/actions/action-manager");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/NewTabURL.jsm");

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
  this._hideAppURLs();
  NewTabURL.override(this.options.pageURL);
}

ActivityStreams.prototype = {

  _pagemod: null,
  _button: null,

  /**
   * Send a message to a worker
   */
  send(action, worker) {
    worker.port.emit("addon-to-content", action);
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
      case am.type("NOTIFY_HISTORY_DELETE"):
        PlacesProvider.Links.deleteHistoryLink(msg.data);
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

  /**
   * Sets up various listeners for the pages
   */
  _setupListeners() {
    PlacesProvider.links.on("deleteURI", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("clearHistory", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("linkChanged", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("manyLinksChanged", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("bookmarkAdded", this._handleBookmarkChanges.bind(this));
    PlacesProvider.links.on("bookmarkRemoved", this._handleBookmarkChanges.bind(this));
    PlacesProvider.links.on("bookmarkChanged", this._handleBookmarkChanges.bind(this));

    this.on(am.type("TOP_FRECENT_SITES_REQUEST"), this._respondToPlacesRequests.bind(this));
    this.on(am.type("RECENT_BOOKMARKS_REQUEST"), this._respondToPlacesRequests.bind(this));
    this.on(am.type("RECENT_LINKS_REQUEST"), this._respondToPlacesRequests.bind(this));
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

    this.off(am.type("TOP_FRECENT_SITES_REQUEST"), this._respondToPlacesRequests);
    this.off(am.type("RECENT_BOOKMARKS_REQUEST"), this._respondToPlacesRequests);
    this.off(am.type("RECENT_LINKS_REQUEST"), this._respondToPlacesRequests.bind(this));
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
            Cu.reportError(`ActivityStreams.dispatch error: unknown message type`);
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
      ];
    }
    return this._appURLs;
  },

  /**
   * Add the app urls to the hidden pages of the passed in window.
   */
  _addHiddenURLsTo(window) {
    if (window.gInitialPages) {
      window.gInitialPages.push(...this.appURLs);
    }
  },

  /**
   * Watches for new windows and adds our urls to the list of hidden awesomebar
   * URLs.
   */
  _windowObserver: {
    observe: (chromeWindow, topic) => {
      if (topic === "domwindowopened") {
        let window = chromeWindow;
        window.QueryInterface(Ci.nsIDOMWindow).addEventListener("DOMContentLoaded", {
          handleEvent: () => {
            this._addHiddenURLsTo(window);
          }
        }, false);
      }
    }
  },

  /**
   * Adds our urls to the list of hidden awesomebar URLs of each open window and
   * sets up an observer for new windows that are opened.
   */
  _hideAppURLs() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
      let window = enumerator.getNext();
      this._addHiddenURLsTo(window);
    }

    Services.ww.registerNotification(this._windowObserver);
  },

  /**
   * Unload the application
   */
  unload(reason) { // eslint-disable-line no-unused-vars
    switch (reason){
      // can be one of: uninstall/disable/shutdown/upgrade/downgrade
      default:
        this.workers.clear();
        this._removeListeners();
        this._pagemod.destroy();
        this._button.destroy();
        Services.ww.unregisterNotification(this._windowObserver);
    }
  }
};

exports.ActivityStreams = ActivityStreams;

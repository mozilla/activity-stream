/* globals NewTabURL, EventEmitter, XPCOMUtils */

"use strict";

const {Cu} = require("chrome");
const {data} = require("sdk/self");
const {PageMod} = require("sdk/page-mod");
const {PlacesProvider} = require("lib/PlacesProvider");
const am = require("content-src/actions/action-manager");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/NewTabURL.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", function () {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

const DEFAULT_OPTIONS = {
  pageURL: data.url("content/activity-streams.html")
};

function ActivityStreams(options = {}) {
  console.debug(`ActivityStreams.init`);
  this.options = Object.assign({}, DEFAULT_OPTIONS, options);

  EventEmitter.decorate(this);

  this._setupPageMod();
  this._setupListeners();
  NewTabURL.override(this.options.pageURL);
};

ActivityStreams.prototype = {

  _pagemod: null,

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
    PlacesProvider.links.getTopFrecentSites(msg.data).then(links => {
      this.send(am.actions.Response("TOP_FRECENT_SITES_RESPONSE", links), worker);
    });
  },


  /**
   * Broadcast places changes to pages
   */
  _handlePlacesChanges(eventName, data) {
    this.broadcast(am.actions.Response("RECEIVE_PLACES_CHANGES", data));
  },

  /**
   * Sets up various listeners for the pages
   */
  _setupListeners() {
    PlacesProvider.links.on("deleteURI", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("clearHistory", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("linkChanged", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("manyLinksChanged", this._handlePlacesChanges.bind(this));

    this.on(am.type("TOP_FRECENT_SITES_REQUEST"), this._respondToPlacesRequests.bind(this));
  },

  /**
   * Turns off various listeners for the pages
   */
  _removeListeners() {
    PlacesProvider.links.off("deleteURI", this._handlePlacesChanges);
    PlacesProvider.links.off("clearHistory", this._handlePlacesChanges);
    PlacesProvider.links.off("linkChanged", this._handlePlacesChanges);
    PlacesProvider.links.off("manyLinksChanged", this._handlePlacesChanges);

    this.off(am.type("TOP_FRECENT_SITES_REQUEST"), this._respondToPlacesRequests);
  },

  /**
   * Sets up communications with the pages and manages the lifecycle of workers
   */
  _setupPageMod() {
    // `this` here refers to the object instance
    this.workers = new Set();
    this._pagemod = new PageMod({
      include: [this.options.pageURL],
      contentScriptFile: data.url("content-bridge.js"),
      contentScriptWhen: "start",
      attachTo: "top",
      onAttach: worker => {
        // add the worker to a set to enable broadcasting
        if (!this.workers.has(worker)) {
          this.workers.add(worker);
        }

        worker.port.on("content-to-addon", msg => {
          if (!msg.type) {
            console.warn(`ActivityStreams.dispatch error: unknown message type`);
            return;
          }
          // it is important to remove the worker from the set, otherwise we will leak memory
          if (msg.type === "pagehide") {
            console.debug(`ActivityStreams.pagemod unloading worker`);
            this.workers.delete(worker);
          }
          this.emit(msg.type, {msg, worker});
        });
      },
      onError: err => {
        console.error(err);
      }
    });
  },

  /**
   * Unload the application
   */
  unload(reason) { // eslint-disable-line no-unused-vars
    console.debug(`ActivityStreams.unload on ${reason}`);

    switch (reason){
      // can be one of: uninstall/disable/shutdown/upgrade/downgrade
      default:
        this.workers.clear();
        this._removeListeners();
        this._pagemod.destroy();
    }
  }
};

exports.ActivityStreams = ActivityStreams;

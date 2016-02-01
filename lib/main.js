/* globals NewTabURL */

"use strict";

const {Cu} = require('chrome');
const {data} = require('sdk/self');
const {PageMod} = require('sdk/page-mod');
const {storage} = require('sdk/simple-storage');
const {uuid} = require('sdk/util/uuid');
const {PlacesProvider} = require('lib/PlacesProvider');

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource:///modules/NewTabURL.jsm");

// Generate a UUID for this client, if we don't have one yet.
if (!storage.clientUUID) {
  storage.clientUUID = uuid();
}

let ActivityStreams = function(options) {
  console.debug(`ActivityStreams.init`);

  this.options = options;
  this.workers = new Set();
  this.pageURL = data.url("content/activity-streams.html");
  this._setupPageMod();
  this._setupListeners();

  NewTabURL.override(this.pageURL);
};

ActivityStreams.prototype = {

  pageMod: null,

  /**
   * Send a message to a worker
   */
  send(actionName, msg, worker) {
    worker.port.emit('addon-to-content', {
      type: actionName,
      data: msg
    });
  },

  /**
   * Broadcast a message to all workers
   */
  broadcast(actionName, msg) {
    for (let worker of this.workers) {
      this.send(actionName, msg, worker);
    }
  },

  /**
   * Dispatches messages from content to the appropriate handlers
   */
  dispatch(msg, worker) {
    if (!msg.type) {
      console.warn(`ActivityStreams.dispatch error: unknown message type`);
      return;
    }
    console.debug(`ActivityStreams.dispatch msg_received type: ${msg.type}`);

    switch(msg.type) {
      case "REQUEST_TOP_FRECENT_SITES":
        PlacesProvider.links.getTopFrecentSites(msg.data).then(links => {
          this.send("RECEIVE_TOP_FRECENT_SITES", links, worker);
        });
        break;
    }
  },

  /**
   * Broadcast places changes to pages
   */
  _handlePlacesChanges(eventName, data) {
    this.broadcast("RECEIVE_PLACES_CHANGES", {
      "event": eventName,
      "data": data
    });
  },

  /**
   * Sets up various listeners for the pages
   */
  _setupListeners() {
    PlacesProvider.links.on("deleteURI", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("clearHistory", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("linkChanged", this._handlePlacesChanges.bind(this));
    PlacesProvider.links.on("manyLinksChanged", this._handlePlacesChanges.bind(this));
  },

  /**
   * Turns off various listeners for the pages
   */
  _removeListeners() {
    PlacesProvider.links.off("deleteURI", this._handlePlacesChanges);
    PlacesProvider.links.off("clearHistory", this._handlePlacesChanges);
    PlacesProvider.links.off("linkChanged", this._handlePlacesChanges);
    PlacesProvider.links.off("manyLinksChanged", this._handlePlacesChanges);
  },

  /**
   * Sets up communications with the pages
   */
  _setupPageMod() {
    this.pagemod = new PageMod({
      include: [this.pageURL],
      contentScriptFile: data.url("content-bridge.js"),
      contentScriptWhen: 'start',
      attachTo: 'top',
      onAttach: worker => {
        if (!app.workers.has(worker)) {
          app.workers.add(worker);
        }
        worker.port.on('content-to-addon', msg => {
          if (msg.type && msg.type === 'pagehide') {
            console.debug(`ActivityStreams.pagemod unloading worker`);
            app.workers.delete(worker);
          }
          app.dispatch(msg, worker);
        });
      }
    });
  },

  /**
   * Unload the application
   */
  unload(reason) { // eslint-disable-line no-unused-vars
    console.debug(`ActivityStreams.unload on ${reason}`);

    if(reason == "shutdown") {
      // handle browser shutdown
    } else {
      // for all other reasons: uninstall/disable/upgrade/downgrade
      this.workers.clear();
    }
    this._removeListeners();
  }
};

let app;

exports.main = function(options) {
  PlacesProvider.links.init();
  app = new ActivityStreams(options);
};

exports.onUnload = function(reason) {
  if(app) {
    app.unload(reason);
  PlacesProvider.links.uninit();
  }
};

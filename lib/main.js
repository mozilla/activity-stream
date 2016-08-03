/* globals Task, ClientID */

const {PlacesProvider} = require("lib/PlacesProvider");
const {SearchProvider} = require("lib/SearchProvider");
const {MetadataStore} = require("lib/MetadataStore");
const {ActivityStreams} = require("lib/ActivityStreams");
const {setTimeout, clearTimeout} = require("sdk/timers");
const {Cu} = require("chrome");

Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/Task.jsm");

// The constant to set the limit of MetadataStore reconnection
// The addon will try reconnecting to the database in the next minute periodically,
// if it fails to establish the connection in the addon initialization
const kMaxConnectRetry = 120;

let app = null;
let metadataStore = null;
let connectRetried = 0;

Object.assign(exports, {
  main(options) {

    // options.loadReason can be install/enable/startup/upgrade/downgrade
    PlacesProvider.links.init();
    SearchProvider.search.init();
    options.telemetry = false;

    Task.spawn(function*() {
      options.clientID = yield ClientID.getClientID();
      metadataStore = new MetadataStore();
      try {
        yield metadataStore.asyncConnect();
      } catch (e) {
        this.reconnectMetadataStore();
      }
      app = new ActivityStreams(metadataStore, options);
    }.bind(this));
  },

  reconnectMetadataStore() {
    if (connectRetried > kMaxConnectRetry) {
      throw new Error("Metadata store reconnecting has reached the maximum limit");
    }

    this.reconnectTimeoutID = setTimeout(function() {
      metadataStore.asyncConnect().then(() => {connectRetried = 0;})
      .catch(error => {
        // increment the connect counter to avoid the endless retry
        connectRetried++;
        this.reconnectMetadataStore();
      });
    }.bind(this), 500);
  },

  onUnload(reason) {
    if (app) {
      app.unload(reason);
      app = null;
    }

    if (this.reconnectTimeoutID) {
      clearTimeout(this.reconnectTimeoutID);
    }

    if (metadataStore) {
      if (reason === "uninstall" || reason === "disable") {
        metadataStore.asyncTearDown();
      } else {
        metadataStore.asyncClose();
      }
    }

    PlacesProvider.links.uninit();
    SearchProvider.search.uninit();
  }
});

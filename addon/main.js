/* globals Task, ClientID */
"use strict";

const {PlacesProvider} = require("addon/PlacesProvider");
const {MetadataStore, METASTORE_NAME} = require("addon/MetadataStore");
const {MetadataCache} = require("addon/MetadataCache");
const {TelemetrySender} = require("addon/TelemetrySender");
const {TabTracker} = require("addon/TabTracker");
const {ActivityStreams} = require("addon/ActivityStreams");
const {setTimeout, clearTimeout} = require("sdk/timers");
const {Cu} = require("chrome");

Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/Task.jsm");
const {OS} = Cu.import("resource://gre/modules/osfile.jsm", {});

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
    options.telemetry = false;

    Task.spawn(function*() {
      const clientID = yield ClientID.getClientID();
      options.clientID = clientID;
      const tabTracker = new TabTracker(clientID);
      const telemetrySender = new TelemetrySender();

      if (options.loadReason === "upgrade") {
        yield this.migrateMetadataStore();
      }
      metadataStore = new MetadataStore();
      try {
        yield metadataStore.asyncConnect();
      } catch (e) {
        this.reconnectMetadataStore();
      }
      app = new ActivityStreams(metadataStore, tabTracker, telemetrySender, options);
      try {
        app.init();
      } catch (e) {
        Cu.reportError(e);
      }
    }.bind(this));
  },

  /*
   * Attempts to move the old version of metadata store to the root profile directory.
   * If the move fails, remove the old one
   */
  migrateMetadataStore: Task.async(function*() {
    const sourcePath = OS.Path.join(OS.Constants.Path.localProfileDir, METASTORE_NAME);
    const destPath = OS.Path.join(OS.Constants.Path.profileDir, METASTORE_NAME);

    const exists = yield OS.File.exists(sourcePath);
    if (exists) {
      try {
        yield OS.File.move(sourcePath, destPath);
      } catch (e) {
        Cu.reportError(`Failed to move metadata store: ${e.message}. Removing the database file`);
        yield OS.File.remove(sourcePath);
      }
    }
  }),

  reconnectMetadataStore() {
    if (connectRetried > kMaxConnectRetry) {
      throw new Error("Metadata store reconnecting has reached the maximum limit");
    }

    this.reconnectTimeoutID = setTimeout(() => {
      metadataStore.asyncConnect().then(() => {connectRetried = 0;})
        .catch(error => {
          // increment the connect counter to avoid the endless retry
          connectRetried++;
          this.reconnectMetadataStore();
        });
    }, 500);
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

    MetadataCache.cache.uninit();
    PlacesProvider.links.uninit();
  }
});

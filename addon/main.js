/* globals Task, ClientID */
"use strict";

const {PlacesProvider} = require("addon/PlacesProvider");
const {MetadataStore, METASTORE_NAME} = require("addon/MetadataStore");
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
const metadataExpiryInterval = 30 * 60 * 1000; // 30 minutes

let app = null;
let metadataStore = null;
let connectRetried = 0;
let reconnectTimeoutID = null;

Object.assign(exports, {
  main(options) {
    // options.loadReason can be install/enable/startup/upgrade/downgrade
    PlacesProvider.links.init();
    options.telemetry = false;

    Task.spawn(function*() {
      const clientID = yield ClientID.getClientID();
      options.clientID = clientID;
      const tabTracker = new TabTracker(options);
      const telemetrySender = new TelemetrySender();

      if (options.loadReason === "upgrade") {
        yield this.migrateMetadataStore();
      }
      metadataStore = new MetadataStore();
      try {
        yield metadataStore.asyncConnect();
        metadataStore.enableDataExpiryJob(metadataExpiryInterval);
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

    reconnectTimeoutID = setTimeout(() => {
      metadataStore.asyncConnect().then(() => {
        metadataStore.enableDataExpiryJob(metadataExpiryInterval);
        connectRetried = 0;
      }).catch(error => {
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

    if (reconnectTimeoutID) {
      clearTimeout(reconnectTimeoutID);
      reconnectTimeoutID = null;
    }

    if (metadataStore) {
      metadataStore.disableDataExpiryJob();
      if (reason === "uninstall" || reason === "disable") {
        metadataStore.asyncTearDown();
      } else {
        metadataStore.asyncClose();
      }
    }

    PlacesProvider.links.uninit();
  }
});

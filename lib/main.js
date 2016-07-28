/* globals Task, ClientID */

const {PlacesProvider} = require("lib/PlacesProvider");
const {SearchProvider} = require("lib/SearchProvider");
const {MetadataStore} = require("lib/MetadataStore");
const {ActivityStreams} = require("lib/ActivityStreams");
const {Cu} = require("chrome");

Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/Task.jsm");

let app = null;
let metadataStore = null;

Object.assign(exports, {
  main(options) {

    // options.loadReason can be install/enable/startup/upgrade/downgrade
    PlacesProvider.links.init();
    SearchProvider.search.init();
    options.telemetry = false;

    Task.spawn(function*() {
      options.clientID = yield ClientID.getClientID();
      metadataStore = new MetadataStore();
      yield metadataStore.asyncConnect();
      app = new ActivityStreams(metadataStore, options);
    }.bind(this));
  },

  onUnload(reason) {
    if (app) {
      app.unload(reason);
      if (reason === "uninstall" || reason === "disable") {
        metadataStore.asyncTearDown();
      }
      app = null;
    }
    metadataStore.asyncClose();
    PlacesProvider.links.uninit();
    SearchProvider.search.uninit();
  }
});

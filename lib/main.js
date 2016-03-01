const {storage} = require("sdk/simple-storage");
const {uuid} = require("sdk/util/uuid");
const {PlacesProvider} = require("lib/PlacesProvider");
const {ActivityStreams} = require("lib/ActivityStreams");

// Generate a UUID for this client, if we don't have one yet.
if (!storage.clientUUID) {
  storage.clientUUID = uuid();
}

var app = null;

Object.assign(exports, {
  main(options) {

    // options.loadReason can be install/enable/startup/upgrade/downgrade
    PlacesProvider.links.init();
    options.telemetry = false;
    app = new ActivityStreams(options);
  },

  onUnload(reason) {
    if (app) {
      app.unload(reason);
      app = null;
    }
    PlacesProvider.links.uninit();
  }
});

const {storage} = require("sdk/simple-storage");
const {uuid} = require("sdk/util/uuid");
const {PlacesProvider} = require("lib/PlacesProvider");
const {ActivityStreams} = require("lib/ActivityStreams");

// Generate a UUID for this client, if we don't have one yet.
if (!storage.clientUUID) {
  storage.clientUUID = uuid();
}

exports = {
  app: null,

  main(options) {
    // options.loadReason can be install/enable/startup/upgrade/downgrade
    PlacesProvider.links.init();
    exports.app = new ActivityStreams(options);
  },

  onUnload(reason) {
    if(exports.app) {
      exports.app.unload(reason);
    }
    PlacesProvider.links.uninit();
  }
};

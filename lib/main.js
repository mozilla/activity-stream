/* globals Task, ClientID */

const {PlacesProvider} = require("lib/PlacesProvider");
const {SearchProvider} = require("lib/SearchProvider");
const {ActivityStreams} = require("lib/ActivityStreams");
const {Cu} = require("chrome");

Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/Task.jsm");

const PING_ENDPOINT = "https://onyx_tiles.stage.mozaws.net/v3/links/activity-stream";

let app = null;

Object.assign(exports, {
  main(options) {

    // options.loadReason can be install/enable/startup/upgrade/downgrade
    PlacesProvider.links.init();
    SearchProvider.search.init();
    options.telemetry = false;

    Task.spawn(function*() {
      options.clientID = yield ClientID.getClientID();
      options.pingEndpoint = PING_ENDPOINT;
      app = new ActivityStreams(options);
    }.bind(this));
  },

  onUnload(reason) {
    if (app) {
      app.unload(reason);
      app = null;
    }
    PlacesProvider.links.uninit();
    SearchProvider.search.uninit();
  }
});

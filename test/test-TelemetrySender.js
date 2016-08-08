/* globals Services, Locale */
"use strict";

const {Cu, CC} = require("chrome");
const {before, after} = require("sdk/test/utils");
const {getTestActivityStream} = require("./lib/utils");
const {Loader} = require("sdk/test/loader");
const loader = Loader(module);
const self = require("sdk/self");
const httpd = loader.require("./lib/httpd");
const simplePrefs = require("sdk/simple-prefs");

Cu.import("resource://gre/modules/Locale.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");

const port = 8088;
let app;

const samplePing = JSON.stringify({
  url: "resource://activity-streams/data/content/activity-streams.html#/",
  tab_id: "-3-2",
  unload_reason: "close",
  client_id: "b8abfda8-0c57-9b48-af8b-c5ef87b2b673",
  session_duration: 10,
  addon_version: self.version,
  load_reason: "other",
  source: "other",
  locale: Locale.getLocale()
});

exports.test_TelemetrySender_init = function(assert, done) {
  assert.ok(app._telemetrySender._pingEndpoint, "The ping endpoint is set");

  let srv = httpd.startServerAsync(port);

  srv.registerPathHandler("/activity-streams", function handle(request, response) {
    let BinaryInputStream = CC("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream", "setInputStream");
    let count = request.bodyInputStream.available();
    let body = new BinaryInputStream(request.bodyInputStream).readBytes(count);

    assert.equal(samplePing, body, "Server receives expected request");

    srv.stop(done);
  });

  Services.obs.notifyObservers(null, "tab-session-complete", samplePing);
};

exports.test_TelemetrySender_prefs = function(assert) {
  simplePrefs.prefs.telemetry = false;
  assert.ok(!app._telemetrySender.enabled, "telemetry is disabled");

  simplePrefs.prefs.telemetry = true;
  assert.ok(app._telemetrySender.enabled, "telemetry is enabled");

  simplePrefs.prefs["performance.log"] = true;
  assert.ok(app._telemetrySender.logging, "logging is enabled");

  let testEndpoint = "https://example.com/";
  simplePrefs.prefs["telemetry.ping.endpoint"] = testEndpoint;
  assert.equal(app._telemetrySender._pingEndpoint, testEndpoint, "expected ping endpoint received");
};

before(exports, function() {
  simplePrefs.prefs.telemetry = true;
  simplePrefs.prefs["performance.log"] = false;
  simplePrefs.prefs["telemetry.ping.endpoint"] = `http://localhost:${port}/activity-streams`;
  app = getTestActivityStream();
});

after(exports, function() {
  app.unload();
});

require("sdk/test").run(exports);

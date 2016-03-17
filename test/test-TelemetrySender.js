/* globals Services */
"use strict";

const {Cu, CC} = require("chrome");
const {before, after} = require("sdk/test/utils");
const {ActivityStreams} = require("lib/ActivityStreams");
const {Loader} = require("sdk/test/loader");
const loader = Loader(module);
const httpd = loader.require("./lib/httpd");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/ClientID.jsm");

const port = 8088;
let app;

const samplePing = JSON.stringify({
  url: "resource://activity-streams/data/content/activity-streams.html#/",
  tab_id: "-3-2",
  unload_reason: "close",
  client_id: "b8abfda8-0c57-9b48-af8b-c5ef87b2b673",
  session_duration: 10
});

exports.test_TelemetrySender_init = function(assert, done) {
  assert.ok(app.options.pingEndpoint, "The ping endpoint is set");

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

before(exports, function*() {
  app = new ActivityStreams({
    pingEndpoint: "http://localhost:" + port + "/activity-streams",
    telemetry: true,
  });
});

after(exports, function() {
  app.unload();
});

require("sdk/test").run(exports);

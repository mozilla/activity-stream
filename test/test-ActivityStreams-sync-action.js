"use strict";

const {Cu} = require("chrome");
const test = require("sdk/test");
const {getTestActivityStream} = require("./lib/utils");
const {before, after} = require("sdk/test/utils");

Cu.import("resource://gre/modules/Services.jsm");

let app;

exports["test sync complete triggers a SYNC_COMPLETE action"] = function(assert, done) {
  app._store.dispatch = function(action) {
    if (action.type === "SYNC_COMPLETE") {
      done();
    }
  };
  Services.obs.notifyObservers(null, "services.sync.tabs.changed", null);
};

before(exports, () => {
  app = getTestActivityStream();
});

after(exports, () => {
  app.unload();
});

test.run(exports);

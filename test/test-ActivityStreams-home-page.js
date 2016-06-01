"use strict";

const test = require("sdk/test");
const prefService = require("sdk/preferences/service");
const {ActivityStreams} = require("lib/ActivityStreams");

exports["test activity stream loads on home page when appropriate"] = function*(assert) {
  let url = "http://foo.bar/baz";
  let app = new ActivityStreams({pageURL: url});

  // By default, the home page should be set to ActivityStream.
  assert.equal(url + "#/", prefService.get("browser.startup.homepage"));

  // Unload ActivityStream and it should be unset.
  app.unload();
  assert.ok(!prefService.isSet("browser.startup.homepage"));

  // If the pref is already overriden, ActivityStream shouldn't change it.
  prefService.set("browser.startup.homepage", "https://example.com");
  app = new ActivityStreams({pageURL: url});
  assert.equal("https://example.com", prefService.get("browser.startup.homepage"));
  app.unload();
  assert.equal("https://example.com", prefService.get("browser.startup.homepage"));
};

test.run(exports);

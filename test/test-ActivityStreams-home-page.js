"use strict";

const test = require("sdk/test");
const {getTestActivityStream} = require("./lib/utils");
const prefService = require("sdk/preferences/service");
const ss = require("sdk/simple-storage");

exports["test activity stream loads on home page when appropriate"] = function(assert) {
  prefService.reset("browser.startup.homepage");
  let url = "http://foo.bar/baz";
  let app = getTestActivityStream({pageURL: url});

  // By default, the home page should be set to ActivityStream.
  assert.equal(`${url}#/`, prefService.get("browser.startup.homepage"));

  // Unload ActivityStream and the home page should still be ours.
  app.unload();
  assert.equal(`${url}#/`, prefService.get("browser.startup.homepage"));

  // Unload ActivityStream with reason="disable" and it should be unset.
  app = getTestActivityStream({pageURL: url});
  app.unload("disable");
  assert.ok(!prefService.isSet("browser.startup.homepage"));

  // If the pref is already overriden, ActivityStream shouldn't change it.
  prefService.set("browser.startup.homepage", "https://example.com");
  app = getTestActivityStream({pageURL: url});
  assert.equal("https://example.com", prefService.get("browser.startup.homepage"));
  app.unload("disable");
  assert.equal("https://example.com", prefService.get("browser.startup.homepage"));

  // If we override the pref and the user changes it back to about:home,
  // ActivityStream shouldn't change it on next load.
  prefService.reset("browser.startup.homepage");
  ss.storage.homepageOverriden = true;
  app = getTestActivityStream({pageURL: url});
  assert.ok(!prefService.isSet("browser.startup.homepage"));
  app.unload();
  assert.ok(!prefService.isSet("browser.startup.homepage"));
};

test.run(exports);

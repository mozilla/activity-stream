"use strict";

const {before} = require("sdk/test/utils");
const {PlacesProvider} = require("addon/PlacesProvider");
const simplePrefs = require("sdk/simple-prefs");

exports["test blocklist init"] = function(assert) {
  let blockedURLs;

  blockedURLs = new PlacesProvider.BlockedURLs("test.blocklist");
  assert.equal(blockedURLs.size, 0, "blocked set is initialized empty");
  assert.deepEqual(blockedURLs.items(), [], "blocked items is empty");

  simplePrefs.prefs["test.blocklist"] = JSON.stringify(["foo"]);
  blockedURLs = new PlacesProvider.BlockedURLs("test.blocklist");
  assert.equal(blockedURLs.size, 1, "blocked set is initialized from pref");
  assert.ok(blockedURLs.has("foo"), "blocked set contains pref content");
  assert.deepEqual(blockedURLs.items(), ["foo"], "foo is in blocked items");

  simplePrefs.prefs["test.blocklist"] = JSON.stringify(1);
  blockedURLs = new PlacesProvider.BlockedURLs("test.blocklist");
  assert.equal(blockedURLs.size, 0, "blocked set is initialized empty");
  assert.deepEqual(blockedURLs.items(), [], "blocked items is empty");
  assert.equal(simplePrefs.prefs["test.blocklist"], "[]", "cleared pref is found");
};

exports["test blocklist basic functions"] = function(assert) {
  let blockedURLs;

  simplePrefs.prefs["test.blocklist"] = JSON.stringify(["foo"]);
  blockedURLs = new PlacesProvider.BlockedURLs("test.blocklist");
  assert.equal(blockedURLs.size, 1, "blocked set is initialized from pref");
  assert.ok(blockedURLs.has("foo"), "blocked set contains pref content");
  assert.deepEqual(blockedURLs.items(), ["foo"], "expected blocked item is present");

  blockedURLs.save("bar");
  assert.equal(blockedURLs.size, 2, "blocked set size has grown");
  assert.deepEqual(blockedURLs.items(), ["foo", "bar"], "expected items blocked");
  assert.equal(simplePrefs.prefs["test.blocklist"], "[\"foo\",\"bar\"]", "expected pref is found");

  blockedURLs.save("bar");
  assert.equal(blockedURLs.size, 2, "adding an existing item doesn't grow the set");

  blockedURLs.remove("bar");
  assert.equal(blockedURLs.size, 1, "blocked set is initialized from pref");
  assert.ok(!blockedURLs.has("bar"), "blocked set contains pref content");
  assert.deepEqual(blockedURLs.items(), ["foo"], "only one item present");
  assert.equal(simplePrefs.prefs["test.blocklist"], "[\"foo\"]", "expected pref is found");

  blockedURLs.remove("bar");
  assert.equal(blockedURLs.size, 1, "removing inexisting item doesn't change the set");

  blockedURLs.clear();
  assert.equal(blockedURLs.size, 0, "blocked set is initialized empty");
  assert.deepEqual(blockedURLs.items(), [], "blocked items is empty");
  assert.equal(simplePrefs.prefs["test.blocklist"], "[]", "cleared pref is found");
};

before(exports, () => {
  simplePrefs.prefs["test.blocklist"] = JSON.stringify([]);
});

require("sdk/test").run(exports);

"use strict";

const {after} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");

const {MetadataCache} = require("lib/MetadataCache.js");

const fixtures = [
  {desc: "It shuold hit", key: "foo", getKey: "foo", value: 123},
  {desc: "It should miss", key: "bar", getKey: "nope", value: null},
  {desc: "It should overwrite", key: "foo", getKey: "foo", value: 100}
];

const gMetadataCache = new MetadataCache();

exports.test_cache_get = function*(assert) {
  for (let fixture of fixtures) {
    gMetadataCache.add(fixture.key, fixture.value);
    let val = gMetadataCache.get(fixture.getKey);
    assert.equal(fixture.value, val, fixture.desc);
  }
  assert.equal(gMetadataCache.length, 2);
};

exports.test_cache_remove = function*(assert) {
  for (let fixture of fixtures) {
    gMetadataCache.add(fixture.key, fixture.value);
  }
  gMetadataCache.remove("nonsence");
  assert.equal(gMetadataCache.length, 2, "It should remove anything if the to-be-removed key is missing");

  gMetadataCache.remove("foo");
  assert.ok(!gMetadataCache.get("foo"), "It should have removed the given key");
};

exports.test_cache_removeoldest = function*(assert) {
  gMetadataCache.removeOldest();
  assert.ok(!gMetadataCache.length, 0, "It should not remove anything if the cache is empty");

  for (let fixture of fixtures) {
    gMetadataCache.add(fixture.key, fixture.value);
  }
  gMetadataCache.removeOldest();
  assert.ok(!gMetadataCache.get("bar"), "It should removed this key as the oldest one");
};

exports.test_pref_change = function*(assert) {
  simplePrefs.prefs["metadata-store.query.cache"] = false;
  for (let fixture of fixtures) {
    gMetadataCache.add(fixture.key, fixture.value);
  }
  assert.ok(!gMetadataCache.length, "It should not add anything if the cache pref is off");

  simplePrefs.prefs["metadata-store.query.cache"] = true;
  for (let fixture of fixtures) {
    gMetadataCache.add(fixture.key, fixture.value);
  }
  assert.equal(gMetadataCache.length, 2, "It should cache results if the cache pref is on");
};

// exports.test_cache_evict = function*(assert) {
  // let ticked = 0;
  // const oldQuota = simplePrefs.prefs["as-simple-storage.quota"];

  // simplePrefs.prefs["as-simple-storage.quota"] = 10;
  // const cache = new MetadataCache();
  // for (let fixture of fixtures) {
    // cache.add(fixture.key, fixture.value);
  // }
  // yield waitUntil(function() {
    // if (cache.length == 1 || ticked++ > 5) {
      // return true;
    // }
    // return false;
  // }, 1000);
  // assert.equal(cache.length, 1, "It should have evicted items if it reaches the quota");
  // simplePrefs.prefs["as-simple-storage.quota"] = oldQuota;
// };

after(exports, function() {
  gMetadataCache.reset();
});

require("sdk/test").run(exports);

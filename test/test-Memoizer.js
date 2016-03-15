"use strict";

const {before, after} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");
const {Memoizer} = require("lib/Memoizer");

let gInitialCachePref = simplePrefs.prefs["query.cache"];
let gMemoizer;

exports.test_memoizer = function*(assert) {
  let count = 0;
  let testFunc = () => {
    return ++count;
  };
  let func = gMemoizer.memoize("testKey", testFunc);
  assert.equal(func(), 1, "test function executes");
  assert.equal(func(), 1, "cached result is obtained");

  gMemoizer.invalidateMemos(["testKey"]);
  assert.equal(func(), 2, "test function executes");
  assert.equal(func(), 2, "cached result is obtained");
};

exports.test_memoizer_prefs = function*(assert) {
  simplePrefs.prefs["query.cache"] = false;
  let count = 0;
  let testFunc = () => {
    return ++count;
  };
  let func = gMemoizer.memoize("testKey", testFunc);
  assert.equal(func(), 1, "test function executes");
  assert.equal(func(), 2, "test function executes");

  simplePrefs.prefs["query.cache"] = true;
  assert.equal(func(), 2, "cached result is obtained");
};

exports.test_memoizer_simple_params = function*(assert) {
  let count = 0;
  let testFunc = factor => {
    count++;
    return count * factor;
  };
  let func = gMemoizer.memoize("testKey", testFunc);
  assert.equal(func(1), 1, "test function executes");
  assert.equal(func(1), 1, "cached result is obtained");
  assert.equal(func(2), 4, "cache takes into account arguments");
  assert.equal(func(2), 4, "cached result is obtained");
};

exports.test_memoizer_object_params = function*(assert) {
  let count = 0;
  let testFunc = options => {
    count++;
    return count * options.factor;
  };
  let func = gMemoizer.memoize("testKey", testFunc);
  assert.equal(func({factor: 1}), 1, "test function executes");
  assert.equal(func({factor: 1}), 1, "cached result is obtained");
  assert.equal(func({factor: 2}), 4, "cache takes into account arguments");
  assert.equal(func({factor: 2}), 4, "cached result is obtained");
};

before(exports, function*() {
  gMemoizer = new Memoizer();
  simplePrefs.prefs["query.cache"] = true;
});

after(exports, function*() {
  gMemoizer.uninit();
  simplePrefs.prefs["query.cache"] = gInitialCachePref || false;
});

require("sdk/test").run(exports);

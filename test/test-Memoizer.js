"use strict";

const {before, after} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");
const {Memoizer} = require("addon/Memoizer");

let gInitialCachePref = simplePrefs.prefs["query.cache"];
let gMemoizer;

exports.test_memoizer = function*(assert) {
  let count = 0;
  let testFunc = () => ++count;
  let func = gMemoizer.memoize("testKey", testFunc);
  let result;

  result = yield func();
  assert.equal(result, 1, "test function executes");

  result = yield func();
  assert.equal(result, 1, "cached result is obtained");

  gMemoizer.invalidateMemos(["testKey"]);
  result = yield func();
  assert.equal(result, 2, "test function executes");

  result = yield func();
  assert.equal(result, 2, "cached result is obtained");
};

exports.test_memoizer_replace_opt = function*(assert) {
  let count = 0;
  let testFunc = () => ++count;
  let func = gMemoizer.memoize("testKey", testFunc);
  let result;

  result = yield func();
  assert.equal(result, 1, "test function executes");

  result = yield func();
  assert.equal(result, 1, "cached result is obtained");

  result = yield func({replace: true});
  assert.equal(result, 2, "test function executes");

  result = yield func();
  assert.equal(result, 2, "cached result is obtained");
};

exports.test_memoizer_replace_opt_sub_key = function*(assert) {
  let count = 0;
  let testFunc = () => ++count;
  let func = gMemoizer.memoize("testKey", testFunc);
  let result;

  result = yield func("sub-key");
  assert.equal(result, 1, "test function executes");

  result = yield func("sub-key");
  assert.equal(result, 1, "cached result is obtained");

  result = yield func("sub-key", {replace: true});
  assert.equal(result, 2, "test function executes");

  result = yield func("sub-key");
  assert.equal(result, 2, "cached result is obtained");
};

exports.test_memoizer_prefs = function*(assert) {
  simplePrefs.prefs["query.cache"] = false;
  let count = 0;
  let testFunc = () => ++count;
  let func = gMemoizer.memoize("testKey", testFunc);
  let result;

  result = yield func();
  assert.equal(result, 1, "test function executes");

  result = yield func();
  assert.equal(result, 2, "test function executes");

  simplePrefs.prefs["query.cache"] = true;
  result = yield func();
  assert.equal(result, 2, "cached result is obtained");
};

exports.test_memoizer_simple_params = function*(assert) {
  let count = 0;
  let testFunc = factor => {
    count++;
    return count * factor;
  };
  let func = gMemoizer.memoize("testKey", testFunc);
  let result;

  result = yield func(1);
  assert.equal(result, 1, "test function executes");

  result = yield func(1);
  assert.equal(result, 1, "cached result is obtained");

  result = yield func(2);
  assert.equal(result, 4, "cache takes into account arguments");

  result = yield func(2);
  assert.equal(result, 4, "cached result is obtained");
};

exports.test_memoizer_object_params = function*(assert) {
  let count = 0;
  let testFunc = options => {
    count++;
    return count * options.factor;
  };
  let func = gMemoizer.memoize("testKey", testFunc);
  let result;

  result = yield func({factor: 1});
  assert.equal(result, 1, "test function executes");

  result = yield func({factor: 1});
  assert.equal(result, 1, "cached result is obtained");

  result = yield func({factor: 2});
  assert.equal(result, 4, "cache takes into account arguments");

  result = yield func({factor: 2});
  assert.equal(result, 4, "cached result is obtained");
};

before(exports, () => {
  gMemoizer = new Memoizer();
  gMemoizer.reset();
  simplePrefs.prefs["query.cache"] = true;
});

after(exports, () => {
  gMemoizer.uninit();
  simplePrefs.prefs["query.cache"] = gInitialCachePref || false;
});

require("sdk/test").run(exports);

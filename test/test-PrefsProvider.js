const test = require("sdk/test");
const {PrefsProvider} = require("addon/PrefsProvider");
const {getTestActivityStream} = require("./lib/utils");
const simplePrefs = require("sdk/simple-prefs");

const as = getTestActivityStream();

exports["test PrefsProvider instance and initializes"] = assert => {
  assert.ok(as._prefsProvider, "has .prefsProvider");
  assert.ok(as._prefsProvider instanceof PrefsProvider, "is a PrefsProvider instance");
  assert.ok(as._prefsProvider.onPrefChange, "onPrefChange listener was addded");
};

exports["test PrefsProvider has the right simplePrefs"] = assert => {
  assert.equal(as._prefsProvider.simplePrefs, simplePrefs);
};

exports["test PrefsProvider unloads"] = assert => {
  as.unload();
  assert.equal(as._prefsProvider.onPrefChange, null, ".destroy is called");
};

test.run(exports);

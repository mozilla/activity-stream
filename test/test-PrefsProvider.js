const test = require("sdk/test");
const {PrefsProvider} = require("lib/PrefsProvider");
const {getTestActivityStream} = require("./lib/utils");
const simplePrefs = require("sdk/simple-prefs");

const as = getTestActivityStream();

exports["test PrefsProvider instance and initializes"] = assert => {
  assert.ok(as.prefsProvider, "has .prefsProvider");
  assert.ok(as.prefsProvider instanceof PrefsProvider, "is a PrefsProvider instance");
  assert.ok(as.prefsProvider.onPrefChange, "onPrefChange listener was addded");
};

exports["test PrefsProvider has the right simplePrefs"] = assert => {
  assert.equal(as.prefsProvider.simplePrefs, simplePrefs);
};

exports["test PrefsProvider unloads"] = assert => {
  as.unload();
  assert.equal(as.prefsProvider.onPrefChange, null, ".destroy is called");
};

test.run(exports);

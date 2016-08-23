const test = require("sdk/test");
const {getTestActivityStream} = require("./lib/utils");

const as = getTestActivityStream();

exports["test PrefsProvider instance and initializes"] = assert => {
  assert.ok(as._prefsProvider, "has .prefsProvider");
  assert.ok(as._prefsProvider.onPrefChange, "onPrefChange listener was addded");
};

exports["test PrefsProvider unloads"] = assert => {
  as.unload();
  assert.equal(as._prefsProvider.onPrefChange, null, ".destroy is called");
};

test.run(exports);

/* globals XPCOMUtils */

"use strict";
const {Cu} = require("chrome");
const {before, after} = require("sdk/test/utils");
const test = require("sdk/test");
const {getTestActivityStream} = require("./lib/utils");
const simplePrefs = require("sdk/simple-prefs");
const {PlacesProvider} = require("lib/PlacesProvider");
const {PreviewProvider} = require("lib/PreviewProvider");
const {makeCachePromise, makeCountingCachePromise} = require("./lib/cachePromises");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "NetUtil",
                                  "resource://gre/modules/NetUtil.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

let gInitialCachePref = simplePrefs.prefs["query.cache"];
let gPreviewProvider;

exports["test preview cache repopulation works"] = function*(assert) {
  let placesCachePromise;
  let previewsCachePromise;

  placesCachePromise = makeCachePromise("places");
  previewsCachePromise = makeCachePromise("previews");
  let app = getTestActivityStream({previewCacheTimeout: 100});
  yield placesCachePromise;
  yield previewsCachePromise;

  let expectedRepopulations = 3;
  let previewsCountPromise = makeCountingCachePromise("previews", expectedRepopulations);
  let numRepopulations = yield previewsCountPromise;

  assert.equal(numRepopulations, expectedRepopulations, "preview cache successfully repopulated periodically");
  app.unload();
};

exports["test places cache repopulation works"] = function*(assert) {
  let placesCachePromise = makeCachePromise("places");
  let app = getTestActivityStream({placesCacheTimeout: 100});
  yield placesCachePromise;

  let expectedRepopulations = 3;
  let placesCountPromise = makeCountingCachePromise("places", expectedRepopulations);
  let numRepopulations = yield placesCountPromise;

  assert.equal(numRepopulations, expectedRepopulations, "places cache successfully repopulated periodically");
  app.unload();
};

before(exports, function*() {
  simplePrefs.prefs["query.cache"] = true;
  PlacesProvider.links.init();
  gPreviewProvider = new PreviewProvider({initFresh: true});
});

after(exports, function() {
  gPreviewProvider.clearCache();
  gPreviewProvider.uninit();
  PlacesProvider.links.uninit();
  simplePrefs.prefs["query.cache"] = gInitialCachePref || false;
});

test.run(exports);

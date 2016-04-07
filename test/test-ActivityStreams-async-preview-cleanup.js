/* globals XPCOMUtils, Services */

"use strict";
const {Cu} = require("chrome");
const {before, after} = require("sdk/test/utils");
const test = require("sdk/test");
const simplePrefs = require("sdk/simple-prefs");
const {ActivityStreams} = require("lib/ActivityStreams");
const {PlacesProvider} = require("lib/PlacesProvider");
const {PreviewProvider} = require("lib/PreviewProvider");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "NetUtil",
                                  "resource://gre/modules/NetUtil.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

let gInitialCachePref = simplePrefs.prefs["query.cache"];
let gPreviewProvider;

let makeCachePromise = (name) => {
  return new Promise(resolve => {
    let precacheNotif = `activity-streams-${name}-cache-complete`;
    let waitForCache = (subject, topic, data) => {
      if (topic === precacheNotif) {
        Services.obs.removeObserver(waitForCache, precacheNotif);
        resolve();
      }
    };
    Services.obs.addObserver(waitForCache, precacheNotif);
  });
};

let makeCountingCachePromise = (name, target) => {
  return new Promise(resolve => {
    let count = 0;
    let precacheNotif = `activity-streams-${name}-cache-complete`;
    let waitForCache = (subject, topic, data) => {
      if (topic === precacheNotif) {
        count++;
        if (count === target) {
          Services.obs.removeObserver(waitForCache, precacheNotif);
          resolve(count);
        }
      }
    };
    Services.obs.addObserver(waitForCache, precacheNotif);
  });
};

exports["test preview cache invalidation works"] = function*(assert) {
  let placesCachePromise;
  let previewsCachePromise;

  placesCachePromise = makeCachePromise("places");
  previewsCachePromise = makeCachePromise("previews");
  let app = new ActivityStreams({previewCacheTimeout: 100});
  yield placesCachePromise;
  yield previewsCachePromise;

  let expectedInvalidations = 3;
  let previewsCountPromise = makeCountingCachePromise("previews", expectedInvalidations);
  let numInvalidations = yield previewsCountPromise;

  assert.equal(numInvalidations, expectedInvalidations, "preview cache successfully invalidated periodically");
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

/* globals require, exports, Services */

"use strict";

const {before, after} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");
const {Loader} = require("sdk/test/loader");
const loader = Loader(module);
const httpd = loader.require("./lib/httpd");
const ss = require("sdk/simple-storage");
const {Cu} = require("chrome");
const {PreviewProvider} = require("lib/PreviewProvider");
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const DISALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const URL_FILTERS = [
  (item) => !!item.url,
  (item) => !!(new URL(item.url)),
  (item) => ALLOWED_PROTOCOLS.has(new URL(item.url).protocol),
  (item) => !DISALLOWED_HOSTS.has(new URL(item.url).hostname)
];

Cu.importGlobalProperties(["URL"]);
Cu.import("resource://gre/modules/Services.jsm");

const gPort = 8089;
let gPreviewProvider;
let gPrefEmbedly = simplePrefs.prefs["embedly.endpoint"];
let gPrefEnabled = simplePrefs.prefs["previews.enabled"];

exports.test_cache_invalidation = function*(assert) {
  let currentTime = Date.now();
  let twoDaysAgo = currentTime - (2 * 24 * 60 * 60 * 1000);
  ss.storage.embedlyData.item_1 = {accessTime: twoDaysAgo};
  ss.storage.embedlyData.item_2 = {accessTime: currentTime};
  assert.equal(Object.keys(ss.storage.embedlyData).length, 2, "items set");
  gPreviewProvider.cleanUpCache();
  assert.equal(Object.keys(ss.storage.embedlyData).length, 1, "items cleaned up");
};

exports.test_periodic_cleanup = function*(assert) {
  let oldTimeout = gPreviewProvider.options.cacheTimeout;
  gPreviewProvider.options.cacheTimeout = 50;
  let countingCleanupPromise = new Promise(resolve => {
    let notif = "activity-streams-preview-cache-cleanup";
    let count = 0;
    let waitForNotif = (subject, topic, data) => {
      if (topic === notif) {
        count++;
        if (count === 3) {
          Services.obs.removeObserver(waitForNotif, notif);
          resolve(count);
        }
      }
    };
    Services.obs.addObserver(waitForNotif, notif);
  });
  gPreviewProvider.startPeriodicCleanup();
  let count = yield countingCleanupPromise;
  assert.equal(count, 3, "cleanup called expected number of times");
  gPreviewProvider.options.cacheTimeout = oldTimeout;
};

exports.test_filter_urls = function*(assert) {
  const fakeData = {
    get validLinks() {
      return [
        {"url": "http://foo.com/","title": "blah"},
        {"url": "https://www.foo.com/","title": "blah"},
        {"url": "hTTp://fOo.com/","title": "blah"},
        {"url": "http://localhost-foo.com", "title": "blah"}
      ];
    },
    get invalidLinks() {
      return [
        {"url": "","title": "blah"},
        {"url": "ftp://foo.com/","title": "blah"},
        {"url": "garbage://foo.com/","title": "blah"},
        {"url": "HTTP://localhost:8080/","title": "blah"},
        {"url": "http://127.0.0.1","title": "blah"},
        {"url": "http://0.0.0.0","title": "blah"},
        {"url": null, "title": "blah"}
      ];
    },
  };

  // all valid urls should be allowed through the filter and should be returned
  const goodUrls = fakeData.validLinks.filter(gPreviewProvider._URLFilter(URL_FILTERS));
  goodUrls.forEach((item, i) => assert.deepEqual(item, fakeData.validLinks[i], `${item} is a valid url`));

  // all invalid urls should be removed from the list of urls
  const badUrls = fakeData.invalidLinks.filter(gPreviewProvider._URLFilter(URL_FILTERS));
  assert.deepEqual(badUrls, [], "all bad links are removed");
};

exports.test_sanitize_urls = function*(assert) {
  let sanitizedUrl = gPreviewProvider._sanitizeURL(null);
  assert.equal(sanitizedUrl, "", "if an empty url is passed, return the empty string");

  // the URL object throws if it is given a malformed url
  assert.throws(() => URL("foo.com"), "malformed URL");

  // remove any query parameter that is not in the whitelist
  let safeQuery = "http://www.foobar.com/?id=300&p=firefox&search=mozilla&q=query";
  sanitizedUrl = gPreviewProvider._sanitizeURL("http://www.foobar.com/?id=300&p=firefox&user=garbage&pass=trash&search=mozilla&foo=bar&q=query");
  assert.ok(safeQuery, sanitizedUrl, "removed any bad params and keep allowed params");

  // remove extra slashes and relative paths
  let removeSlashes = "http://www.foobar.com/foo/bar/foobar";
  sanitizedUrl = gPreviewProvider._sanitizeURL("http://www.foobar.com///foo////bar//foobar/");
  assert.equal(removeSlashes, sanitizedUrl, "removed extra slashes in pathname");
  let normalizePath = "http://www.foobar.com/foo/foobar/quuz.html";
  sanitizedUrl = gPreviewProvider._sanitizeURL("http://www.foobar.com/../foo/bar/../foobar/./quuz.html");
  assert.equal(normalizePath, sanitizedUrl, "normalized the pathname");

  // remove any sensitive information passed with basic auth
  let sensitiveUrl = "https://localhost.biz/";
  sanitizedUrl = gPreviewProvider._sanitizeURL("https://user:pass@localhost.biz/");
  assert.equal(sanitizedUrl.username, undefined, "removed username field");
  assert.equal(sanitizedUrl.password, undefined, "removed password field");
  assert.equal(sensitiveUrl, sanitizedUrl, "removed sensitive information from url");

  // remove the hash
  let removeHash = "http://www.foobar.com/";
  sanitizedUrl = gPreviewProvider._sanitizeURL("http://www.foobar.com/#id=20");
  assert.equal(removeHash, sanitizedUrl, "removed hash field");
};

exports.test_dedupe_urls = function*(assert) {
  const fakeData = [
    {"url": "http://foo.com/","title": "blah"},
    {"url": "http://www.foo.com/","title": "blah"},
    {"url": "https://foo.com/","title": "blah"},
    {"url": "http://foo.com/bar/foobar","title": "blah"},
    {"url": "http://foo.com/bar////foobar","title": "blah"},
    {"url": "https://www.foo.com/?q=param","title": "blah"},
    {"url": "hTTp://fOo.com/","title": "blah"},
    {"url": "http://localhost-foo.com", "title": "blah"}
  ];

  // dedupe a set of sanitized links while maintaining their original url
  let uniqueLinks = gPreviewProvider._uniqueLinks(fakeData);
  let expectedUrls = [
    {"url": "http://foo.com/","title": "blah"},
    {"url": "http://foo.com/bar/foobar","title": "blah"},
    {"url": "http://localhost-foo.com", "title": "blah"}
  ];

  uniqueLinks.forEach((link, i) => {
    assert.ok(link.sanitizedURL, "each site has a 'sanitizedURL' field");
    assert.ok(link.cacheKey, "each site has a 'cacheKey' field");
    assert.ok(link.url, "each site has it's original url");
    assert.equal(link.url, expectedUrls[i].url, "links have been deduped");
  });
};

exports.test_mock_embedly_request = function*(assert) {
  const fakeSite = {
    "url": "http://example.com/",
    "title": null,
    "lastVisitDate": 1459537019061,
    "frecency": 2000,
    "favicon": null,
    "bookmarkDateCreated": 1459537019061,
    "type": "history",
    "sanitizedURL": "http://example.com/",
    "cacheKey": "example.com/"
  };
  const fakeData = [fakeSite];
  const fakeDataCached = {"urls": {
    "http://example.com/": {
      "title": null,
      "lastVisitDate": 1459537019000,
      "frecency": 1000,
      "favicon": null,
      "type": "history",
      "embedlyMetaData": "some embedly metadata",
      "sanitizedURL": "http://example.com/",
      "cacheKey": "example.com/"
    }
  }};

  assert.ok(gPreviewProvider._embedlyEndpoint, "The embedly endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  srv.registerPathHandler("/embedlyLinkData", function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeDataCached));
  });

  yield gPreviewProvider._asyncFetchAndCache(fakeData);

  assert.ok(ss.storage.embedlyData[fakeDataCached.urls["http://example.com/"].cacheKey], "the cache created an entry with the cache key");
  assert.deepEqual(ss.storage.embedlyData[fakeDataCached.urls["http://example.com/"].cacheKey].embedlyMetaData, "some embedly metadata", "the cache saved the embedly data");
  assert.ok(ss.storage.embedlyData[fakeDataCached.urls["http://example.com/"].cacheKey].accessTime, "the cached saved a time stamp");

  let cachedLinks = gPreviewProvider.getCachedLinks(fakeData);
  assert.equal(cachedLinks[0].lastVisitDate, fakeSite.lastVisitDate, "getCachedLinks should prioritize new data");
  assert.equal(cachedLinks[0].bookmarkDateCreated, fakeSite.bookmarkDateCreated, "getCachedLinks should prioritize new data");
  assert.ok(cachedLinks.some(e => e.cacheKey === ss.storage.embedlyData[fakeDataCached.urls["http://example.com/"].cacheKey].cacheKey), "the cached link is now retrieved next time");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

before(exports, function*() {
  simplePrefs.prefs["embedly.endpoint"] = `http://localhost:${gPort}/embedlyLinkData`;
  simplePrefs.prefs["previews.enabled"] = true;
  gPreviewProvider = new PreviewProvider({initFresh: true});
});

after(exports, function*() {
  simplePrefs.prefs["embedly.endpoint"] = gPrefEmbedly;
  simplePrefs.prefs["previews.enabled"] = gPrefEnabled;
  gPreviewProvider.clearCache();
  gPreviewProvider.uninit();
});

require("sdk/test").run(exports);

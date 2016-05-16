/* globals require, exports, Services, NetUtil */

"use strict";

const {before, after} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");
const self = require("sdk/self");
const {Loader} = require("sdk/test/loader");
const {setTimeout} = require("sdk/timers");
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
Cu.import("resource://gre/modules/NetUtil.jsm");

const gPort = 8089;
let gPreviewProvider;
let gPrefEmbedly = simplePrefs.prefs["embedly.endpoint"];
let gPrefEnabled = simplePrefs.prefs["previews.enabled"];

exports.test_cache_invalidation = function*(assert) {
  let currentTime = Date.now();
  let fortyDaysAgo = currentTime - (40 * 24 * 60 * 60 * 1000);
  ss.storage.embedlyData.item_1 = {accessTime: fortyDaysAgo};
  ss.storage.embedlyData.item_2 = {accessTime: currentTime};
  assert.equal(Object.keys(ss.storage.embedlyData).length, 2, "items set");
  gPreviewProvider.cleanUpCacheMaybe(true);
  assert.equal(Object.keys(ss.storage.embedlyData).length, 1, "items cleaned up");
};

exports.test_enabling = function*(assert) {
  assert.equal(Object.keys(ss.storage.embedlyData).length, 0, "empty object");
  simplePrefs.prefs["previews.enabled"] = false;
  assert.equal(ss.storage.embedlyData, undefined, "embedlyData is undefined");
  simplePrefs.prefs["previews.enabled"] = true;
  assert.equal(Object.keys(ss.storage.embedlyData).length, 0, "empty object");
};

exports.test_access_update = function*(assert) {
  let currentTime = Date.now();
  let twoDaysAgo = currentTime - (2 * 24 * 60 * 60 * 1000);
  ss.storage.embedlyData.item_1 = {accessTime: twoDaysAgo};
  gPreviewProvider.getEnhancedLinks([{cacheKey: "item_1"}]);
  assert.ok(ss.storage.embedlyData.item_1.accessTime > twoDaysAgo, "access time is updated");
};

exports.test_long_hibernation = function*(assert) {
  let currentTime = Date.now();
  let fortyDaysAgo = currentTime - (40 * 24 * 60 * 60 * 1000);
  ss.storage.embedlyData.item_1 = {accessTime: fortyDaysAgo};
  gPreviewProvider.getEnhancedLinks([{cacheKey: "item_1"}]);
  assert.ok(ss.storage.embedlyData.item_1.accessTime >= currentTime, "access time is updated");
};

exports.test_periodic_cleanup = function*(assert) {
  let oldThreshold = gPreviewProvider.options.cacheCleanupPeriod;
  gPreviewProvider.options.cacheCleanupPeriod = 30;

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

  let countingRunsPromise = new Promise(resolve => {
    let runCount = 0;
    let periodicCleanups = () => {
      setTimeout(() => {
        gPreviewProvider.cleanUpCacheMaybe();
        runCount++;
        if (runCount >= 6) {
          resolve(runCount);
        } else {
          periodicCleanups();
        }
      }, 20);
    };
    periodicCleanups();
  });

  let values = yield Promise.all([countingRunsPromise, countingCleanupPromise]);
  assert.equal(JSON.stringify(values), JSON.stringify([6, 3]), "expected counts are obtained");
  gPreviewProvider.options.cacheCleanupPeriod = oldThreshold;
};

exports.test_periodic_update = function*(assert) {
  let oldTimeout = gPreviewProvider.options.cacheUpdateInterval;
  gPreviewProvider.options.cacheUpdateInterval = 10;

  // cycle enabled pref to reset timeouts
  simplePrefs.prefs["previews.enabled"] = false;
  simplePrefs.prefs["previews.enabled"] = true;

  let countingUpdatePromise = new Promise(resolve => {
    let notif = "activity-streams-preview-cache-update";
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
  let count = yield countingUpdatePromise;
  assert.equal(count, 3, "update called expected number of times");
  gPreviewProvider.options.cacheUpdateInterval = oldTimeout;
};

exports.test_update_links = function*(assert) {
  let currentTime = Date.now();
  let fourDaysAgo = currentTime - (4 * 24 * 60 * 60 * 1000);
  ss.storage.embedlyData["example.com/1"] = {url: "http://example.com/1", accessTime: fourDaysAgo, sanitizedURL: "http://example.com/1", cacheKey: "example.com/1"};
  ss.storage.embedlyData["example.com/2"] = {url: "http://example.com/2", accessTime: fourDaysAgo, refreshTime: fourDaysAgo, sanitizedURL: "http://example.com/2", cacheKey: "example.com/2"};
  ss.storage.embedlyData["example.com/3"] = {url: "http://example.com/3", accessTime: currentTime, refreshTime: currentTime, sanitizedURL: "http://example.com/3", cacheKey: "example.com/3"};

  assert.ok(gPreviewProvider._embedlyEndpoint, "The embedly endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  srv.registerPathHandler("/embedlyLinkData", function handle(request, response) {
    let data = JSON.parse(
        NetUtil.readInputStreamToString(
          request.bodyInputStream,
          request.bodyInputStream.available()
        )
    );
    data.urls.forEach(link => assert.notEqual(link, null, "there are no null links"));
    let urls = {};
    for (let url of data.urls) {
      urls[url] = {"embedlyMetaData": "some embedly metadata"};
    }
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify({urls}));
  });
  yield gPreviewProvider.asyncUpdateLinks();

  assert.equal(ss.storage.embedlyData["example.com/1"].accessTime, fourDaysAgo, "link 1 access time is unchanged");
  assert.ok(ss.storage.embedlyData["example.com/1"].refreshTime, "link 1 refresh time is set");
  assert.equal(ss.storage.embedlyData["example.com/2"].accessTime, fourDaysAgo, "link 2 access time is unchanged");
  assert.notEqual(ss.storage.embedlyData["example.com/2"].refreshTime, fourDaysAgo, "link 2 refresh time is updated");
  assert.equal(ss.storage.embedlyData["example.com/3"].accessTime, currentTime, "link 3 access time is unchanged");
  assert.equal(ss.storage.embedlyData["example.com/3"].refreshTime, currentTime, "link 3 refresh time is unchanged");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_only_request_links_once = function*(assert) {
  const msg1 = [{"url": "a.com", "sanitizedURL": "a.com", "cacheKey": "a.com"},
                {"url": "b.com", "sanitizedURL": "b.com", "cacheKey": "b.com"},
                {"url": "c.com", "sanitizedURL": "c.com", "cacheKey": "c.com"}];

  const msg2 = [{"url": "b.com", "sanitizedURL": "b.com", "cacheKey": "b.com"},
                {"url": "c.com", "sanitizedURL": "c.com", "cacheKey": "c.com"},
                {"url": "d.com", "sanitizedURL": "d.com", "cacheKey": "d.com"}];

  assert.ok(gPreviewProvider._embedlyEndpoint, "The embedly endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  let urlsRequested = {};
  srv.registerPathHandler("/embedlyLinkData", function handle(request, response) {
    let data = JSON.parse(
        NetUtil.readInputStreamToString(
          request.bodyInputStream,
          request.bodyInputStream.available()
        )
    );
    data.urls.forEach(url => urlsRequested[url] = (urlsRequested[url] + 1) || 1);
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify({"urls": {urlsRequested}}));
  });

  gPreviewProvider.asyncSaveLinks(msg1);
  yield gPreviewProvider.asyncSaveLinks(msg2);

  for (let url in urlsRequested) {
    assert.equal(urlsRequested[url], 1, "URL was requested only once");
  }

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_filter_urls = function*(assert) {
  const fakeData = {
    get validLinks() {
      return [
        {"url": "http://foo.com/", "title": "blah"},
        {"url": "https://www.foo.com/", "title": "blah"},
        {"url": "hTTp://fOo.com/", "title": "blah"},
        {"url": "http://localhost-foo.com", "title": "blah"}
      ];
    },
    get invalidLinks() {
      return [
        {"url": "", "title": "blah"},
        {"url": "ftp://foo.com/", "title": "blah"},
        {"url": "garbage://foo.com/", "title": "blah"},
        {"url": "HTTP://localhost:8080/", "title": "blah"},
        {"url": "http://127.0.0.1", "title": "blah"},
        {"url": "http://0.0.0.0", "title": "blah"},
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

  // Test with a %s in the query params
  let expectedUrl = "https://bugzilla.mozilla.org/buglist.cgi";
  sanitizedUrl = gPreviewProvider._sanitizeURL("https://bugzilla.mozilla.org/buglist.cgi?quicksearch=%s");
  assert.equal(expectedUrl, sanitizedUrl, "%s doesn't cause unhandled exception");
};

exports.test_process_links = function*(assert) {
  const fakeData = [
    {"url": "http://foo.com/#foo", "title": "blah"},
    {"url": "http://foo.com/#bar", "title": "blah"},
    {"url": "http://www.foo.com/", "title": "blah"},
    {"url": "https://foo.com/", "title": "blah"}
  ];

  const processedLinks = gPreviewProvider.processLinks(fakeData);

  assert.equal(fakeData.length, processedLinks.length, "should not deduplicate or remove any links");

  processedLinks.forEach((link, i) => {
    assert.equal(link.url, fakeData[i].url, "each site has its original url");
    assert.ok(link.sanitizedURL, "links have sanitizedURLs");
    assert.ok(link.cacheKey, "links have cacheKeys");
  });
};

exports.test_dedupe_urls = function*(assert) {
  const fakeData = [
    {"url": "http://foo.com/", "title": "blah"},
    {"url": "http://www.foo.com/", "title": "blah"},
    {"url": "https://foo.com/", "title": "blah"},
    {"url": "http://foo.com/bar/foobar", "title": "blah"},
    {"url": "http://foo.com/bar////foobar", "title": "blah"},
    {"url": "https://www.foo.com/?q=param", "title": "blah"},
    {"url": "hTTp://fOo.com/", "title": "blah"},
    {"url": "http://localhost-foo.com", "title": "blah"}
  ];

  // dedupe a set of sanitized links while maintaining their original url
  let uniqueLinks = gPreviewProvider._uniqueLinks(fakeData);
  let expectedUrls = [
    {"url": "http://foo.com/", "title": "blah"},
    {"url": "http://foo.com/bar/foobar", "title": "blah"},
    {"url": "https://www.foo.com/?q=param", "title": "blah"},
    {"url": "http://localhost-foo.com", "title": "blah"}
  ];

  uniqueLinks.forEach((link, i) => {
    assert.ok(link.url, "each site has it's original url");
    assert.equal(link.url, expectedUrls[i].url, "links have been deduped");
  });
};

exports.test_throw_out_non_requested_responses = function*(assert) {
  const fakeSite1 = {"url": "http://example1.com/", "sanitizedURL": "http://example1.com/", "cacheKey": "example1.com/"};
  const fakeSite2 = {"url": "http://example2.com/", "sanitizedURL": "http://example2.com/", "cacheKey": "example2.com/"};
  const fakeSite3 = {"url": "http://example3.com/", "sanitizedURL": "http://example3.com/", "cacheKey": "example3.com/"};
  const fakeSite4 = {"url": "http://example4.com/", "sanitizedURL": "http://example4.com/", "cacheKey": "example4.com/"};
  // send site 1, 2, 4
  const fakeData = [fakeSite1, fakeSite2, fakeSite4];

  // receive site 1, 2, 3
  const fakeResponse = {"urls": {
    "http://example1.com/": {
      "embedlyMetaData": "some good embedly metadata for fake site 1"
    },
    "http://example2.com/": {
      "embedlyMetaData": "some good embedly metadata for fake site 2"
    },
    "http://example3.com/": {
      "embedlyMetaData": "oh no I didn't request this!"
    }
  }};

  assert.ok(gPreviewProvider._embedlyEndpoint, "The embedly endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  srv.registerPathHandler("/embedlyLinkData", function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  yield gPreviewProvider.asyncSaveLinks(fakeData);

  // cache should contain example1.com and example2.com
  assert.ok(ss.storage.embedlyData[fakeSite1.cacheKey].embedlyMetaData, "first site was saved as expected");
  assert.ok(ss.storage.embedlyData[fakeSite2.cacheKey].embedlyMetaData, "second site was saved as expected");
  // cache should not contain example3.com and example4.com
  assert.throws(() => ss.storage.embedlyData[fakeSite3.cacheKey].embedlyMetaData, "third site was not found in the cache");
  assert.throws(() => ss.storage.embedlyData[fakeSite4.cacheKey].embedlyMetaData, "fourth site was not found in the cache");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
},

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
      "embedlyMetaData": "some embedly metadata"
    }
  }};

  const embedlyVersionQuery = "addon_version=";
  assert.ok(gPreviewProvider._embedlyEndpoint, "The embedly endpoint is set");

  let srv = httpd.startServerAsync(gPort);
  srv.registerPathHandler("/embedlyLinkData", function handle(request, response) {
    // first, check that the version included in the query string
    assert.deepEqual(`${request.queryString}`, `${embedlyVersionQuery}${self.version}`, "we're hitting the correct endpoint");
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeDataCached));
  });

  yield gPreviewProvider.asyncSaveLinks(fakeData);

  assert.deepEqual(ss.storage.embedlyData[fakeSite.cacheKey].embedlyMetaData, "some embedly metadata", "the cache saved the embedly data");
  assert.ok(ss.storage.embedlyData[fakeSite.cacheKey].accessTime, "the cached saved a time stamp");

  let cachedLinks = gPreviewProvider.getEnhancedLinks(fakeData);
  assert.equal(cachedLinks[0].lastVisitDate, fakeSite.lastVisitDate, "getEnhancedLinks should prioritize new data");
  assert.equal(cachedLinks[0].bookmarkDateCreated, fakeSite.bookmarkDateCreated, "getEnhancedLinks should prioritize new data");
  assert.ok(ss.storage.embedlyData[fakeSite.cacheKey], "the cached link is now retrieved next time");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_get_enhanced_disabled = function*(assert) {
  const fakeData = [
    {url: "http://foo.com/", lastVisitDate: 1459537019061}
  ];
  simplePrefs.prefs["previews.enabled"] = false;
  let cachedLinks = gPreviewProvider.getEnhancedLinks(fakeData);
  assert.deepEqual(cachedLinks, fakeData, "if disabled, should return links as is");
};

exports.test_get_enhanced_previews_only = function*(assert) {
  ss.storage.embedlyData["example.com/"] = {sanitizedURL: "http://example.com/", cacheKey: "example.com/", url: "http://example.com/"};
  let links;

  links = gPreviewProvider.getEnhancedLinks([{cacheKey: "example.com/"}, {cacheKey: "foo.com"}]);
  assert.equal(links.length, 2, "by default getEnhancedLinks returns links with and without previews");

  links = gPreviewProvider.getEnhancedLinks([{cacheKey: "example.com/"}, {cacheKey: "foo.com"}], true);
  assert.equal(links.length, 1, "when previewOnly is set, return only links with previews");
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

/* globals require, exports, NetUtil */

"use strict";

const {before, after} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");
const self = require("sdk/self");
const {Loader} = require("sdk/test/loader");
const loader = Loader(module);
const httpd = loader.require("./lib/httpd");
const {Cu} = require("chrome");
const {PreviewProvider} = require("addon/PreviewProvider");
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const DISALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const URL_FILTERS = [
  item => !!item.url,
  item => !!(new URL(item.url)),
  item => ALLOWED_PROTOCOLS.has(new URL(item.url).protocol),
  item => !DISALLOWED_HOSTS.has(new URL(item.url).hostname)
];

Cu.importGlobalProperties(["URL"]);
Cu.import("resource://gre/modules/NetUtil.jsm");

const gPort = 8089;
let gPreviewProvider;
let gMetadataStore = [];
let gPrefEmbedly = simplePrefs.prefs["embedly.endpoint"];
let gPrefEnabled = simplePrefs.prefs["previews.enabled"];

exports.test_only_request_links_once = function*(assert) {
  const msg1 = [{"url": "a.com", "sanitized_url": "a.com", "cache_key": "a.com"},
                {"url": "b.com", "sanitized_url": "b.com", "cache_key": "b.com"},
                {"url": "c.com", "sanitized_url": "c.com", "cache_key": "c.com"}];

  const msg2 = [{"url": "b.com", "sanitized_url": "b.com", "cache_key": "b.com"},
                {"url": "c.com", "sanitized_url": "c.com", "cache_key": "c.com"},
                {"url": "d.com", "sanitized_url": "d.com", "cache_key": "d.com"}];

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
    // count the times each url has been requested
    data.urls.forEach(url => (urlsRequested[url] = (urlsRequested[url] + 1) || 1));
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify({"urls": {urlsRequested}}));
  });

  // request 'b.com' and 'c.com' twice
  gPreviewProvider._asyncSaveLinks(msg1);
  yield gPreviewProvider._asyncSaveLinks(msg2);

  Object.keys(urlsRequested).forEach(url => {
    // each url should have a count of just one
    assert.equal(urlsRequested[url], 1, "URL was requested only once");
  });

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_filter_urls = function(assert) {
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
    }
  };

  // all valid urls should be allowed through the filter and should be returned
  const goodUrls = fakeData.validLinks.filter(gPreviewProvider._URLFilter(URL_FILTERS));
  goodUrls.forEach((item, i) => assert.deepEqual(item, fakeData.validLinks[i], `${item} is a valid url`));

  // all invalid urls should be removed from the list of urls
  const badUrls = fakeData.invalidLinks.filter(gPreviewProvider._URLFilter(URL_FILTERS));
  assert.deepEqual(badUrls, [], "all bad links are removed");
};

exports.test_sanitize_urls = function(assert) {
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

exports.test_process_links = function(assert) {
  const fakeData = [
    {"url": "http://foo.com/#foo", "title": "blah"},
    {"url": "http://foo.com/#bar", "title": "blah"},
    {"url": "http://www.foo.com/", "title": "blah"},
    {"url": "https://foo.com/", "title": "blah"}
  ];

  // process the links
  const processedLinks = gPreviewProvider.processLinks(fakeData);

  assert.equal(fakeData.length, processedLinks.length, "should not deduplicate or remove any links");

  // check that each link has added the correct fields
  processedLinks.forEach((link, i) => {
    assert.equal(link.url, fakeData[i].url, "each site has its original url");
    assert.ok(link.sanitized_url, "link has a sanitized url");
    assert.ok(link.cache_key, "link has a cache key");
    assert.ok(link.places_url, "link has a places url");
  });
};

exports.test_dedupe_urls = function(assert) {
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
  const fakeSite1 = {"url": "http://example1.com/", "sanitized_url": "http://example1.com/", "cache_key": "example1.com/"};
  const fakeSite2 = {"url": "http://example2.com/", "sanitized_url": "http://example2.com/", "cache_key": "example2.com/"};
  const fakeSite3 = {"url": "http://example3.com/", "sanitized_url": "http://example3.com/", "cache_key": "example3.com/"};
  const fakeSite4 = {"url": "http://example4.com/", "sanitized_url": "http://example4.com/", "cache_key": "example4.com/"};
  // send site 1, 2, 4
  const fakeData = [fakeSite1, fakeSite2, fakeSite4];

  // receive site 1, 2, 3
  const fakeResponse = {
    "urls": {
      "http://example1.com/": {"embedlyMetaData": "some good embedly metadata for fake site 1"},
      "http://example2.com/": {"embedlyMetaData": "some good embedly metadata for fake site 2"},
      "http://example3.com/": {"embedlyMetaData": "oh no I didn't request this!"}
    }
  };

  assert.ok(gPreviewProvider._embedlyEndpoint, "The embedly endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  srv.registerPathHandler("/embedlyLinkData", function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  yield gPreviewProvider._asyncSaveLinks(fakeData);

  // database should contain example1.com and example2.com
  assert.equal(gMetadataStore[0].length, 2, "saved two items");
  assert.equal(gMetadataStore[0][0].url, fakeSite1.url, "first site was saved as expected");
  assert.equal(gMetadataStore[0][1].url, fakeSite2.url, "second site was saved as expected");

  // database should not contain example3.com and example4.com
  gMetadataStore[0].forEach(item => {
    assert.ok(item.url !== fakeSite3.url, "third site was not saved");
    assert.ok(item.url !== fakeSite4.url, "fourth site was not saved");
  });

  yield new Promise(resolve => {
    srv.stop(resolve);
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
    "sanitized_url": "http://example.com/",
    "cache_key": "example.com/"
  };
  const fakeRequest = [fakeSite];
  const fakeResponse = {"urls": {"http://example.com/": {"embedlyMetaData": "some embedly metadata"}}};

  const embedlyVersionQuery = "addon_version=";
  assert.ok(gPreviewProvider._embedlyEndpoint, "The embedly endpoint is set");

  let srv = httpd.startServerAsync(gPort);
  srv.registerPathHandler("/embedlyLinkData", function handle(request, response) {
    // first, check that the version included in the query string
    assert.deepEqual(`${request.queryString}`, `${embedlyVersionQuery}${self.version}`, "we're hitting the correct endpoint");
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  // make a request to embedly with 'fakeSite'
  yield gPreviewProvider._asyncSaveLinks(fakeRequest);

  // we should have saved the fake site into the database
  assert.deepEqual(gMetadataStore[0][0].embedlyMetaData, "some embedly metadata", "inserted and saved the embedly data");
  assert.ok(gMetadataStore[0][0].expired_at, "an expiry time was added");

  // retrieve the contents of the database - don't go to embedly
  let cachedLinks = yield gPreviewProvider._asyncGetEnhancedLinks(fakeRequest);
  assert.equal(cachedLinks[0].lastVisitDate, fakeSite.lastVisitDate, "getEnhancedLinks should prioritize new data");
  assert.equal(cachedLinks[0].bookmarkDateCreated, fakeSite.bookmarkDateCreated, "getEnhancedLinks should prioritize new data");
  assert.deepEqual(gMetadataStore[0][0].cache_key, cachedLinks[0].cache_key, "the cached link is now retrieved next time");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_get_enhanced_disabled = function*(assert) {
  const fakeData = [
    {url: "http://foo.com/", lastVisitDate: 1459537019061}
  ];
  simplePrefs.prefs["previews.enabled"] = false;
  let cachedLinks = yield gPreviewProvider._asyncGetEnhancedLinks(fakeData);
  assert.deepEqual(cachedLinks, fakeData, "if disabled, should return links as is");
};

exports.test_get_enhanced_previews_only = function*(assert) {
  gMetadataStore[0] = {sanitized_url: "http://example.com/", cache_key: "example.com/", url: "http://example.com/"};
  let links;

  links = yield gPreviewProvider._asyncGetEnhancedLinks([{cache_key: "example.com/"}, {cache_key: "foo.com"}]);
  assert.equal(links.length, 2, "by default getEnhancedLinks returns links with and without previews");

  links = yield gPreviewProvider._asyncGetEnhancedLinks([{cache_key: "example.com/"}, {cache_key: "foo.com"}], true);
  assert.equal(links.length, 1, "when previewOnly is set, return only links with previews");
};

before(exports, () => {
  simplePrefs.prefs["embedly.endpoint"] = `http://localhost:${gPort}/embedlyLinkData`;
  simplePrefs.prefs["previews.enabled"] = true;
  let mockMetadataStore = {
    asyncInsert(data) {
      gMetadataStore.push(data);
      return gMetadataStore;
    },
    asyncGetMetadataByCacheKey(cacheKeys) {
      let items = [];
      gMetadataStore.forEach(item => {
        if (cacheKeys.includes(item.cache_key)) {
          items.push(Object.assign({}, {cache_key: item.cache_key}, {title: `Title for ${item.cache_key}`}));
        }
      });
      return items;
    }
  };
  let mockTabTracker = {handlePerformanceEvent() {}, generateEvent() {}};
  gPreviewProvider = new PreviewProvider(mockTabTracker, mockMetadataStore, {initFresh: true});
});

after(exports, () => {
  simplePrefs.prefs["embedly.endpoint"] = gPrefEmbedly;
  simplePrefs.prefs["previews.enabled"] = gPrefEnabled;
  gMetadataStore = [];
  gPreviewProvider.uninit();
});

require("sdk/test").run(exports);

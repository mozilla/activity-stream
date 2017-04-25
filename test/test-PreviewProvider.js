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
const {hexToRGB} = require("addon/lib/utils");

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
const gEndpointPrefix = `http://localhost:${gPort}`;
const gMetadataServiceEndpoint = "/metadataServiceLinkData";
let gPreviewProvider;
let gMetadataStore = [];
let gMetadataPref = simplePrefs.prefs["metadata.endpoint"];
let gPrefEnabled = simplePrefs.prefs["previews.enabled"];

// mocks for metadataStore & tabTracker
const gMockMetadataStore = {
  asyncInsert(data) {
    gMetadataStore.push(data);
    return Promise.resolve();
  },
  asyncGetMetadataByCacheKey(cacheKeys) {
    let items = [];
    if (gMetadataStore[0]) {
      gMetadataStore[0].forEach(item => {
        if (cacheKeys.includes(item.cache_key)) {
          items.push(item);
        }
      });
    }
    return Promise.resolve(items);
  },
  asyncCacheKeyExists(key) {
    let exists = false;
    if (gMetadataStore[0]) {
      gMetadataStore[0].forEach(item => {
        if (key === item.cache_key) {
          exists = true;
        }
      });
    }
    return Promise.resolve(exists);
  }
};
const gMockTabTracker = {handlePerformanceEvent() {}, generateEvent() {}};

function getMockStore() {
  return {
    dispatch: () => null,
    getState: () => ({Experiments: {values: {}}})
  };
}

exports.test_only_request_links_once = function*(assert) {
  const msg1 = [{"url": "http://www.a.com"},
                {"url": "http://www.b.com"},
                {"url": "http://www.c.com"}];

  const msg2 = [{"url": "http://www.b.com"},
                {"url": "http://www.c.com"},
                {"url": "http://www.d.com"}];

  const endpoint = gPreviewProvider._metadataEndpoint;
  assert.ok(endpoint, "The metadata endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  let urlsRequested = {};
  srv.registerPathHandler(gMetadataServiceEndpoint, function handle(request, response) {
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
  gPreviewProvider.asyncSaveLinks(msg1);
  yield gPreviewProvider.asyncSaveLinks(msg2);

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
  assert.equal(sanitizedUrl, null, "if an empty url is passed, return null");

  // the URL object throws if it is given a malformed url
  assert.throws(() => URL("foo.com"), "malformed URL");

  // remove any query parameter that is not in the whitelist
  let safeQuery = "http://www.foobar.com/?id=300&p=firefox&search=mozilla&q=query";
  sanitizedUrl = gPreviewProvider._sanitizeURL("http://www.foobar.com/?id=300&p=firefox&user=garbage&pass=trash&search=mozilla&foo=bar&q=query");
  assert.ok(safeQuery, sanitizedUrl.toString(), "removed any bad params and keep allowed params");

  // remove extra slashes and relative paths
  let removeSlashes = "http://www.foobar.com/foo/bar/foobar";
  sanitizedUrl = gPreviewProvider._sanitizeURL("http://www.foobar.com///foo////bar//foobar/");
  assert.equal(removeSlashes, sanitizedUrl.toString(), "removed extra slashes in pathname");
  let normalizePath = "http://www.foobar.com/foo/foobar/quuz.html";
  sanitizedUrl = gPreviewProvider._sanitizeURL("http://www.foobar.com/../foo/bar/../foobar/./quuz.html");
  assert.equal(normalizePath, sanitizedUrl.toString(), "normalized the pathname");

  // remove any sensitive information passed with basic auth
  let sensitiveUrl = "https://localhost.biz/";
  sanitizedUrl = gPreviewProvider._sanitizeURL("https://user:pass@localhost.biz/");
  assert.equal(sanitizedUrl.username, "", "removed username field");
  assert.equal(sanitizedUrl.password, "", "removed password field");
  assert.equal(sensitiveUrl, sanitizedUrl.toString(), "removed sensitive information from url");

  // remove the hash
  let removeHash = "http://www.foobar.com/";
  sanitizedUrl = gPreviewProvider._sanitizeURL("http://www.foobar.com/#id=20");
  assert.equal(removeHash, sanitizedUrl.toString(), "removed hash field");

  // Test with a %s in the query params
  let expectedUrl = "https://bugzilla.mozilla.org/buglist.cgi";
  sanitizedUrl = gPreviewProvider._sanitizeURL("https://bugzilla.mozilla.org/buglist.cgi?quicksearch=%s");
  assert.equal(expectedUrl, sanitizedUrl.toString(), "%s doesn't cause unhandled exception");
};

exports.test_process_links = function(assert) {
  const fakeData = [
    {"url": "http://foo.com/#foo", "title": "blah"},
    {"url": "http://foo.com/#bar", "title": "blah"},
    {"url": "http://www.foo.com/", "title": "blah"},
    {"url": "https://foo.com/", "title": "blah"}
  ];

  // process the links
  const processedLinks = gPreviewProvider._processLinks(fakeData);

  assert.equal(fakeData.length, processedLinks.length, "should not deduplicate or remove any links");

  // check that each link has added the correct fields
  processedLinks.forEach((link, i) => {
    assert.equal(link.url, fakeData[i].url, "each site has its original url");
    assert.ok(link.sanitized_url, "link has a sanitized url");
    assert.ok(link.cache_key, "link has a cache key");
    assert.ok(link.places_url, "link has a places url");
  });
};

exports.test_process_and_insert_links = function*(assert) {
  const fakeData = {"url": "http://example.com/1", "title": "Title for example.com/1"};

  const mockActions = [];
  gPreviewProvider._store = getMockStore();
  gPreviewProvider._store.dispatch = action => mockActions.push(action);

  // process and insert the links
  yield gPreviewProvider.processAndInsertMetadata(fakeData, "metadata_source");
  assert.equal(gMetadataStore[0].length, 1, "saved one item");

  // check the first site inserted in the metadata DB
  assert.equal(gMetadataStore[0][0].url, fakeData.url, "site was saved as expected");
  assert.equal(gMetadataStore[0][0].cache_key, "example.com/1", "we added a cache_key for the site");
  assert.equal(gMetadataStore[0][0].metadata_source, "metadata_source", "we added a metadata_source for the site");
  assert.equal(gMetadataStore[0][0].title, fakeData.title, "we added the title from the metadata for the site");
  assert.equal(mockActions[0].type, "METADATA_UPDATED");
};

exports.test_look_for_link_in_DB = function*(assert) {
  // the first time we check the link will not be in the DB
  const urlObject = {url: "https://www.dontexist.com"};
  let doesLinkExist = yield gPreviewProvider.asyncLinkExist(urlObject.url);
  assert.equal(doesLinkExist, false, "link doesn't exist at first");

  // insert the link and check again, this time it will be in the DB
  gPreviewProvider.processAndInsertMetadata(urlObject);
  doesLinkExist = yield gPreviewProvider.asyncLinkExist(urlObject.url);
  assert.equal(doesLinkExist, true, "link does exist this time around");
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
  const fakeSite1 = {"url": "http://example1.com/"};
  const fakeSite2 = {"url": "http://example2.com/"};
  const fakeSite3 = {"url": "http://example3.com/"};
  const fakeSite4 = {"url": "http://example4.com/"};
  // send site 1, 2, 4
  const fakeData = [fakeSite1, fakeSite2, fakeSite4];

  // receive site 1, 2, 3
  const fakeResponse = {
    "urls": {
      "http://example1.com/": {"description": "some good metadata for fake site 1"},
      "http://example2.com/": {"description": "some good metadata for fake site 2"},
      "http://example3.com/": {"description": "oh no I didn't request this!"}
    }
  };

  const endpoint = gPreviewProvider._metadataEndpoint;
  assert.ok(endpoint, "The metadata endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  srv.registerPathHandler(gMetadataServiceEndpoint, function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  yield gPreviewProvider.asyncSaveLinks(fakeData);

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

exports.test_mock_metadata_request = function*(assert) {
  const fakeSite = {
    "url": "http://example.com/",
    "title": null,
    "lastVisitDate": 1459537019061,
    "frecency": 2000,
    "favicons": [{"url": "http://imageForExample.com", "color": "#000000"}],
    "bookmarkDateCreated": 1459537019061,
    "type": "history"
  };
  const fakeRequest = [fakeSite];
  const fakeResponse = {"urls": {"http://example.com/": {"description": "some metadata"}}};

  const versionQuery = "addon_version=";
  const endpoint = gPreviewProvider._metadataEndpoint;
  assert.ok(endpoint, "The metadata endpoint is set");

  let srv = httpd.startServerAsync(gPort);
  srv.registerPathHandler(gMetadataServiceEndpoint, function handle(request, response) {
    // first, check that the version included in the query string
    assert.deepEqual(`${request.queryString}`, `${versionQuery}${self.version}`, "we're hitting the correct endpoint");
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  // make a request to metadat service with 'fakeSite'
  yield gPreviewProvider.asyncSaveLinks(fakeRequest);

  // we should have saved the fake site into the database
  assert.deepEqual(gMetadataStore[0][0].description, "some metadata", "inserted and saved the metadadata");
  assert.ok(gMetadataStore[0][0].favicon_height, "added a favicon_height");
  assert.ok(gMetadataStore[0][0].favicon_width, "added a favicon_width");
  assert.equal(gMetadataStore[0][0].metadata_source, "MetadataService", "a metadata source was added");

  // retrieve the contents of the database - don't go to metadata service
  let cachedLinks = yield gPreviewProvider.asyncGetEnhancedLinks(fakeRequest);
  assert.equal(cachedLinks[0].lastVisitDate, fakeSite.lastVisitDate, "getEnhancedLinks should prioritize new data");
  assert.equal(cachedLinks[0].bookmarkDateCreated, fakeSite.bookmarkDateCreated, "getEnhancedLinks should prioritize new data");
  assert.deepEqual(gMetadataStore[0][0].cache_key, cachedLinks[0].cache_key, "the cached link is now retrieved next time");
  assert.equal(cachedLinks[0].favicon_url, fakeSite.favicons[0].url, "added a favicon_url field");
  assert.deepEqual(cachedLinks[0].background_color, hexToRGB(fakeSite.favicons[0].color), "added a background_color field");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_no_metadata_source = function*(assert) {
  const fakeSite = {
    "url": "http://www.amazon.com/",
    "title": null
  };
  const fakeResponse = {"urls": {"http://www.amazon.com/": {"description": "some metadata"}}};

  let cachedLink = yield gPreviewProvider.asyncGetEnhancedLinks([fakeSite]);
  assert.equal(cachedLink[0].metadata_source, "TippyTopProvider", "metadata came from TippyTopProvider");

  let srv = httpd.startServerAsync(gPort);
  srv.registerPathHandler(gMetadataServiceEndpoint, function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });
  yield gPreviewProvider.asyncSaveLinks([fakeSite]);
  cachedLink = yield gPreviewProvider.asyncGetEnhancedLinks([fakeSite]);

  assert.equal(gMetadataStore[0][0].metadata_source, "MetadataService", "correct metadata_source in database");
  assert.equal(cachedLink[0].metadata_source, "MetadataService", "correct metadata_source returned for this link");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_prefer_tippytop_favicons = function*(assert) {
  // we're using youtube here because it's known that the favicon that metadata service
  // returns is worse than the tippytop favicon - so we want to use the tippytop one
  const fakeSite = {
    "url": "http://www.youtube.com/",
    "title": null
  };
  const fakeResponse = {
    "urls": {
      "http://www.youtube.com/": {
        "description": "some generated description",
        "favicon_url": "https://badicon.com",
        "background_color": "#BADCOLR"
      }
    }
  };

  // get the tippytop favicon_url and background_color and compare with
  // what we get from the cached link
  let tippyTopLink = gPreviewProvider._tippyTopProvider.processSite(fakeSite);
  let cachedLink = yield gPreviewProvider.asyncGetEnhancedLinks([fakeSite]);

  assert.equal(tippyTopLink.favicon_url, cachedLink[0].favicon_url, "TippyTopProvider added a favicon_url");
  assert.deepEqual(hexToRGB(tippyTopLink.background_color), cachedLink[0].background_color, "TippyTopProvider added a background_color");

  let srv = httpd.startServerAsync(gPort);
  srv.registerPathHandler(gMetadataServiceEndpoint, function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });
  // insert a link with some less nice icons in it and get them back
  yield gPreviewProvider.asyncSaveLinks([fakeSite]);
  cachedLink = yield gPreviewProvider.asyncGetEnhancedLinks([fakeSite]);

  assert.equal(tippyTopLink.favicon_url, cachedLink[0].favicon_url, "we still took the better tippyTop favicon_url");
  assert.deepEqual(hexToRGB(tippyTopLink.background_color), cachedLink[0].background_color, "we still took the better tippyTop background_color");
  assert.equal(fakeResponse.urls["http://www.youtube.com/"].description, cachedLink[0].description, "but we still have other metadata");

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_get_enhanced_disabled = function*(assert) {
  const fakeData = [
    {url: "http://foo.com/", lastVisitDate: 1459537019061}
  ];
  simplePrefs.prefs["previews.enabled"] = false;
  let cachedLinks = yield gPreviewProvider.asyncGetEnhancedLinks(fakeData);
  assert.deepEqual(cachedLinks, fakeData, "if disabled, should return links as is");
};

exports.test_copy_over_correct_data_from_firefox = function*(assert) {
  const expectedKeys = ["title", "type", "url", "eTLD", "cache_key", "hostname", "lastVisitDate", "bookmarkGuid", "bookmarkDateCreated"];
  const link = [{
    title: "a firefox given title",
    type: "bookmark",
    url: "http://example.com",
    cache_key: "example.com/",
    hostname: "example.com",
    lastVisitDate: 123456789,
    bookmarkDateCreated: 123456789,
    bookmarkGuid: 1234
  }];

  const cachedLink = yield gPreviewProvider.asyncGetEnhancedLinks(link);
  expectedKeys.forEach(key => assert.equal(cachedLink[0][key], link[0][key], "even without metadata we kept all the firefox data for the link"));
};

exports.test_compute_image_sizes = function*(assert) {
  let mockExperimentProvider = {data: {metadataService: false}};
  gPreviewProvider = new PreviewProvider(gMockTabTracker, gMockMetadataStore, mockExperimentProvider, {initFresh: true});
  gPreviewProvider._store = getMockStore();
  let metadataObj = {
    url: "https://www.hasAnImage.com",
    images: [{url: "data:image;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAA"}] // a 1x1 pixel image
  };
  // compute the image sizes of the metadata
  let newImage = yield gPreviewProvider._computeImageSize(metadataObj.images[0].url);
  assert.equal(newImage.url, metadataObj.images[0].url, "the url was intact");
  assert.equal(newImage.width, 1, "computed the correct image width");
  assert.equal(newImage.height, 1, "computed the correct image height");

  // force the image to reject by giving it a null src
  metadataObj.images[0].url = null;
  let error = false;
  try {
    newImage = yield gPreviewProvider._computeImageSize(metadataObj.images[0].url);
  } catch (e) {
    error = true;
  }
  assert.deepEqual(error, true, "we rejected the when the image fails to load");
};

before(exports, () => {
  simplePrefs.prefs["metadata.endpoint"] = `${gEndpointPrefix}${gMetadataServiceEndpoint}`;
  simplePrefs.prefs["previews.enabled"] = true;
  gPreviewProvider = new PreviewProvider(gMockTabTracker, gMockMetadataStore, {initFresh: true});
  gPreviewProvider._store = getMockStore();
  gPreviewProvider._getFaviconColors = function() {
    return Promise.resolve(null);
  };
  gPreviewProvider._computeImageSize = function(url) {
    return Promise.resolve({url, height: 96, width: 96});
  };
});

after(exports, () => {
  simplePrefs.prefs["metadata.endpoint"] = gMetadataPref;
  simplePrefs.prefs["previews.enabled"] = gPrefEnabled;
  gMetadataStore = [];
  gPreviewProvider.uninit();
});

require("sdk/test").run(exports);

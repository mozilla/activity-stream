"use strict";

const {before, after} = require("sdk/test/utils");
const simplePrefs = require("sdk/simple-prefs");
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

let gPreviewProvider;
let gMetadataStore = [];
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
  simplePrefs.prefs["previews.enabled"] = gPrefEnabled;
  gMetadataStore = [];
  gPreviewProvider.uninit();
});

require("sdk/test").run(exports);

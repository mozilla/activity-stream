/* globals XPCOMUtils, NetUtil, PlacesUtils, btoa, Bookmarks */
"use strict";

const {before} = require("sdk/test/utils");
const {PlacesProvider} = require("addon/PlacesProvider");
const {PlacesTestUtils} = require("./lib/PlacesTestUtils");
const {Ci, Cu} = require("chrome");
const systemEvents = require("sdk/system/events");
const {TOP_SITES_DEFAULT_LENGTH} = require("common/constants");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.importGlobalProperties(["btoa"]);

XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils",
                                  "resource://gre/modules/PlacesUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "NetUtil",
                                  "resource://gre/modules/NetUtil.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Bookmarks",
                                  "resource://gre/modules/Bookmarks.jsm");

// use time at the start of the tests, chnaging it inside timeDaysAgo()
// may cause tiny time differences, which break expected sql ordering
const TIME_NOW = (new Date()).getTime();

// utility function to compute past timestamp in microseconds
function timeDaysAgo(numDays) {
  return (TIME_NOW - (numDays * 24 * 60 * 60 * 1000)) * 1000;
}

// tests that timestamp falls within 10 days of now
function isVisitDateOK(timestampMS) {
  let range = 10 * 24 * 60 * 60 * 1000;
  return Math.abs(Date.now() - timestampMS) < range;
}

// turns a timestamp from ISO format 2015-08-04T19:22:39.000Z into ISO format
// 2015-08-04 19:22:39 so we can compare timestamps properly
function formatISODate(timestamp) {
  return new Date(timestamp).toISOString()
                            .split("T")
                            .join(" ")
                            .split(".")[0];
}

exports.test_LinkChecker_securityCheck = function(assert) {
  let urls = [
    {url: "file://home/file/image.png", expected: false},
    {url: "resource:///modules/PlacesProvider.jsm", expected: false},
    {url: "javascript:alert('hello')", expected: false}, // eslint-disable-line no-script-url
    {url: "data:image/png;base64,XXX", expected: false},
    {url: "about:newtab", expected: true},
    {url: "https://example.com", expected: true},
    {url: "ftp://example.com", expected: true},
    {url: "place:sort=foo", expected: false}
  ];
  for (let {url, expected} of urls) {
    let observed = PlacesProvider.LinkChecker.checkLoadURI(url);
    assert.equal(observed, expected, `can load "${url}"?`);
  }
};

exports.test_Links_getTopFrecentSites = function*(assert) {
  let provider = PlacesProvider.links;

  let links = yield provider.getTopFrecentSites();
  assert.equal(links.length, 0, "empty history yields empty links");

  // add a visit
  let testURI = NetUtil.newURI("http://mozilla.com");
  yield PlacesTestUtils.addVisits(testURI);

  links = yield provider.getTopFrecentSites();
  assert.equal(links.length, 1, "adding a visit yields a link");
  assert.equal(links[0].url, testURI.spec, "added visit corresponds to added url");
  assert.equal(links[0].eTLD, "com", "added visit mozilla.com has 'com' eTLD");
};

exports.test_Links_getTopFrecentSites_dedupeWWW = function*(assert) {
  let provider = PlacesProvider.links;

  let links = yield provider.getTopFrecentSites();
  assert.equal(links.length, 0, "empty history yields empty links");

  // add a visit without www
  let testURI = NetUtil.newURI("http://mozilla.com");
  yield PlacesTestUtils.addVisits(testURI);

  // add a visit with www
  testURI = NetUtil.newURI("http://www.mozilla.com");
  yield PlacesTestUtils.addVisits(testURI);

  // Test combined frecency score
  links = yield provider.getTopFrecentSites();
  assert.equal(links.length, 1, "adding both www. and no-www. yields one link");
  assert.equal(links[0].frecency, 200, "frecency scores are combined");

  // add another page visit with www and without www
  testURI = NetUtil.newURI("http://mozilla.com/page");
  yield PlacesTestUtils.addVisits(testURI);
  testURI = NetUtil.newURI("http://www.mozilla.com/page");
  yield PlacesTestUtils.addVisits(testURI);
  links = yield provider.getTopFrecentSites();
  assert.equal(links.length, 1, "adding both www. and no-www. yields one link");
  assert.equal(links[0].frecency, 200, "frecency scores are combined ignoring extra pages");

  // add another no-www page visit
  testURI = NetUtil.newURI("http://mozilla.com");
  yield PlacesTestUtils.addVisits(testURI, 1);
  links = yield provider.getTopFrecentSites();
  assert.equal(links.length, 1, "adding another no-www. still yields one link");
  assert.equal(links[0].frecency, 300, "frecency scores are combined ignoring extra pages");
  assert.equal(links[0].url, "http://mozilla.com/", "returns the url with the higher frecency");
};

exports.test_Links_getTopFrecentSites_limit = function*(assert) {
  let provider = PlacesProvider.links;

  let links = yield provider.getTopFrecentSites();
  assert.equal(links.length, 0, "empty history yields empty links");

  // add a couple visits
  let testURI = NetUtil.newURI("http://mozilla.com");
  yield PlacesTestUtils.addVisits(testURI);
  testURI = NetUtil.newURI("http://mozilla2.com");
  yield PlacesTestUtils.addVisits(testURI);

  links = yield provider.getTopFrecentSites({limit: 1});
  assert.equal(links.length, 1, "query limited to 1 result");

  links = yield provider.getTopFrecentSites();
  assert.equal(links.length, 2, "no limit uses defaults");

  links = yield provider.getTopFrecentSites({limit: 0});
  assert.equal(links.length, 2, "invalid limit uses defaults");
};

exports.test_Links_getTopFrecentSites_maxLimit = function*(assert) {
  let provider = PlacesProvider.links;

  // add many visits
  const MANY_LINKS = 20;
  for (let i = 0; i < MANY_LINKS; i++) {
    let testURI = NetUtil.newURI(`http://mozilla${i}.com`);
    yield PlacesTestUtils.addVisits(testURI);
  }

  let links = yield provider.getTopFrecentSites();
  assert.ok(links.length < MANY_LINKS, "query default limited to less than many");
  assert.ok(links.length > TOP_SITES_DEFAULT_LENGTH, "query default to more than visible count");
};

exports.test_Links_getTopFrecentSites_Order = function*(assert) {
  let provider = PlacesProvider.links;
  let {
    TRANSITION_TYPED,
    TRANSITION_LINK
  } = PlacesUtils.history;

  let timeEarlier = timeDaysAgo(0);
  let timeLater = timeDaysAgo(2);

  let visits = [
    // frecency 200
    {uri: NetUtil.newURI("https://mozilla1.com/0"), visitDate: timeEarlier, transition: TRANSITION_TYPED},
    // sort by url, frecency 200
    {uri: NetUtil.newURI("https://mozilla2.com/1"), visitDate: timeEarlier, transition: TRANSITION_TYPED},
    // sort by last visit date, frecency 200
    {uri: NetUtil.newURI("https://mozilla3.com/2"), visitDate: timeLater, transition: TRANSITION_TYPED},
    // sort by frecency, frecency 10
    {uri: NetUtil.newURI("https://mozilla4.com/3"), visitDate: timeLater, transition: TRANSITION_LINK}
  ];

  let links = yield provider.getTopFrecentSites();
  assert.equal(links.length, 0, "empty history yields empty links");

  let base64URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAA" +
    "AAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==";

  let faviconData = {
    "https://mozilla1.com/0": null,
    "https://mozilla2.com/1": null,
    "https://mozilla3.com/2": base64URL,
    "https://mozilla4.com/3": null
  };
  yield PlacesTestUtils.addVisits(visits);
  yield PlacesTestUtils.addFavicons(faviconData);

  links = yield provider.getTopFrecentSites();
  assert.equal(links.length, visits.length, "number of links added is the same as obtain by getTopFrecentSites");

  for (let i = 0; i < links.length; i++) {
    assert.equal(links[i].url, visits[i].uri.spec, "links are obtained in the expected order");
    assert.equal(faviconData[links[i].url], links[i].favicon, "favicon data is stored as expected");
    assert.ok(isVisitDateOK(links[i].lastVisitDate), "visit date within expected range");
  }
};

exports.test_Links__addFavicons = function*(assert) {
  let provider = PlacesProvider.links;

  // start by passing in a bad uri and check that we get a null favicon back
  let links = [{url: "mozilla.com"}];
  yield provider._addFavicons(links);
  assert.equal(links[0].favicon, null, "Got a null favicon because we passed in a bad url");
  assert.equal(links[0].mimeType, null, "Got a null mime type because we passed in a bad url");

  // now fix the url and try again - this time we get good favicon data back
  links[0].url = "https://mozilla.com";
  let base64URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAA" +
    "AAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==";

  let visit = [{uri: NetUtil.newURI(links[0].url), visitDate: timeDaysAgo(0), transition: PlacesUtils.history.TRANSITION_TYPED}];
  yield PlacesTestUtils.addVisits(visit);
  let faviconData = {"https://mozilla.com/": base64URL};
  yield PlacesTestUtils.addFavicons(faviconData);

  yield provider._addFavicons(links);
  assert.equal(links[0].mimeType, "image/png", "Got the right mime type before deleting it");
  assert.equal(links[0].faviconLength, links[0].favicon.length, "Got the right length for the byte array");
  assert.equal(provider._faviconBytesToDataURI(links)[0].favicon, base64URL, "Got the right favicon");
};

exports.test_Links_getAllHistoryItems = function*(assert) {
  let provider = PlacesProvider.links;
  let {TRANSITION_TYPED} = PlacesUtils.history;

  let timeToday = timeDaysAgo(0);
  let timeEarlier = timeDaysAgo(2);

  let visits = [
    {uri: NetUtil.newURI("https://example1.com/"), visitDate: timeToday, transition: TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example2.com/"), visitDate: timeToday, transition: TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example3.com/"), visitDate: timeEarlier, transition: TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://mail.google.com/"), visitDate: timeEarlier, transition: TRANSITION_TYPED}
  ];

  yield PlacesTestUtils.addVisits(visits);

  let links = yield provider.getAllHistoryItems();
  assert.equal(links.length > 0, true, "it should retrieve some links");
  assert.equal(links[0].visitCount, 1, "query should retrieve number of visits");
  assert.equal(links[0].reversedHost, "moc.1elpmaxe.", "query should retrieve host");
};

exports.test_Links_getRecentlyVisited = function*(assert) {
  let provider = PlacesProvider.links;
  let {TRANSITION_TYPED} = PlacesUtils.history;

  let timeToday = timeDaysAgo(1);
  let timeOlder = timeDaysAgo(5);

  let visits = [
    {uri: NetUtil.newURI("https://example1.com/"), visitDate: timeToday, transition: TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example2.com/"), visitDate: timeToday, transition: TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example3.com/"), visitDate: timeOlder, transition: TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://mail.google.com/"), visitDate: timeOlder, transition: TRANSITION_TYPED}
  ];

  const limit = 10;
  for (let i = 0; i < limit; i++) {
    visits.push({
      uri: NetUtil.newURI(`https://old.example${i}.com/`),
      visitDate: timeToday,
      transition: TRANSITION_TYPED
    });
  }

  yield PlacesTestUtils.addVisits(visits);

  let links = yield provider.getRecentlyVisited({limit});
  assert.equal(links.length > 0, true, "it should retrieve some links");
  assert.equal(links.length, limit, "query should not retrieve more than the limit even with recent");
  assert.equal(links[0].eTLD, "com", "set 'com' as the eTLD");
};

exports.test_Links_getRecentlyVisited_old_links = function*(assert) {
  let provider = PlacesProvider.links;
  let {TRANSITION_TYPED} = PlacesUtils.history;
  const visits = [];
  const limit = 10;
  for (let i = 0; i < limit + 1; i++) {
    visits.push({
      uri: NetUtil.newURI(`https://example${i}.com/`),
      visitDate: timeDaysAgo(5),
      transition: TRANSITION_TYPED
    });
  }

  yield PlacesTestUtils.addVisits(visits);

  let links = yield provider.getRecentlyVisited({limit});
  assert.equal(links.length > 0, true, "it should retrieve some links");
  assert.equal(links.length, limit, "query should retrieve at most the limit of old links if nothing recent is available");

  links = yield provider.getRecentlyVisited();
  assert.equal(links.length, limit + 1, "query with no limit gets all");

  links = yield provider.getRecentlyVisited({limit: 0});
  assert.equal(links.length, limit + 1, "query with invalid limit gets all");
};

exports.test_Links_asyncAddBookmark = function*(assert) {
  let provider = PlacesProvider.links;

  let bookmarks = [
    "https://mozilla1.com/0",
    "https://mozilla1.com/1"
  ];

  let bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 0, "empty bookmarks yields 0 size");

  for (let url of bookmarks) {
    yield provider.asyncAddBookmark(url);
  }

  bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 2, "size 2 for 2 bookmarks added");
};

exports.test_Links_asyncDeleteBookmark = function*(assert) {
  let provider = PlacesProvider.links;

  let bookmarks = [
    {url: "https://mozilla1.com/0", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK},
    {url: "https://mozilla1.com/1", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK}
  ];

  let bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 0, "empty bookmarks yields 0 size");

  for (let placeInfo of bookmarks) {
    yield Bookmarks.insert(placeInfo);
  }

  bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 2, "size 2 for 2 bookmarks added");

  let bookmarkGuid = yield new Promise(resolve => Bookmarks.fetch(
    {url: bookmarks[0].url}, bookmark => resolve(bookmark.guid)));
  let deleted = yield provider.asyncDeleteBookmark(bookmarkGuid);
  assert.equal(deleted.guid, bookmarkGuid, "the correct bookmark was deleted");

  bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 1, "size 1 after deleting");
};

exports.test_Links_deleteHistoryLink = function*(assert) {
  let provider = PlacesProvider.links;
  let {
    TRANSITION_TYPED,
    TRANSITION_LINK
  } = PlacesUtils.history;

  let visits = [
    // frecency 200
    {uri: NetUtil.newURI("https://mozilla1.com/0"), visitDate: timeDaysAgo(1), transition: TRANSITION_TYPED},
    // sort by url, frecency 200
    {uri: NetUtil.newURI("https://mozilla2.com/1"), visitDate: timeDaysAgo(0), transition: TRANSITION_LINK}
  ];

  let size = yield provider.getHistorySize();
  assert.equal(size, 0, "empty history has 0 size");

  yield PlacesTestUtils.addVisits(visits);

  size = yield provider.getHistorySize();
  assert.equal(size, 2, "expected history size");

  // delete a link
  let deleted = yield provider.deleteHistoryLink("https://mozilla2.com/1");
  assert.equal(deleted, true, "link is deleted");
  // ensure that there's only one link left
  size = yield provider.getHistorySize();
  assert.equal(size, 1, "expected history size");
};

exports.test_Links_bookmark_notifications = function*(assert) {
  let provider = PlacesProvider.links;
  let {
    TRANSITION_TYPED,
    TRANSITION_LINK
  } = PlacesUtils.history;
  provider.init();

  /** start setup **/

  let timeEarlier = timeDaysAgo(0);
  let timeLater = timeDaysAgo(2);

  let visits = [
    // frecency 200
    {uri: NetUtil.newURI("https://mozilla1.com/0"), visitDate: timeEarlier, transition: TRANSITION_TYPED},
    // sort by url, frecency 200
    {uri: NetUtil.newURI("https://mozilla2.com/1"), visitDate: timeEarlier, transition: TRANSITION_TYPED},
    // sort by last visit date, frecency 200
    {uri: NetUtil.newURI("https://mozilla3.com/2"), visitDate: timeLater, transition: TRANSITION_TYPED},
    // sort by frecency, frecency 10
    {uri: NetUtil.newURI("https://mozilla4.com/3"), visitDate: timeLater, transition: TRANSITION_LINK}
  ];

  let bookmarks = [
    {url: "https://mozilla1.com/0", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK},
    {url: "https://mozilla1.com/1", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK},
    {url: "https://mozilla1.com/2", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK}
  ];

  let bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 0, "empty bookmarks yields 0 size");

  let base64URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAA" +
    "AAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==";

  let faviconData = {
    "https://mozilla1.com/0": null,
    "https://mozilla2.com/1": null,
    "https://mozilla3.com/2": base64URL
  };
  yield PlacesTestUtils.addVisits(visits);
  yield PlacesTestUtils.addFavicons(faviconData);

  /** end setup **/

  let bookmarkNotificationPromise;

  bookmarkNotificationPromise = new Promise(resolve => {
    let addCount = 0;
    let newBookmarks = [];
    function handleEvent(eventName, data) {
      addCount++;
      newBookmarks.push(data);
      if (bookmarks.length === addCount) {
        provider.off("bookmarkAdded", handleEvent);
        resolve(newBookmarks);
      }
    }
    provider.on("bookmarkAdded", handleEvent);
  });

  // inserting a folder here, we are testing if this causes a notification, which it shouldn't
  let folderInfo = {parentGuid: "root________", title: "A FOLDER", type: Bookmarks.TYPE_FOLDER};
  let folder = yield Bookmarks.insert(folderInfo);

  for (let placeInfo of bookmarks) {
    yield Bookmarks.insert(placeInfo);
  }
  let createdBookmarks = yield bookmarkNotificationPromise;

  bookmarkNotificationPromise = new Promise(resolve => {
    function handleEvent(eventName, data) {
      if (data.bookmarkTitle === "FOO") {
        resolve(data);
      }
    }
    provider.once("bookmarkChanged", handleEvent);
  });
  let bm = createdBookmarks[0];
  Bookmarks.update({guid: bm.bookmarkGuid, title: "FOO"});
  yield bookmarkNotificationPromise;

  bookmarkNotificationPromise = new Promise(resolve => {
    function handleEvent(eventName, data) {
      if (data.url === bm.url) {
        resolve(data);
      }
    }
    provider.once("bookmarkRemoved", handleEvent);
  });
  yield Bookmarks.remove({guid: bm.bookmarkGuid});
  yield bookmarkNotificationPromise;

  // cleanup
  yield Bookmarks.remove({guid: folder.guid});
  provider.uninit();
};

exports.test_Links_onLinkChanged = function*(assert) {
  let provider = PlacesProvider.links;
  provider.init();
  assert.equal(true, true);

  let url = "https://example.com/onFrecencyChanged1";
  let linkChangedMsgCount = 0;

  let linkChangedPromise = new Promise(resolve => {
    let handler = (_, link) => {
      // There are 3 linkChanged events:
      // 1. visit insertion (-1 frecency by default)
      // 2. frecency score update (after transition type calculation etc)
      // 3. title change
      if (link.url === url) {
        assert.equal(link.url, url, "expected url on linkChanged event");
        linkChangedMsgCount += 1;
        if (linkChangedMsgCount === 3) {
          assert.ok(true, "all linkChanged events captured");
          provider.off("linkChanged", this);
          resolve();
        }
      }
    };
    provider.on("linkChanged", handler);
  });

  // add a visit
  let testURI = NetUtil.newURI(url);
  yield PlacesTestUtils.addVisits(testURI);
  yield linkChangedPromise;

  provider.uninit();
};

exports.test_Links_onClearHistory = function*(assert) {
  let provider = PlacesProvider.links;
  provider.init();

  let clearHistoryPromise = new Promise(resolve => {
    let handler = () => {
      assert.ok(true, "clearHistory event captured");
      provider.off("clearHistory", handler);
      resolve();
    };
    provider.on("clearHistory", handler);
  });

  // add visits
  for (let i = 0; i <= 10; i++) {
    let url = `https://example.com/onClearHistory${i}`;
    let testURI = NetUtil.newURI(url);
    yield PlacesTestUtils.addVisits(testURI);
  }
  yield PlacesTestUtils.clearHistory();
  yield clearHistoryPromise;
  provider.uninit();
};

exports.test_Links_onDeleteURI = function*(assert) {
  let provider = PlacesProvider.links;
  provider.init();

  let testURL = "https://example.com/toDelete";

  let deleteURIPromise = new Promise(resolve => {
    let handler = (_, {url}) => {
      assert.equal(testURL, url, "deleted url and expected url are the same");
      provider.off("deleteURI", handler);
      resolve();
    };

    provider.on("deleteURI", handler);
  });

  let testURI = NetUtil.newURI(testURL);
  yield PlacesTestUtils.addVisits(testURI);
  yield PlacesUtils.history.remove(testURL);
  yield deleteURIPromise;
  provider.uninit();
};

exports.test_Links_onManyLinksChanged = function*(assert) {
  let provider = PlacesProvider.links;
  provider.init();

  let promise = new Promise(resolve => {
    let handler = () => {
      assert.ok(true);
      provider.off("manyLinksChanged", handler);
      resolve();
    };

    provider.on("manyLinksChanged", handler);
  });

  let testURL = "https://example.com/toDelete";
  let testURI = NetUtil.newURI(testURL);
  yield PlacesTestUtils.addVisits(testURI);

  // trigger DecayFrecency
  PlacesUtils.history.QueryInterface(Ci.nsIObserver).observe(null, "idle-daily", "");

  yield promise;
  provider.uninit();
};

exports.test_Links__faviconBytesToDataURI = function(assert) {
  let tests = [
    [{favicon: "bar".split("").map(s => s.charCodeAt(0)), mimeType: "foo"}],
    [{favicon: "bar".split("").map(s => s.charCodeAt(0)), mimeType: "foo", xxyy: "quz"}]
  ];
  let provider = PlacesProvider.links;

  for (let test of tests) {
    let clone = JSON.parse(JSON.stringify(test));
    delete clone[0].mimeType;
    clone[0].favicon = `data:foo;base64,${btoa("bar")}`;
    let result = provider._faviconBytesToDataURI(test);
    assert.equal(JSON.stringify(clone), JSON.stringify(result), "favicon converted to data uri");
  }
};

exports.test_Links_getHistorySize = function*(assert) {
  let provider = PlacesProvider.links;

  let size = yield provider.getHistorySize();
  assert.equal(size, 0, "empty history has 0 size");

  // add a visit
  let testURI = NetUtil.newURI("http://mozilla.com");
  yield PlacesTestUtils.addVisits(testURI);

  size = yield provider.getHistorySize();
  assert.equal(size, 1, "expected history size");
};

exports.test_Links_getHistorySizeSince = function*(assert) {
  let provider = PlacesProvider.links;

  let size = yield provider.getHistorySizeSince(null);
  assert.equal(size, 0, "return 0 if there is no timestamp provided");

  // add a visit
  let testURI = NetUtil.newURI("http://mozilla.com");
  yield PlacesTestUtils.addVisits(testURI);

  // check that the history size updated with the visit
  let timestamp = formatISODate(Date.now() - 10 * 60 * 1000);
  size = yield provider.getHistorySizeSince(timestamp);
  assert.equal(size, 1, "expected history size since the timestamp");
  assert.equal(typeof size, "number", "function returns a number");

  // add 10m and make sure we don't get that entry back
  timestamp = formatISODate(Date.now() + 10 * 60 * 1000);
  size = yield provider.getHistorySizeSince(timestamp);
  assert.equal(size, 0, "do not return an entry");
};

exports.test_blocked_urls = function*(assert) {
  let provider = PlacesProvider.links;
  let {TRANSITION_TYPED} = PlacesUtils.history;

  let timeToday = timeDaysAgo(0);
  let timeEarlier = timeDaysAgo(2);

  let visits = [
    {uri: NetUtil.newURI("https://example1.com/"), visitDate: timeToday, transition: TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example2.com/"), visitDate: timeToday, transition: TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example3.com/"), visitDate: timeEarlier, transition: TRANSITION_TYPED},
    {uri: NetUtil.newURI("https://example4.com/"), visitDate: timeEarlier, transition: TRANSITION_TYPED}
  ];
  yield PlacesTestUtils.addVisits(visits);
  yield Bookmarks.insert({url: "https://example5.com/", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK});

  let sizeQueryResult;

  // bookmarks
  provider.blockURL("https://example5.com/");
  sizeQueryResult = yield provider.getBookmarksSize();
  assert.equal(sizeQueryResult, 0, "bookmark size is zero");

  sizeQueryResult = yield provider.getBookmarksSize({ignoreBlocked: true});
  assert.equal(sizeQueryResult, 1, "bookmarkSize honors ignoreBlocked");

  provider.unblockURL("https://example5.com/");
  sizeQueryResult = yield provider.getBookmarksSize();
  assert.equal(sizeQueryResult, 1, "bookmark size is one");
};

before(exports, function*() {
  let faviconExpiredPromise = new Promise(resolve => {
    systemEvents.once("places-favicons-expired", resolve);
  });
  yield PlacesUtils.favicons.expireAllFavicons();
  yield faviconExpiredPromise;
  PlacesTestUtils.clearBookmarks();
  yield PlacesTestUtils.clearHistory();
});

require("sdk/test").run(exports);

/* globals XPCOMUtils, NetUtil, PlacesUtils, btoa, Bookmarks */
"use strict";

const {before} = require("sdk/test/utils");
const {PlacesProvider} = require("addon/PlacesProvider");
const {PlacesTestUtils} = require("./lib/PlacesTestUtils");
const {Ci, Cu} = require("chrome");
const systemEvents = require("sdk/system/events");

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

exports.test_Links_getHighlightsLinks = function*(assert) {
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

  let links = yield provider.getHighlightsLinks();
  assert.equal(links.length, 0, "empty history yields empty links");
  yield PlacesTestUtils.addVisits(visits);

  let recentLinks = yield provider.getRecentLinks();
  assert.equal(recentLinks.length, visits.length, "number of links added is the same as obtain by getRecentLinks");

  // note: this is a sanity test because the query may change
  links = yield provider.getHighlightsLinks();
  assert.equal(links.length, 1, "getHighlightsLinks filters links by date and hostname");
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

exports.test_Links_getRecentLinks = function*(assert) {
  let provider = PlacesProvider.links;
  let {
    TRANSITION_TYPED,
    TRANSITION_LINK
  } = PlacesUtils.history;

  let visits = [
    // frecency 200
    {uri: NetUtil.newURI("https://mozilla1.com/0"), visitDate: timeDaysAgo(1), transition: TRANSITION_TYPED},
    // sort by url, frecency 200
    {uri: NetUtil.newURI("https://mozilla2.com/1"), visitDate: timeDaysAgo(0), transition: TRANSITION_TYPED},
    // sort by last visit date, frecency 200
    {uri: NetUtil.newURI("https://mozilla3.com/2"), visitDate: timeDaysAgo(2), transition: TRANSITION_TYPED},
    // sort by frecency, frecency 10
    {uri: NetUtil.newURI("https://mozilla4.com/3"), visitDate: timeDaysAgo(2), transition: TRANSITION_LINK}
  ];

  let links = yield provider.getRecentLinks();
  assert.equal(links.length, 0, "empty history yields empty links");

  let base64URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAA" +
    "AAAA6fptVAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==";

  let faviconData = {
    "https://mozilla1.com/0": null,
    "https://mozilla2.com/1": null,
    "https://mozilla3.com/2": base64URL,
    "https://mozilla4.com/3": null
  };
  yield PlacesTestUtils.addVisits(visits, faviconData);
  yield PlacesTestUtils.addFavicons(faviconData);

  // insert a bookmark
  let bookmark = yield Bookmarks.insert({url: "https://mozilla1.com/0", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK});

  links = yield provider.getRecentLinks();
  assert.equal(links.length, visits.length, "number of links added is the same as obtain by getRecentLinks");
  assert.equal(links[0].url, "https://mozilla2.com/1", "Expected 1-st link");
  assert.equal(links[1].url, "https://mozilla1.com/0", "Expected 2-nd link");
  assert.equal(links[2].url, "https://mozilla3.com/2", "Expected 3-rd link");
  assert.equal(links[3].url, "https://mozilla4.com/3", "Expected 4-th link");
  assert.equal(faviconData[links[2].url], links[2].favicon, "favicon data is stored as expected");
  assert.equal(links[1].bookmarkGuid, bookmark.guid, "expected bookmark guid for second link");
  assert.equal(links[1].bookmarkDateCreated, new Date(bookmark.dateAdded).getTime(), "expected bookmark date for second link");
  assert.ok(isVisitDateOK(links[1].lastVisitDate), "visit date within expected range");
  assert.ok(!(links[0].bookmark || links[2].bookmark || links[3].bookmark), "other bookmarks are empty");

  // test beforeDate functionality
  let theDate = timeDaysAgo(1) / 1000 - 1000;
  links = yield provider.getRecentLinks({beforeDate: theDate});
  assert.equal(links.length, 2, "should only see two links inserted 2 days ago");
  assert.equal(links[0].url, "https://mozilla3.com/2", "Expected 1-st link");
  assert.equal(links[1].url, "https://mozilla4.com/3", "Expected 2-nd link");

  // test beforeDate functionality
  links = yield provider.getRecentLinks({afterDate: theDate});
  assert.equal(links.length, 2, "should only see two links inserted after the date");
  assert.equal(links[0].url, "https://mozilla2.com/1", "Expected 1-st link");
  assert.equal(links[1].url, "https://mozilla1.com/0", "Expected 2-nd link");
};

exports.test_Links_getFrecentLinks = function*(assert) {
  let provider = PlacesProvider.links;
  let {
    TRANSITION_TYPED,
    TRANSITION_LINK
  } = PlacesUtils.history;

  let visits = [
    // has bookmark
    {uri: NetUtil.newURI("https://mozilla5.com/4"), visitDate: timeDaysAgo(2), transition: TRANSITION_LINK},
    // frecency 200
    {uri: NetUtil.newURI("https://mozilla1.com/0"), visitDate: timeDaysAgo(1), transition: TRANSITION_TYPED},
    // sort by url, frecency 200
    {uri: NetUtil.newURI("https://mozilla2.com/1"), visitDate: timeDaysAgo(0), transition: TRANSITION_TYPED},
    // sort by last visit date, frecency 200
    {uri: NetUtil.newURI("https://mozilla3.com/2"), visitDate: timeDaysAgo(4), transition: TRANSITION_TYPED},
    // sort by frecency, frecency 10
    {uri: NetUtil.newURI("https://mozilla4.com/3"), visitDate: timeDaysAgo(0), transition: TRANSITION_LINK}
  ];

  let bookmarkItem = {url: "https://mozilla5.com/4", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK};

  let links = yield provider.getRecentLinks();
  assert.equal(links.length, 0, "empty history yields empty links");

  yield PlacesTestUtils.addVisits(visits);
  yield Bookmarks.insert(bookmarkItem);

  links = yield provider.getFrecentLinks();
  assert.equal(links.length, 4, "exepect to find 4 links");
  assert.equal(links[0].url, "https://mozilla5.com/4", "Expected 1st link");
  assert.equal(links[1].url, "https://mozilla2.com/1", "Expected 2nd link");
  assert.equal(links[2].url, "https://mozilla1.com/0", "Expected 3rd link");
  assert.equal(links[3].url, "https://mozilla4.com/3", "Expected 4th link");
};

exports.test_Links_asyncAddBookmark = function*(assert) {
  let provider = PlacesProvider.links;

  let bookmarks = [
    "https://mozilla1.com/0",
    "https://mozilla1.com/1"
  ];

  let links = yield provider.getRecentBookmarks();
  assert.equal(links.length, 0, "empty bookmarks yields empty links");
  let bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 0, "empty bookmarks yields 0 size");

  for (let url of bookmarks) {
    yield provider.asyncAddBookmark(url);
  }

  links = yield provider.getRecentBookmarks();
  assert.equal(links.length, 2, "2 bookmarks on bookmark list");
  bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 2, "size 2 for 2 bookmarks added");
};

exports.test_Links_asyncDeleteBookmark = function*(assert) {
  let provider = PlacesProvider.links;

  let bookmarks = [
    {url: "https://mozilla1.com/0", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK},
    {url: "https://mozilla1.com/1", parentGuid: "root________", type: Bookmarks.TYPE_BOOKMARK}
  ];

  let links = yield provider.getRecentBookmarks();
  assert.equal(links.length, 0, "empty bookmarks yields empty links");
  let bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 0, "empty bookmarks yields 0 size");

  for (let placeInfo of bookmarks) {
    yield Bookmarks.insert(placeInfo);
  }

  links = yield provider.getRecentBookmarks();
  assert.equal(links.length, 2, "2 bookmarks on bookmark list");
  bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, 2, "size 2 for 2 bookmarks added");

  let bookmarkGuid = links[0].bookmarkGuid;
  let deleted = yield provider.asyncDeleteBookmark(bookmarkGuid);
  assert.equal(deleted.guid, bookmarkGuid, "the correct bookmark was deleted");

  links = yield provider.getRecentBookmarks();
  assert.equal(links.length, 1, "1 bookmark after deleting");
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

  let links = yield provider.getRecentLinks();
  assert.equal(links.length, 0, "empty history yields empty links");

  yield PlacesTestUtils.addVisits(visits);
  links = yield provider.getRecentLinks();

  assert.equal(links.length, visits.length, "number of links added is the same as obtain by getRecentLinks");
  assert.equal(links[0].url, "https://mozilla2.com/1", "Expected 1-st link");
  assert.equal(links[1].url, "https://mozilla1.com/0", "Expected 2-nd link");

  // delete a link
  let deleted = yield provider.deleteHistoryLink("https://mozilla2.com/1");
  assert.equal(deleted, true, "link is deleted");
  // ensure that there's only one link left
  links = yield provider.getRecentLinks();
  assert.equal(links.length, 1, "only one link is left in history");
  assert.equal(links[0].url, "https://mozilla1.com/0", "Expected 2-nd link");
  assert.ok(isVisitDateOK(links[0].lastVisitDate), "visit date within expected range");
};

exports.test_Links_getRecentBookmarks_Order = function*(assert) {
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

  let bookmarkURLSet = new Set(bookmarks.map(bm => bm.url));

  let links = yield provider.getRecentBookmarks();
  assert.equal(links.length, 0, "empty bookmarks yields empty links");
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

  let bookmarkNotificationPromise = new Promise((resolve, reject) => {
    let addCount = 0;
    let newBookmarks = [];
    function handleEvent(eventName, data) {
      if (!bookmarkURLSet.has(data.url)) {
        reject();
      }
      addCount++;
      newBookmarks.push(data);
      if (bookmarks.length === addCount) {
        provider.off("bookmarkAdded", handleEvent);
        // Note: bookmarks are sorted by bookmarkDateCreated which depends on the order of calls made to Bookmarks.insert().
        // Thus, newBookmarks reversed represents the correct sorted order of generated bookmarks.
        resolve(newBookmarks.reverse());
      }
    }
    provider.on("bookmarkAdded", handleEvent);
  });

  let folderInfo = {parentGuid: "root________", title: "A FOLDER", type: Bookmarks.TYPE_FOLDER};
  let folder = yield Bookmarks.insert(folderInfo);

  for (let placeInfo of bookmarks) {
    yield Bookmarks.insert(placeInfo);
  }
  let createdBookmarks = yield bookmarkNotificationPromise;

  /**
   * modify lastModified for bookmarks to ensure order
   * is from most recent to least recent.
   * Synchronous!
   */
  let modifiedTime = timeDaysAgo(0);
  let conn = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase).DBConnection;
  for (let bm of createdBookmarks) {
    // we change the modified date based on creation dates, because due to asynchronicity, we don't know what got created first
    let stmt = conn.createStatement(`UPDATE moz_bookmarks SET lastModified = ${modifiedTime} WHERE guid = "${bm.bookmarkGuid}"`);
    stmt.executeStep();
    // decrement modifiedTime by daily microseconds
    modifiedTime -= (24 * 60 * 60 * 1000 * 1000);
  }

  links = yield provider.getRecentBookmarks();
  assert.equal(links.length, createdBookmarks.length, "number of bookmarks added is the same as obtain by getRecentBookmarks");

  for (let i = 0; i < links.length; i++) {
    assert.equal(links[i].url, createdBookmarks[i].url, "links are obtained in the expected order");
    assert.equal(faviconData[links[i].url], links[i].favicon, "favicon data is stored as expected");
    assert.ok(!links[i].lastVisitDate || isVisitDateOK(links[i].lastVisitDate), "set visit date is within expected range");
    assert.ok(isVisitDateOK(links[i].lastModified), "lastModified date is within expected range");
    assert.ok(isVisitDateOK(links[i].bookmarkDateCreated), "bookmarkDateCreated date is within expected range");
  }

  // test beforeDate and afterDate functionality
  // set yesterday timestamp in milliseconds
  let yesterday = timeDaysAgo(1) / 1000 - 1000;

  // this should select bookmarks modified after yesterday
  links = yield provider.getRecentBookmarks({afterDate: yesterday});
  assert.equal(links.length, 2, "Two bookmarks were modifed since yesterday");
  for (let i = 0; i < links.length; i++) {
    assert.ok(links[i].lastModified > yesterday, "bookmark lastModifed date is after yesterday");
  }

  // this should select bookmarks modified before yesterday
  links = yield provider.getRecentBookmarks({beforeDate: yesterday});
  assert.equal(links.length, 1, "One bookmark was modifed before yesterday");
  for (let i = 0; i < links.length; i++) {
    assert.ok(links[i].lastModified < yesterday, "bookmark lastModifed date is before yesterday");
  }

  bookmarksSize = yield provider.getBookmarksSize();
  assert.equal(bookmarksSize, createdBookmarks.length, "expected count of bookmarks");

  // cleanup
  yield Bookmarks.remove({guid: folder.guid});
  provider.uninit();
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

  let links = yield provider.getRecentBookmarks();
  assert.equal(links.length, 0, "empty bookmarks yields empty links");

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

  let links;
  let sizeQueryResult;

  // history
  links = yield provider.getRecentLinks();
  assert.equal(links.length, visits.length, "added links and fetched links are the same");

  provider.blockURL("https://example3.com/");
  provider.blockURL("https://example4.com/");

  links = yield provider.getRecentLinks();
  assert.equal(links.length, visits.length - 2, "fetched links have two less link");

  sizeQueryResult = yield provider.getHistorySize();
  assert.equal(sizeQueryResult, visits.length - 2, "history size honors blocklist");

  links = yield provider.getRecentLinks({ignoreBlocked: true});
  assert.equal(links.length, visits.length, "ignore blocked returns all links");
  sizeQueryResult = yield provider.getHistorySize({ignoreBlocked: true});
  assert.equal(sizeQueryResult, visits.length, "history honors ignoreBlocked");

  provider.unblockURL("https://example4.com/");

  links = yield provider.getRecentLinks();
  assert.equal(links.length, visits.length - 1, "fetched links have one less link");

  provider.unblockAll();
  links = yield provider.getRecentLinks();
  assert.equal(links.length, visits.length, "fetched links have the expected number of links");

  // bookmarks
  provider.blockURL("https://example5.com/");
  links = yield provider.getRecentBookmarks();
  assert.equal(links.length, 0, "bookmarks are blocked as well");
  sizeQueryResult = yield provider.getBookmarksSize();
  assert.equal(links.length, 0, "bookmark size is zero");

  links = yield provider.getRecentBookmarks({ignoreBlocked: true});
  assert.equal(links.length, 1, "ignore blocked returns all links");
  sizeQueryResult = yield provider.getBookmarksSize({ignoreBlocked: true});
  assert.equal(sizeQueryResult, 1, "bookmarkSize honors ignoreBlocked");

  provider.unblockURL("https://example5.com/");
  links = yield provider.getRecentBookmarks();
  assert.equal(links.length, 1, "expected number of bookmarks");
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

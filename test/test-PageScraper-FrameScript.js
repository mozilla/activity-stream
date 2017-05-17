"use strict";
const {before, after} = require("sdk/test/utils");
const tabs = require("sdk/tabs");
const promise = require("sdk/core/promise");
const httpd = require("./lib/httpd");
const {PageScraper} = require("addon/PageScraper");
const {Cc, Ci} = require("chrome");
const {doGetFile} = require("./lib/utils");

const PORT = 8091;
const PAGE_TITLE = "Test Page";
const PAGE = `http://localhost:${PORT}/dummy-frameScript.html`;
const parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);
parser.init();

let srv;
let parseCallCount = 0;
let gPageScraper;
let gMetadataStore = [];
let insertedPromise;

const gMockPreviewProvider = {
  insertMetadata(data) {
    gMetadataStore.push(data);
    insertedPromise.resolve();
  },
  asyncLinkExist() {
    return false;
  },
  processAndInsertMetadata(data) {
    this.insertMetadata(data);
  }
};
const mockTabTracker = {generateEvent() {}, handlePerformanceEvent() {}};

exports.test_frame_script_injected_in_page = function*(assert) {
  let openedTab;
  insertedPromise = promise.defer();
  // open a tab
  yield new Promise(resolve => tabs.open({
    url: PAGE,
    onReady: tab => {
      openedTab = tab;
      resolve(tab);
    }
  }));

  yield insertedPromise.promise;
  assert.equal(gMetadataStore[0].title, PAGE_TITLE, "we extracted the correct title");
  assert.equal(gMetadataStore[0].url, PAGE, "and it came from the correct page");

  yield new Promise(resolve => {
    openedTab.close();
    resolve();
  });
};

exports.test_blacklist_pages = function*(assert) {
  let openedTab;
  // open a tab for 'about:home' - any about:* page works
  yield new Promise(resolve => tabs.open({
    url: "about:home",
    onReady: tab => {
      openedTab = tab;
      resolve(tab);
    }
  }));

  assert.equal(parseCallCount, 0, "we did not parse the html for 'about:home'");
  assert.equal(gMetadataStore.length, 0, "we didn't insert the item into DB");

  yield new Promise(resolve => {
    openedTab.close();
    resolve();
  });
};

exports.test_parser_throws = function*(assert) {
  let openedTab;
  let parserErrorPromise = promise.defer();
  // force the parser to throw
  gPageScraper._metadataParser = {
    parseHTMLText(raw, url) {
      const error = new Error(`Could not parse ${raw} for ${url}`);
      parserErrorPromise.resolve(error);
      throw error;
    }
  };
  // open a tab
  yield new Promise(resolve => tabs.open({
    url: PAGE,
    onReady: tab => {
      openedTab = tab;
      resolve(tab);
    }
  }));

  const errorRecieved = yield parserErrorPromise;
  assert.ok(errorRecieved, "We threw an error and it was caught");
  assert.equal(gMetadataStore.length, 0, "we didn't insert any item into DB");

  yield new Promise(resolve => {
    openedTab.close();
    resolve();
  });
};

before(exports, () => {
  gPageScraper = new PageScraper(gMockPreviewProvider, mockTabTracker, {blacklist: ["about:"]});
  gPageScraper._metadataParser = {
    parseHTMLText(raw, url) {
      parseCallCount++;
      const doc = parser.parseFromString(raw, "text/html");
      return {images: [], title: doc.title, favicon_url: "favicon.ico", url};
    }
  };
  srv = httpd.startServerAsync(PORT, null, doGetFile("test/resources"));
  gPageScraper.init();
});

after(exports, function*() {
  gPageScraper.uninit();
  yield new Promise(resolve => {
    srv.stop(resolve);
  });
  gMetadataStore = [];
  parseCallCount = 0;
});

require("sdk/test").run(exports);

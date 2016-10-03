"use strict";

const {setTimeout} = require("sdk/timers");
const test = require("sdk/test");
const tabs = require("sdk/tabs");
const {before, after} = require("sdk/test/utils");
const {DOMFetcher} = require("addon/task-queue/DOMFetcher");
const httpd = require("./lib/httpd");
const {doGetFile, getFileContent} = require("./lib/utils");

const PORT = 8099;
const URL = `http://localhost:${PORT}/dummy-activitystreams.html`;
const OTHER_URL = `http://localhost:${PORT}/dummy-other.html`;
const CANONICAL_DUMMY_URL = `http://localhost:${PORT}/canonical-dummy.html`;
const CANONICAL_URL = "https://example.com/";

let SRV;
let DUMMY_DOM;
let OTHER_DUMMY_DOM;

// Compare two strings ignoring all the blank spaces
function contentCompare(stringA, stringB) {
  return stringA.replace(/[\s"]+/g, "") === stringB.replace(/[\s"]+/g, "");
}

exports["test DOM fetching when tab closed"] = function(assert, done) {
  let domFetcher = new DOMFetcher(message => {
    assert.equal(message.data.type, "document-content", "the message received have the right type");
    assert.ok(!message.data.data.urlIsCanonical, "The fetched URL is not canonical");
    assert.ok(contentCompare(message.data.data.data, DUMMY_DOM), "fetched DOM should be equal to the url content");
    domFetcher.uninit();
    done();
  });
  tabs.once("ready", tab => tab.close());
  tabs.open({url: URL});
};

exports["test DOM fetching when location change"] = function(assert, done) {
  let openTab;
  let domFetcher = new DOMFetcher(message => {
    if (message.data.data.url === URL) {
      assert.ok(contentCompare(message.data.data.data, DUMMY_DOM), "fetched DOM should be equal to the first url content.");
      setTimeout(() => openTab.close(), 500);
    } else {
      assert.equal(message.data.data.url, OTHER_URL, "the message passes the correct url.");
      assert.ok(!message.data.data.urlIsCanonical, "The fetched URL is not canonical");
      assert.ok(contentCompare(message.data.data.data, OTHER_DUMMY_DOM), "fetched DOM should be equal to the second url content.");
      domFetcher.uninit();
      done();
    }
  });
  tabs.once("ready", tab => {
    openTab = tab;
    tab.url = OTHER_URL;
  });
  tabs.open({url: URL});
};

exports["test DOM fetching with canonical link element"] = function(assert, done) {
  let domFetcher = new DOMFetcher(message => {
    assert.equal(message.data.type, "document-content", "the message received have the right type");
    assert.ok(message.data.data.urlIsCanonical, "The fetched url is canonical");
    assert.equal(message.data.data.url, CANONICAL_URL, "fetched url is the canonical one");
    domFetcher.uninit();
    done();
  });
  tabs.once("ready", tab => tab.close());
  tabs.open({url: CANONICAL_DUMMY_URL});
};

before(exports, function*() {
  DUMMY_DOM = yield getFileContent("test/resources/dummy-activitystreams.html");
  DUMMY_DOM = DUMMY_DOM.substring(DUMMY_DOM.indexOf("\n") + 1);
  OTHER_DUMMY_DOM = yield getFileContent("test/resources/dummy-other.html");
  OTHER_DUMMY_DOM = OTHER_DUMMY_DOM.substring(OTHER_DUMMY_DOM.indexOf("\n") + 1);

  SRV = httpd.startServerAsync(PORT, null, doGetFile("test/resources"));
});

after(exports, function*(name, assert) {
  yield new Promise(resolve => {
    SRV.stop(() => {
      resolve();
    });
  });
});

test.run(exports);

"use strict";

const test = require("sdk/test");
const tabs = require("sdk/tabs");
const {ActivityStreams} = require("lib/ActivityStreams");
const httpd = require("./lib/httpd");
const {doGetFile} = require("./lib/utils");
const {before, after} = require("sdk/test/utils");

const PORT = 8099;
const path = "/dummy-activitystreams.html";
const url = `http://localhost:${PORT}${path}`;
const otherUrl = `http://localhost:${PORT}/dummy-other.html`;

function log(text) {
  console.log(`setup: ${text}`); // eslint-disable-line no-console
}

let srv;
let app;
let openTabs;

exports["test load worker"] = function(assert, done) {
  app = new ActivityStreams({pageURL: url});
  function onReady(tab) {
    log("ready 1");
    if (tab.url === url) {
      assert.equal(app.workers.size, 1, "Worker is loaded");
    }
    done();
  }
  assert.equal(app.workers.size, 0, "app.workers start at 0");
  tabs.once("ready", onReady);
  tabs.open({url});
};

exports["test removing worker on url change"] = function(assert, done) {
  app = new ActivityStreams({
    pageURL: url,
    onRemoveWorker() {
      log("ready 2: change");
      assert.equal(app.workers.size, 0, "app.worker should be removed on a url change");
      done();
    }
  });
  function onReady(tab) {
    assert.equal(app.workers.size, 1, "app.worker should be added");
    tab.url = otherUrl;
    log("setting url");
  }
  tabs.once("ready", onReady);

  assert.equal(app.workers.size, 0, "app.workers start at 0");
  tabs.open({url});
};

exports["test workers for page reload"] = function(assert, done) {
  let isFirstLoad = true;
  app = new ActivityStreams({
    pageURL: url,
    onAddWorker() {
      if (isFirstLoad) {
        assert.equal(app.workers.size, 1, "start with one worker");
      } else {
        assert.equal(app.workers.size, 1, "new worker should be attached after a reload");
        done();
      }
    },
    onRemoveWorker() {
      if (isFirstLoad) {
        assert.equal(app.workers.size, 0, "first worker should get removed on reload");
        isFirstLoad = false;
      }
    }
  });

  function onReady(tab) {
    tab.reload();
  }

  assert.equal(app.workers.size, 0, "app.workers start at 0");
  tabs.once("ready", onReady);
  tabs.open({url});
};

before(exports, function() {
  srv = httpd.startServerAsync(PORT, null, doGetFile("test/resources"));
  openTabs = [];

  function onOpen(tab) {
    openTabs.push(tab);
  }
  tabs.on("open", onOpen);
});

after(exports, function(name, assert, done) {
  app.unload();
  Promise.all([
    ...openTabs.map(tab => new Promise(resolve => tab.close(resolve))),
    new Promise(resolve => srv.stop(resolve))
  ]).then(done);
});

test.run(exports);

"use strict";

const test = require("sdk/test");
const tabs = require("sdk/tabs");
const {before, after} = require("sdk/test/utils");
const httpd = require("./lib/httpd");
const {doGetFile, mockActivityStream} = require("./lib/utils");
const {CONTENT_TO_ADDON} = require("common/event-constants");

const PORT = 8099;
const PATH = "/dummy-activitystreams.html";

let url = `http://localhost:${PORT}${PATH}`;
let srv;
let app;
let openTabs;

// This is a helper function that makes sure we
// track the tab in openTabs before we continue;
// otherwise, we won't be able to close it at the end of the test.
function asyncOpenTab(urlPath) {
  return new Promise(resolve => {
    tabs.open({url: urlPath, onReady: tab => {
      openTabs.push(tab);
      app.once(CONTENT_TO_ADDON, function handler(eventName, {worker}) {
        resolve(worker);
      });
    }});
  });
}

exports["test receive message"] = function*(assert) {
  // test tab ping on load
  let pingPromise = new Promise(resolve => {
    app.on(CONTENT_TO_ADDON, function handler(eventName, {msg}) {
      if (msg.type === "PING") {
        assert.equal(msg.data, "foo", "Message data obtained");
        app.off(CONTENT_TO_ADDON, handler);
        resolve();
      }
    });
  });
  yield asyncOpenTab(url);
  yield pingPromise;
};

exports["test app.send message"] = function*(assert) {
  let pongPromise = new Promise(resolve => {
    app.on(CONTENT_TO_ADDON, function handler(eventName, {msg, worker}) {
      if (msg.type === "PINGPONG") {
        assert.ok(msg, "Pong message sent and response received");
        app.off(CONTENT_TO_ADDON, handler);
        resolve();
      }
    });
  });
  const worker = yield asyncOpenTab(url);
  app.send({type: "PONG"}, worker);
  yield pongPromise;
};

exports["test app.broadcast message"] = function*(assert) {
  let broadcastPromise = new Promise(resolve => {
    let count = 0;
    app.on(CONTENT_TO_ADDON, function handler(eventName, {msg, worker}) {
      if (msg.type === "PINGPONG_ALL") {
        count++;
        if (count === 2) {
          app.off(CONTENT_TO_ADDON, handler);
          resolve();
        }
      }
    });
  });

  // Open two tabs, so we should get 2 messages
  yield asyncOpenTab(url);
  yield asyncOpenTab(url);

  app.broadcast({type: "PONG_ALL"});
  yield broadcastPromise;
};

before(exports, function() {
  srv = httpd.startServerAsync(PORT, null, doGetFile("test/resources"));
  app = mockActivityStream({pageURL: url});
  openTabs = [];
});

after(exports, function*() {
  for (let tab of openTabs) {
    yield new Promise(resolve => tab.close(() => resolve()));
  }
  app.unload();
  yield new Promise(resolve => {
    srv.stop(() => {
      resolve();
    });
  });
});

test.run(exports);

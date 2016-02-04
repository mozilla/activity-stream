"use strict";

const test = require("sdk/test");
const tabs = require("sdk/tabs");
const {ActivityStreams} = require("lib/ActivityStreams");
const httpd = require("./lib/httpd");
const {doGetFile} = require("./lib/utils");
const {Task} = require("resource://gre/modules/Task.jsm", {});


const PORT = 8099;

exports["test messages"] = function (assert, done) {
  let path = "/dummy-activitystreams.html";
  let url = `http://localhost:${PORT}${path}`;
  let srv = httpd.startServerAsync(PORT, null, doGetFile("test/resources"));

  Task.spawn(function* () {
    let app = new ActivityStreams({pageURL: url});
    let openTabs = [];

    tabs.on("open", tab => {
      tab.on('ready', tab => {
        if (tab.url === url) {
          openTabs.push(tab);
        }
      });
    });

    // test tab ping on load
    let pingPromise = new Promise(resolve => {
      app.once("PING", (name, params) => {
        assert.equal(params.msg.data, "foo", "Message data obtained");
        resolve(params.worker);
      });
    });
    tabs.open(url);
    let worker = yield pingPromise;

    // test sending a message
    let pingpongPromise = new Promise(resolve => {
      app.once("PINGPONG", resolve);
    });
    app.send({type: "PONG"}, worker);
    yield pingpongPromise;

    // test message broadcast, but first open a new tab
    pingPromise = new Promise(resolve => {
      app.once("PING", resolve);
    });
    tabs.open(url);
    yield pingPromise;

    let broadcastResponsePromise = new Promise(resolve => {
      let count = 0;
      app.on("PINGPONG_ALL", function response() {
        count++;
        if (count === 2) {
          app.off("PINGPONG_ALL", response);
          resolve();
        }
      });
    });

    app.broadcast({type: "PONG_ALL"});
    yield broadcastResponsePromise;

    for (let tab of openTabs) {
      tab.close();
    }
  }).then(() => {
    srv.stop(done);
  }).catch(err => {
    console.error(err);
    srv.stop(done);
  });
};

test.run(exports);

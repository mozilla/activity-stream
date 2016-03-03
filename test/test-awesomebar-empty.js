/* globals XPCOMUtils, windowMediator */
"use strict";

const test = require("sdk/test");
const tabs = require("sdk/tabs");
const windows = require("sdk/windows").browserWindows;
const {viewFor} = require("sdk/view/core");
const {ActivityStreams} = require("lib/ActivityStreams");
const httpd = require("./lib/httpd");
const {doGetFile} = require("./lib/utils");

const {Cu} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

const PORT = 8199;

exports["test awesomebar is empty for all app urls"] = function*(assert) {
  let path = "/dummy-activitystreams.html";
  let url = `http://localhost:${PORT}${path}`;
  let srv = httpd.startServerAsync(PORT, null, doGetFile("test/resources"));
  let app = new ActivityStreams({pageURL: url});

  for (let appURL of app.appURLs) {
    yield new Promise(resolve => tabs.open({
      url: appURL,
      onReady: (tab) => {
        let browserWindow = windowMediator.getMostRecentWindow("navigator:browser");
        assert.equal(browserWindow.gURLBar.value, "");
        tab.close(resolve);
      }
    }));
  }

  app.unload();
  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports["test awesomebar is empty for all app urls in new windows too"] = function*(assert) {
  let path = "/dummy-activitystreams.html";
  let url = `http://localhost:${PORT}${path}`;
  let srv = httpd.startServerAsync(PORT, null, doGetFile("test/resources"));
  let app = new ActivityStreams({pageURL: url});

  for (let appURL of app.appURLs) {
    yield new Promise(resolve => windows.open({
      url: appURL,
      onOpen: (window) => {
        let chromeWindow = viewFor(window);
        assert.equal(chromeWindow.gURLBar.value, "");
        window.close(resolve);
      }
    }));
  }

  app.unload();
  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports["test awesomebar remains empty on route changes"] = function*(assert) {
  let path = "/dummy-activitystreams.html";
  let url = `http://localhost:${PORT}${path}`;
  let srv = httpd.startServerAsync(PORT, null, doGetFile("test/resources"));
  let app = new ActivityStreams({pageURL: url});

  let testUrl = `${url}#/some-random-hash`;

  yield new Promise(resolve => tabs.open({
    url: testUrl,
    onReady: (tab) => {
      let browserWindow = windowMediator.getMostRecentWindow("navigator:browser");

      // We don't know about this hash location so the url bar should not be empty
      assert.equal(browserWindow.gURLBar.value, testUrl);

      // Call route changed handler then verify the url bar is empty.
      app._onRouteChange();
      assert.equal(browserWindow.gURLBar.value, "");

      tab.close(resolve);
    }
  }));

  app.unload();
  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

test.run(exports);

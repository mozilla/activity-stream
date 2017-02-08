"use strict";

let Cu = Components.utils;
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Services.jsm");

/**
 * Tests that loading activity streams in private browsing mode doesn't actually
 * load the activity streams URL and instead loads about:privatebrowsing
 */
add_task(function*doesnt_load_in_private_windows() {
  const asURL = "resource://activity-streams/data/content/activity-streams.html#/";
  const privateBrowsingURL = "about:privatebrowsing";

  // create a private browsing window
  let privateWindow = yield BrowserTestUtils.openNewBrowserWindow({private: true});
  let browser = privateWindow.gBrowser.selectedBrowser;

  // try to load activity stream's url into the private window
  yield BrowserTestUtils.loadURI(browser, asURL);
  yield BrowserTestUtils.browserLoaded(browser);

  // check what the content task thinks has been loaded
  yield ContentTask.spawn(browser, {url: privateBrowsingURL}, args => {
    Assert.equal(content.location.href, args.url, "Correctly loaded about:privatebrowsing instead of activity-streams");
  });

  // close the private window
  yield BrowserTestUtils.closeWindow(privateWindow);
});

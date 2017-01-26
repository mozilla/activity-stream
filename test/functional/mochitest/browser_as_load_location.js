"use strict";

let Cu = Components.utils;
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Services.jsm");

/**
 * Tests that opening a new tab opens a page with the expected activity stream
 * URL.
 *
 * XXX /browser/components/newtab/tests/browser/browser_newtab_overrides in
 * mozilla-central is where this test was adapted from.  Once we get decide on
 * and implement how we're going to set the URL in mozilla-central, we may well
 * want to (separately from this test), clone/adapt that entire file for our
 * new setup.
 */
add_task(function*override_loads_in_browser() {
  const asURL = "resource://activity-streams/data/content/activity-streams.html#/";

  // simulate a newtab open as a user would
  BrowserOpenTab();

  // wait until the browser loads
  let browser = gBrowser.selectedBrowser;
  yield BrowserTestUtils.browserLoaded(browser);

  // check what the content task thinks has been loaded.
  yield ContentTask.spawn(browser, {url: asURL}, args => {
    Assert.equal(content.location.href, args.url.trim(), "Got right URL");
    Assert.equal(content.document.location.href, args.url.trim(), "Got right URL");
  });

  // avoid leakage
  yield BrowserTestUtils.removeTab(gBrowser.selectedTab);
});

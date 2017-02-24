"use strict";

let Cu = Components.utils;
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Services.jsm");

const ABOUT_HOME_PREF = "browser.startup.homepage";
const STARTUP_PAGE_PREF = "browser.startup.page";
const ACTIVITY_STREAM_HOME_URL = "resource://activity-streams/data/content/activity-streams.html#/HOME";
const NOT_ACTIVITY_STREAM_URL = "https://example.com";

/**
 * Tests that opening a new window loads activity stream instead of about:home
 */
add_task(function*loads_about_home() {
  // First, set the pref which allows to show the homepage during test runs. In
  // other tests, this pref is set to 0 which makes the startup pages be about:blank. By
  // setting it to 1 we let the startup page be decided by the pref 'browser.startup.homepage'
  yield SpecialPowers.pushPrefEnv({set: [[STARTUP_PAGE_PREF, 1]]});

  // open a new window and wait for it to be loaded
  let win = OpenBrowserWindow();
  yield BrowserTestUtils.waitForEvent(win, "load");
  let browser = win.gBrowser.selectedBrowser;
  yield BrowserTestUtils.browserLoaded(browser);

  // check what the content task thinks has been loaded
  yield ContentTask.spawn(browser, {url: ACTIVITY_STREAM_HOME_URL}, args => {
    Assert.equal(content.location.href, args.url, "Correctly loaded activity-stream instead of about:home");
  });

  // close the window
  yield BrowserTestUtils.closeWindow(win);
});

add_task(function*change_prefs() {
  // By default, the home page should be set to ActivityStream.
  let homeURL = Preferences.get(ABOUT_HOME_PREF);
  Assert.equal(homeURL, ACTIVITY_STREAM_HOME_URL, "Correctly overriden homepage pref");

  // If the pref is already overriden, ActivityStream shouldn't change it.
  yield SpecialPowers.pushPrefEnv({set: [[ABOUT_HOME_PREF, NOT_ACTIVITY_STREAM_URL]]});
  homeURL = Preferences.get(ABOUT_HOME_PREF);
  Assert.equal(homeURL, NOT_ACTIVITY_STREAM_URL, "Do not change back to activity stream URL");
});

"use strict";

XPCOMUtils.defineLazyModuleGetter(this, "PlacesTestUtils",
  "resource://testing-common/PlacesTestUtils.jsm");

const EventUtils = {}; // eslint-disable-line no-unused-vars
Services.scriptloader.loadSubScript("chrome://mochikit/content/tests/SimpleTest/EventUtils.js", EventUtils);

function popPrefs() {
  return SpecialPowers.popPrefEnv();
}
function pushPrefs(...prefs) {
  return SpecialPowers.pushPrefEnv({set: prefs});
}

// Activity Stream tests expect it to be enabled, and make sure to clear out any
// preloaded browsers that might have about:newtab that we don't want to test
const ACTIVITY_STREAM_PREF = "browser.newtabpage.activity-stream.enabled";
pushPrefs([ACTIVITY_STREAM_PREF, true]);
gBrowser.removePreloadedBrowser();

function clearHistoryAndBookmarks() { // eslint-disable-line no-unused-vars
  return (async function() {
    await PlacesTestUtils.clearHistory();
    await PlacesUtils.bookmarks.eraseEverything();
  })();
}

/**
 * Helper to wait for potentially preloaded browsers to "load" where a preloaded
 * page has already loaded and won't trigger "load", and a "load"ed page might
 * not necessarily have had all its javascript/render logic executed.
 */
async function waitForPreloaded(browser) {
  let readyState = await ContentTask.spawn(browser, {}, () => content.document.readyState);
  if (readyState !== "complete") {
    await BrowserTestUtils.browserLoaded(browser);
  }
}

/**
 * Helper to run Activity Stream about:newtab test tasks in content.
 *
 * @param testInfo {Function|Object}
 *   {Function} This parameter will be used as if the function were called with
 *              an Object with this parameter as "test" key's value.
 *   {Object} The following keys are expected:
 *     before {Function} Optional. Runs before and returns an arg for "test"
 *     test   {Function} The test to run in the about:newtab content task taking
 *                       an arg from "before" and returns a result to "after"
 *     after  {Function} Optional. Runs after and with the result of "test"
 */
function test_newtab(testInfo) { // eslint-disable-line no-unused-vars
  // Extract any test parts or default to just the single content task
  let {before, test: contentTask, after} = testInfo;
  if (!before) {
    before = () => ({});
  }
  if (!contentTask) {
    contentTask = testInfo;
  }
  if (!after) {
    after = () => {};
  }

  // Helper to push prefs for just this test and pop them when done
  let needPopPrefs = false;
  let scopedPushPrefs = async (...args) => {
    needPopPrefs = true;
    await pushPrefs(...args);
  };
  let scopedPopPrefs = async () => {
    if (needPopPrefs) {
      await popPrefs();
    }
  };

  // Make the test task with optional before/after and content task to run in a
  // new tab that opens and closes.
  let testTask = async () => {
    // Open about:newtab without using the default load listener
    let tab = await BrowserTestUtils.openNewForegroundTab(gBrowser, "about:newtab", false);

    // Specially wait for potentially preloaded browsers
    let browser = tab.linkedBrowser;
    await waitForPreloaded(browser);

    // Wait for React to render something
    await BrowserTestUtils.waitForCondition(() => ContentTask.spawn(browser, {},
      () => content.document.getElementById("root").children.length),
      "Should render activity stream content");

    // Chain together before -> contentTask -> after data passing
    try {
      let contentArg = await before({pushPrefs: scopedPushPrefs, tab});
      let contentResult = await ContentTask.spawn(browser, contentArg, contentTask);
      await after(contentResult);
    } finally {
      // Clean up for next tests
      await scopedPopPrefs();
      await BrowserTestUtils.removeTab(tab);
    }
  };

  // Copy the name of the content task to identify the test
  Object.defineProperty(testTask, "name", {value: contentTask.name});
  add_task(testTask);
}

async function check_highlights_elements(selector, length, message) { // eslint-disable-line no-unused-vars
  // simulate a newtab open as a user would
  BrowserOpenTab();

  // wait until the browser loads
  let browser = gBrowser.selectedBrowser;
  await waitForPreloaded(browser);

  Services.prefs.setBoolPref("browser.newtabpage.activity-stream.feeds.section.highlights", false);
  Services.prefs.setBoolPref("browser.newtabpage.activity-stream.feeds.section.highlights", true);

  await BrowserTestUtils.waitForCondition(() => content.document.querySelector(selector), `No elements matching ${selector} were found`);

  let found = await ContentTask.spawn(browser, selector, arg =>
    content.document.querySelectorAll(arg).length);
  ok(found === length, `there should be ${length} of ${selector} found ${found}`);

  // avoid leakage
  await BrowserTestUtils.removeTab(gBrowser.selectedTab);
}

async function simulate_click(target, expected_element, message) { // eslint-disable-line no-unused-vars
  // simulate a newtab open as a user would
  BrowserOpenTab();

  // wait until the browser loads
  let browser = gBrowser.selectedBrowser;
  await waitForPreloaded(browser);

  await BrowserTestUtils.waitForCondition(() => content.document.querySelector(target), `No elements matching ${target} were found`);

  // The element should be missing or hidden.
  ok(content.document.querySelector(expected_element) === null || content.document.querySelector(expected_element).hidden, message);

  EventUtils.sendMouseEvent({type: "click"}, content.document.querySelector(target), gBrowser.contentWindow);

  // The element should now be visible.
  ok(!content.document.querySelector(expected_element).hidden, message);

  // avoid leakage
  await BrowserTestUtils.removeTab(gBrowser.selectedTab);
}

async function simulate_context_menu_click(menu_item, expected_element, count, message) { // eslint-disable-line no-unused-vars
  const target = ".context-menu-button";
  const item = `.context-menu-list .context-menu-item:nth-child(${menu_item}) a`;

  // simulate a newtab open as a user would
  BrowserOpenTab();

  // wait until the browser loads
  let browser = gBrowser.selectedBrowser;
  await waitForPreloaded(browser);

  await BrowserTestUtils.waitForCondition(() => content.document.querySelector(target), `No elements matching ${target} found`);

  if (count === 0) {
    // There should be an element we want to hide.
    ok(content.document.querySelector(expected_element) !== null || !content.document.querySelector(expected_element).hidden, message);
  } else {
    // The expected element should be missing or hidden.
    ok(content.document.querySelector(expected_element) === null || content.document.querySelector(expected_element).hidden, message);
  }

  EventUtils.sendMouseEvent({type: "click"}, content.document.querySelector(target), gBrowser.contentWindow);
  ok(!content.document.querySelector(item).hidden, `menu item (${item}) should be visible`);
  EventUtils.sendMouseEvent({type: "click"}, content.document.querySelector(item), gBrowser.contentWindow);

  if (count !== 0) {
    // Need to wait for actions triggered by the click event to happen.
    await BrowserTestUtils.waitForCondition(() => content.document.querySelector(expected_element), `No elements matching ${expected_element} found`);
    // The expected element should now be visible.
    ok(!content.document.querySelector(expected_element).hidden, message);
  } else {
    // Need to wait for actions triggered by the click event to happen.
    await BrowserTestUtils.waitForCondition(() => content.document.querySelector(expected_element) === null || content.document.querySelector(expected_element).hidden, `No elements matching ${expected_element} found`);
  }
  ok(content.document.querySelectorAll(expected_element).length === count, message);

  // avoid leakage
  await BrowserTestUtils.removeTab(gBrowser.selectedTab);
}

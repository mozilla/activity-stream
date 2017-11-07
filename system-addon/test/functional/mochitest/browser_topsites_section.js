"use strict";

async function simulate_context_menu_click(menu_item, expected_element, count, message) {
  const target = ".context-menu-button";
  const item = `.context-menu-list .context-menu-item:nth-child(${menu_item}) a`;

  // simulate a newtab open as a user would
  BrowserOpenTab();

  // wait until the browser loads
  let browser = gBrowser.selectedBrowser;
  await waitForPreloaded(browser);

  await BrowserTestUtils.waitForCondition(() => content.document.querySelector(target), "wait for target");

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
    await BrowserTestUtils.waitForCondition(() => content.document.querySelector(expected_element), "wait for expected");
    // The expected element should now be visible.
    ok(!content.document.querySelector(expected_element).hidden, message);
  } else {
    // Need to wait for actions triggered by the click event to happen.
    await BrowserTestUtils.waitForCondition(() => content.document.querySelector(expected_element) === null || content.document.querySelector(expected_element).hidden, "wait for expected");
  }
  ok(content.document.querySelectorAll(expected_element).length === count, message);

  // avoid leakage
  await BrowserTestUtils.removeTab(gBrowser.selectedTab);
}

// Check TopSites edit modal shows up.
add_task(async function topsites_edit() {
  await setUpActivityStreamTest();

  await simulate_click(".edit-topsites-button button", ".edit-topsites", "should find edit topsites modal");
});

// Test pin/unpin does the right thing.
add_task(async function topsites_pin_unpin() {
  // The pref for TopSites is empty by default.
  Services.prefs.setStringPref("browser.newtabpage.activity-stream.default.sites", "https://www.youtube.com/,https://www.facebook.com/,https://www.amazon.com/,https://www.reddit.com/,https://www.wikipedia.org/,https://twitter.com/");
  await setUpActivityStreamTest();

  await simulate_context_menu_click(1, ".icon-pin-small", 1, "should find a pinned website");
  // Also used to clear pinned websites cache. Bug https://github.com/mozilla/activity-stream/issues/3800.
  await simulate_context_menu_click(1, ".icon-pin-small", 0, "should find no pinned website");
  Services.prefs.setStringPref("browser.newtabpage.activity-stream.default.sites", "");
  Services.prefs.setStringPref("browser.newtabpage.pinned", "");
});

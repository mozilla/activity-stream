"use strict";

async function simulate_context_menu_click(menu_item, expected_element, message) {
  const target = ".context-menu-button";
  const item = `${target} .context-menu-item:nth-child(${menu_item})`;
  // simulate a newtab open as a user would
  let tab = await BrowserTestUtils.openNewForegroundTab(gBrowser, "about:newtab", false);

  // wait until the browser loads
  Services.prefs.setBoolPref("browser.newtabpage.activity-stream.showTopSites", false);
  Services.prefs.setBoolPref("browser.newtabpage.activity-stream.showTopSites", true);

  debugger;

  await BrowserTestUtils.waitForCondition(() => content.document.querySelector(target), "wait for target");

  // The expected element should be missing or hidden.
  ok(content.document.querySelector(expected_element) === null || content.document.querySelector(expected_element).hidden, message);

  EventUtils.sendMouseEvent({type: "click"}, content.document.querySelector(target), gBrowser.contentWindow);
  EventUtils.sendMouseEvent({type: "click"}, content.document.querySelector(item), gBrowser.contentWindow);

  // The expected element should now be visible.
  ok(!content.document.querySelector(expected_element).hidden, message);

  // avoid leakage
  await BrowserTestUtils.removeTab(tab);
}

add_task(async function topsites_edit() {
  await setUpActivityStreamTest();
  await check_topsites();

  await simulate_click(".edit-topsites-button button", ".edit-topsites", "should find edit topsites modal");
});

add_task(async function topsites_pin_unpin() {
  await setUpActivityStreamTest();
  await check_topsites();

  await simulate_context_menu_click(1, ".icon-pin-small", "should find a pinned website");
}).only();

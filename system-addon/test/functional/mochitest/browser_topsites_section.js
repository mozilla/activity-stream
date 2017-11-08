"use strict";

add_task(async function setup() {
  registerCleanupFunction(async () => {
    Services.prefs.clearUserPref("browser.newtabpage.activity-stream.default.sites");
    Services.prefs.clearUserPref("browser.newtabpage.pinned");
    await clearHistoryAndBookmarks();
  });
});

// Check TopSites edit modal shows up.
add_task(async function topsites_edit() {
  await clearHistoryAndBookmarks();

  // it should be able to click the topsites edit button to reveal the edit topsites modal.
  await simulate_click(".edit-topsites-button button", ".edit-topsites", "should find edit topsites modal");
});

// Test pin/unpin context menu options.
add_task(async function topsites_pin_unpin() {
  // The pref for TopSites is empty by default.
  Services.prefs.setStringPref("browser.newtabpage.activity-stream.default.sites", "https://www.youtube.com/,https://www.facebook.com/,https://www.amazon.com/,https://www.reddit.com/,https://www.wikipedia.org/,https://twitter.com/");
  await clearHistoryAndBookmarks();

  // it should pin the website when we click the first option of the topsite context menu.
  await simulate_context_menu_click(1, ".icon-pin-small", 1, "should find a pinned website");
  // it should unpin the website when we click the first option of the topsite context menu.
  // topsite became pinned after the previous call.
  // Also used to clear pinned websites cache. Bug https://github.com/mozilla/activity-stream/issues/3800.
  await simulate_context_menu_click(1, ".icon-pin-small", 0, "should find no pinned website");
});

"use strict";

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

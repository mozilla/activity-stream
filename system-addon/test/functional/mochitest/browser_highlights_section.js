"use strict";

async function add_highlights_bookmark(count) {
  const bookmarks = new Array(count).fill(null).map((entry, i) => ({
    parentGuid: PlacesUtils.bookmarks.unfiledGuid,
    title: "foo",
    url: `https://mozilla${i}.com/nowNew`
  }));

  for (let placeInfo of bookmarks) {
    await PlacesUtils.bookmarks.insert(placeInfo);
  }

  // Add bookmark visits
  for (let placeInfo of bookmarks) {
    await PlacesTestUtils.addVisits(placeInfo.url);
  }
}

// Test populating highlights section with bookmarks.
add_task(async function getHighlights() {
  const count = 2;

  await setUpActivityStreamTest();
  await add_highlights_bookmark(count);

  let selector = ".card-outer:not(.placeholder)";
  let message = "found cards";

  await check_highlights_elements(selector, count, message);

  selector = ".card-context-icon.icon-bookmark-added";
  message = "found bookmarks";

  await check_highlights_elements(selector, count, message);
});

// Test highlights context menu.
add_task(async function highlights_context_menu() {
  const count = 1;

  await setUpActivityStreamTest();
  await add_highlights_bookmark(count);

  let selector = ".card-outer:not(.placeholder)";
  let message = "found cards";

  await check_highlights_elements(selector, count, message);

  await simulate_click(".section-list .context-menu-button", ".context-menu", message);
});

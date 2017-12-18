"use strict";

/**
 * Helper for setup and cleanup of Highlights section tests.
 * @param bookmarkCount Number of bookmark higlights to add
 * @param test The test case
 */
function test_highlights(bookmarkCount, test) {
  test_newtab({
    async before({tab}) {
      if (bookmarkCount) {
        await addHighlightsBookmarks(bookmarkCount);
        // Wait for HighlightsFeed to update and display the items.
        await ContentTask.spawn(tab.linkedBrowser, null, async () => {
          await ContentTaskUtils.waitForCondition(() => content.document.querySelector(".card-outer:not(.placeholder)"),
            "No highlights cards found.");
        });
      }
    },
    test,
    async after() {
      await clearHistoryAndBookmarks();
    }
  });
}

test_highlights(
  2, // Number of highlights cards
  function check_highlights_cards() {
    let found = content.document.querySelectorAll(".card-outer:not(.placeholder)").length;
    is(found, 2, "there should be 2 highlights cards");

    found = content.document.querySelectorAll(".section-list .placeholder").length;
    is(found, 1, "there should be 1 highlights placeholder");

    found = content.document.querySelectorAll(".card-context-icon.icon-bookmark-added").length;
    is(found, 2, "there should be 2 bookmark icons");
  }
);

test_highlights(
  1, // Number of highlights cards
  function check_highlights_context_menu() {
    const menuButton = content.document.querySelector(".section-list .context-menu-button");
    // Open the menu.
    menuButton.click();
    const found = content.document.querySelector(".context-menu");
    ok(found && !found.hidden, "Should find a visible context menu");
  }
);

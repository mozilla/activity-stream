/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

/**
 * Test verifies that the next top site in queue replaces a dismissed top site.
 */

test_newtab({
  before: setDefaultTopSites,
  test: async function defaultTopSites_dismiss() {
    await ContentTaskUtils.waitForCondition(() => content.document.querySelector(".top-site-icon"),
      "Topsite tippytop icon not found");

    let defaultTopSitesNumber = content.document.querySelector(".top-sites-list").querySelectorAll("[class=\"top-site-outer\"]").length;
    Assert.equal(defaultTopSitesNumber, 6, "6 top sites are loaded by default");

    let firstTopSite = content.document.querySelector(".top-sites-list li:first-child a").getAttribute("href");
    Assert.equal(firstTopSite, "https://www.youtube.com/");

    let contextMenuItems = content.openContextMenuAndGetOptions(".top-sites-list li:first-child");
    Assert.equal(contextMenuItems[4].textContent, "Dismiss", "'Dismiss' is the 5th item in the context menu list");

    contextMenuItems[4].querySelector("a").click();

    // Need to wait for dismiss action.
    await ContentTaskUtils.waitForCondition(() => content.document.querySelector(".top-sites-list li:first-child a").getAttribute("href") === "https://www.facebook.com/",
      "First topsite was dismissed");

    defaultTopSitesNumber = content.document.querySelector(".top-sites-list").querySelectorAll("[class=\"top-site-outer\"]").length;
    Assert.equal(defaultTopSitesNumber, 5, "5 top sites are displayed after one of them is dismissed");
  }
});

/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

/**
 * Test verifies that a topsite can be edited from the context menu.
 */

test_newtab({
  before: setDefaultTopSites,
  test: async function topsites_contextMenu_edit() {
    await ContentTaskUtils.waitForCondition(() => content.document.querySelector(".top-site-icon"),
      "Topsite tippytop icon not found");

    // Identify the first top site in the top sites list.
    let firstTopSite = content.document.querySelector(".top-sites-list li:first-child a").getAttribute("href");
    Assert.equal(firstTopSite, "https://www.youtube.com/", "First top site in list is correct");

    // Identify the 'Edit' menu option.
    let contextMenuItems = content.openContextMenuAndGetOptions(".top-sites-list li:first-child");
    Assert.equal(contextMenuItems[1].textContent, "Edit", "'Edit' is the 2nd item in the context menu list");

    // Click the 'Edit' menu option.
    contextMenuItems[1].querySelector("a").click();

    let topsiteForm = content.document.querySelector(".topsite-form");
    ok(topsiteForm && !topsiteForm.hidden, "Should find a visible topsite form");

    let topsiteFormInputContainer = topsiteForm.querySelector(".form-input-container");
    ok(topsiteFormInputContainer && !topsiteFormInputContainer.hidden, "Should find a visible topsite form input container");

    let topsiteFormActions = topsiteForm.querySelector(".actions");
    ok(topsiteFormActions && !topsiteFormActions.hidden, "Should find a visible topsite form actions");

    let formHeaderName = topsiteFormInputContainer.querySelector(".section-title span").textContent;
    Assert.equal(formHeaderName, "Edit Top Site", "Section's title is correct");

    let titleSection = topsiteFormInputContainer.querySelector(".fields-and-preview .form-wrapper label:first-child");
    let title = titleSection.querySelector("span").textContent;
    Assert.equal(title, "Title");

    let titleInput = titleSection.querySelector(".field  input");
    Assert.equal(titleInput.value, "youtube", "Title input is correctly populated");
    titleInput.value = "test";
    titleInput.dispatchEvent(new Event("input", { bubbles: true }));
    Assert.equal(titleInput.value, "test", "Title input is successfully updated");

    let urlSection = topsiteFormInputContainer.querySelector(".fields-and-preview .form-wrapper label:nth-child(2)");
    let url = urlSection.querySelector("span").textContent;
    Assert.equal(url, "URL");

    let urlInput = urlSection.querySelector(".field  input");
    Assert.equal(urlInput.value, "https://www.youtube.com/", "URL input is correctly populated");

    let sectionPreview = topsiteFormInputContainer.querySelector(".fields-and-preview .top-site-outer .top-site-inner");
    Assert.equal(sectionPreview.querySelector("a").getAttribute("href"), "https://www.youtube.com/", "href is correct for the preview section");
    // Verify that top site's title dynamically updates in the preview section when it is updated from the form section.
    Assert.equal(sectionPreview.querySelector("div:nth-child(2) span").textContent, "test", "Title successfully updated in the preview section");

    let cancelBtn = topsiteFormActions.querySelector("button:first-child span").textContent;
    Assert.equal(cancelBtn, "Cancel", "Found the 'Cancel' button");

    let saveBtn = topsiteFormActions.querySelector("button:nth-child(2) span").textContent;
    Assert.equal(saveBtn, "Save", "Found the 'Save' button");

    // Click the 'Save' button.
    topsiteFormActions.querySelector("button.done").click();

    // Need to wait for pin action.
    await ContentTaskUtils.waitForCondition(() => content.document.querySelector(".icon-pin-small"),
      "No pinned icon found");

    let pinnedIcon = content.document.querySelectorAll(".icon-pin-small").length;
    is(pinnedIcon, 1, "should find 1 pinned topsite");

    // Need to check that the first site kept its position.
    firstTopSite = content.document.querySelector(".top-sites-list li:first-child a").getAttribute("href");
    Assert.equal(firstTopSite, "https://www.youtube.com/", "After pin topsite keeps its position in the topsite list");

    // Verify that first's top site title is dynamically updated in the top sites list.
    let titleTopSiteList = content.document.querySelector(".title.pinned span").textContent;
    Assert.equal(titleTopSiteList, "test", "Updated title from the top sites edit view should persist in the main view");
  }
});

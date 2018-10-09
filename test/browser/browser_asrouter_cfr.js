const {CFRPageActions} =
  ChromeUtils.import("resource://activity-stream/lib/CFRPageActions.jsm", {});
const {ASRouter} =
  ChromeUtils.import("resource://activity-stream/lib/ASRouter.jsm", {});

function trigger_cfr_panel(browser, trigger, action) {
  return CFRPageActions.addRecommendation(
    browser,
    trigger,
    {
      content: {
        notification_text: "Mochitest",
        heading_text: "Mochitest",
        info_icon: {
          label: {attributes: {tooltiptext: "Why am I seeing this"}},
          sumo_path: "extensionrecommendations",
        },
        addon: {
          title: "Addon name",
          icon: "foo",
          author: "Author name",
          amo_url: "https://example.com",
        },
        text: "Mochitest",
        buttons: {
          primary: {
            label: {
              value: "OK",
              attributes: {accesskey: "O"},
            },
            action: {
              type: action.type,
              data: {url: action.url}
            }
          },
          secondary: {
            label: {
              value: "Cancel",
              attributes: {accesskey: "C"},
            },
          },
        },
      },
    },
    ASRouter.dispatch
  );
}

add_task(async function test_cfr_notification_show() {
  // addRecommendation checks that scheme starts with http and host matches
  let browser = gBrowser.selectedBrowser;
  await BrowserTestUtils.loadURI(browser, "http://example.com/");
  await BrowserTestUtils.browserLoaded(browser, false, "http://example.com/");

  const response = await trigger_cfr_panel(browser, "example.com", {type: "FOO"});
  Assert.ok(response, "Should return true if addRecommendation checks were successful");

  const showPanel = BrowserTestUtils.waitForEvent(PopupNotifications.panel, "popupshown");
  // Open the panel
  document.getElementById("contextual-feature-recommendation").click();
  await showPanel;

  Assert.ok(document.getElementById("contextual-feature-recommendation-notification").hidden === false,
    "Panel should be visible");

  // Check there is a primary button and click it. It will trigger the callback.
  Assert.ok(document.getElementById("contextual-feature-recommendation-notification").button);
  let hidePanel = BrowserTestUtils.waitForEvent(PopupNotifications.panel, "popuphidden");
  document.getElementById("contextual-feature-recommendation-notification").button.click();
  await hidePanel;

  // Clicking the primary action also removes the notification
  Assert.equal(PopupNotifications._currentNotifications.length, 0,
    "Should have removed the notification");
});

add_task(async function test_cfr_addon_install() {
  // addRecommendation checks that scheme starts with http and host matches
  CFRPageActions._maybeAddAddonInstallURL = x => x;

  const browser = gBrowser.selectedBrowser;
  await BrowserTestUtils.loadURI(browser, "http://example.com/");
  await BrowserTestUtils.browserLoaded(browser, false, "http://example.com/");

  const response = await trigger_cfr_panel(browser, "example.com", {type: "INSTALL_ADDON_FROM_URL", url: "http://example.com"});
  Assert.ok(response, "Should return true if addRecommendation checks were successful");

  const showPanel = BrowserTestUtils.waitForEvent(PopupNotifications.panel, "popupshown");
  // Open the panel
  document.getElementById("contextual-feature-recommendation").click();
  await showPanel;

  Assert.ok(document.getElementById("contextual-feature-recommendation-notification").hidden === false,
    "Panel should be visible");

  // Check there is a primary button and click it. It will trigger the callback.
  Assert.ok(document.getElementById("contextual-feature-recommendation-notification").button);
  const hidePanel = BrowserTestUtils.waitForEvent(PopupNotifications.panel, "popuphidden");
  document.getElementById("contextual-feature-recommendation-notification").button.click();
  await hidePanel;

  await BrowserTestUtils.waitForEvent(PopupNotifications.panel, "popupshown");

  let notification = PopupNotifications.panel.childNodes[0];
  Assert.ok(notification.id === "addon-progress-notification" ||
    notification.id === "addon-install-failed-notification", "Should try to install the addon");
});

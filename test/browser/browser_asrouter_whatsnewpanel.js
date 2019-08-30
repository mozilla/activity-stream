const { PanelTestProvider } = ChromeUtils.import(
  "resource://activity-stream/lib/PanelTestProvider.jsm"
);
const { ToolbarPanelHub } = ChromeUtils.import(
  "resource://activity-stream/lib/ToolbarPanelHub.jsm"
);

add_task(async function test_messages_rendering() {
  const msgs = (await PanelTestProvider.getMessages()).filter(
    ({ template }) => template === "whatsnew_panel_message"
  );

  Assert.ok(msgs.length, "FxA test message exists");

  Object.defineProperty(ToolbarPanelHub, "messages", {
    get: () => Promise.resolve(msgs),
    configurable: true,
  });

  await ToolbarPanelHub.enableAppmenuButton();

  const promisePanelOpen = new Promise(resolve =>
    UITour.showMenu(window, "appMenu", resolve)
  );

  await promisePanelOpen;

  Assert.ok(
    document.getElementById("appMenu-mainView").hidden === false,
    "Panel is visible"
  );

  const whatsNewBtn = document.getElementById("appMenu-whatsnew-button");

  Assert.ok(whatsNewBtn.hidden === false, "What's New is present");

  // Show the What's New Messages
  whatsNewBtn.click();

  await BrowserTestUtils.waitForCondition(
    () =>
      document.getElementById("PanelUI-whatsNew-message-container") &&
      document.querySelectorAll(
        "#PanelUI-whatsNew-message-container .whatsNew-message"
      ).length === msgs.length
  );

  info(`${msgs.length} What's New messages rendered.`);

  UITour.hideMenu(window, "appMenu");
});

/* globals XPCOMUtils, Services */
"use strict";

const {Cu} = require("chrome");
const test = require("sdk/test");
const windows = require("sdk/windows").browserWindows;
const {viewFor} = require("sdk/view/core");
const {ShareProvider} = require("lib/ShareProvider");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
                                  "resource://gre/modules/Services.jsm");

const BUTTON_ID = "activity-stream-share-button";
const PANEL_ID = "PanelUI-shareMenuView";

exports["test share menu button is created"] = function*(assert) {
  let provider = new ShareProvider();
  yield provider.init();

  yield new Promise(resolve => windows.open({
    url: "about:home",
    onOpen: window => {
      let chromeWindow = viewFor(window);
      let button = chromeWindow.document.getElementById(BUTTON_ID);
      assert.ok(button);
      window.close(resolve);
    }
  }));

  yield provider.uninit("uninstall");
};

exports["test share menu button is disabled on about: pages"] = function*(assert) {
  let provider = new ShareProvider();
  yield provider.init();

  for (let url of ["about:newtab", "about:home", "about:blank"]) {
    yield new Promise(resolve => windows.open({
      url,
      onOpen: window => {
        let chromeWindow = viewFor(window);
        let button = chromeWindow.document.getElementById(BUTTON_ID);
        assert.ok(button.disabled);
        window.close(resolve);
      }
    }));
  }

  yield provider.uninit("uninstall");
};

exports["test share menu button is enabled on example.com"] = function*(assert) {
  let provider = new ShareProvider();
  yield provider.init();

  yield new Promise(resolve => windows.open({
    url: "http://example.com",
    onOpen: window => {
      let chromeWindow = viewFor(window);
      let button = chromeWindow.document.getElementById(BUTTON_ID);
      assert.ok(button.disabled);
      window.close(resolve);
    }
  }));

  yield provider.uninit("uninstall");
};

exports["test share menu dropdown has default providers"] = function*(assert) {
  let provider = new ShareProvider();
  yield provider.init();

  yield new Promise(resolve => windows.open({
    url: "http://example.com",
    onOpen: window => {
      let chromeWindow = viewFor(window);
      let panel = chromeWindow.document.getElementById(PANEL_ID);
      assert.ok(panel.childNodes[0].attributes.label.value, "Copy Address");
      assert.ok(panel.childNodes[1].attributes.label.value, "Email Link...");
      assert.ok(panel.childNodes[3].attributes.label.value, "Facebook");
      assert.ok(panel.childNodes[4].attributes.label.value, "Twitter");
      assert.ok(panel.childNodes[5].attributes.label.value, "Tumblr");
      assert.ok(panel.childNodes[6].attributes.label.value, "LinkedIn");
      assert.ok(panel.childNodes[7].attributes.label.value, "Yahoo Mail");
      assert.ok(panel.childNodes[8].attributes.label.value, "Gmail");
      assert.ok(panel.childNodes[9].attributes.label.value, "Add");
      assert.ok(panel.childNodes[10].attributes.label.value, "Manage Services");

      window.close(resolve);
    }
  }));

  yield provider.uninit("uninstall");
};

exports["test that social api prefs are set and unset properly"] = function*(assert) {
  // initially, there should be no active providers
  assert.ok(!Services.prefs.prefHasUserValue("social.activeProviders"));

  let provider = new ShareProvider();
  yield provider.init();

  assert.ok(Services.prefs.prefHasUserValue("social.activeProviders"));

  yield provider.uninit("uninstall");

  // verify we clean up on uninstall
  assert.ok(!Services.prefs.prefHasUserValue("social.activeProviders"));
};

test.run(exports);

/* globals XPCOMUtils, Services, Social */
"use strict";

const {Cc, Ci, Cu} = require("chrome");
const test = require("sdk/test");
const windows = require("sdk/windows").browserWindows;
const {viewFor} = require("sdk/view/core");
const {ShareProvider} = require("addon/ShareProvider");
const DEFAULT_MANIFEST_PREFS = require("addon/ShareManifests");
const SocialService = Cu.import("resource://gre/modules/SocialService.jsm", {}).SocialService;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
                                  "resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Social",
                                  "resource:///modules/Social.jsm");

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
      assert.ok(panel.childNodes[10].attributes.label.value, "Add Service");
      assert.ok(panel.childNodes[11].attributes.label.value, "Remove Service");

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

exports["test that social api prefs are not changed if user already has enabled providers"] = function*(assert) {
  // initially, there should be no active providers
  assert.ok(!Services.prefs.prefHasUserValue("social.activeProviders"));

  let key = Object.keys(DEFAULT_MANIFEST_PREFS)[0];
  let manifest = DEFAULT_MANIFEST_PREFS[key];
  let string = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
  string.data = JSON.stringify(manifest);
  Services.prefs.setComplexValue(key, Ci.nsISupportsString, string);
  yield new Promise(resolve => {
    SocialService.enableProvider(manifest.origin, resolve);
  });

  // now there is an active provider
  assert.ok(Services.prefs.prefHasUserValue("social.activeProviders"));
  let activeProviders = Services.prefs.getCharPref("social.activeProviders");

  let provider = new ShareProvider();
  yield provider.init();

  // the active providers shouldn't have changed during init
  assert.equal(activeProviders, Services.prefs.getCharPref("social.activeProviders"));

  yield provider.uninit("uninstall");

  // the active providers shouldn't have changed during uninstall
  assert.equal(activeProviders, Services.prefs.getCharPref("social.activeProviders"));

  yield new Promise(resolve => {
    SocialService.uninstallProvider(manifest.origin, () => {
      Services.prefs.clearUserPref(key);
      resolve();
    });
  });
  Services.prefs.clearUserPref("social.activeProviders");
};

exports["test that we handle user disabling and removing providers"] = function*(assert) {
  let provider = new ShareProvider();
  yield provider.init();

  function checkNumberOfMenuItems(expected) {
    return new Promise(resolve => windows.open({
      url: "http://example.com",
      onOpen: window => {
        let chromeWindow = viewFor(window);
        let panel = chromeWindow.document.getElementById(PANEL_ID);
        assert.equal(panel.childNodes.length, expected);
        window.close(resolve);
      }
    }));
  }

  yield checkNumberOfMenuItems(12);

  // uninstall a provider and verify we now have 1 less item than before
  yield new Promise(resolve => {
    SocialService.uninstallProvider(Social.providers[0].origin, () => {
      resolve();
    });
  });
  yield checkNumberOfMenuItems(11);

  // disable a provider and verify we now have 1 less item than before
  yield new Promise(resolve => {
    SocialService.disableProvider(Social.providers[0].origin, () => {
      resolve();
    });
  });
  yield checkNumberOfMenuItems(10);

  yield provider.uninit("uninstall");
};

test.run(exports);

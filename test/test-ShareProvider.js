/* globals */
"use strict";

const test = require("sdk/test");
const windows = require("sdk/windows").browserWindows;
const {viewFor} = require("sdk/view/core");
const {ShareProvider} = require("lib/ShareProvider");

const BUTTON_ID = "activity-stream-share-button";
const PANEL_ID = "PanelUI-shareMenuView";

exports["test share menu button is created"] = function*(assert) {
  let provider = new ShareProvider();

  yield new Promise(resolve => windows.open({
    url: "about:home",
    onOpen: window => {
      let chromeWindow = viewFor(window);
      let button = chromeWindow.document.getElementById(BUTTON_ID);
      assert.ok(button);
      window.close(resolve);
    }
  }));

  provider.uninit();
};

exports["test share menu button is disabled on about: pages"] = function*(assert) {
  let provider = new ShareProvider();

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

  provider.uninit();
};

exports["test share menu button is enabled on example.com"] = function*(assert) {
  let provider = new ShareProvider();

  yield new Promise(resolve => windows.open({
    url: "http://example.com",
    onOpen: window => {
      let chromeWindow = viewFor(window);
      let button = chromeWindow.document.getElementById(BUTTON_ID);
      assert.ok(button.disabled);
      window.close(resolve);
    }
  }));

  provider.uninit();
};

exports["test share menu dropdown has default providers"] = function*(assert) {
  let provider = new ShareProvider();

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

  provider.uninit();
};

test.run(exports);

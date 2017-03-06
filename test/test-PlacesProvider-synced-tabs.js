/* globals Services, XPCOMUtils, NetUtil, Weave */
"use strict";

const {before, after} = require("sdk/test/utils");
const {PlacesProvider} = require("addon/PlacesProvider");
const {PlacesTestUtils} = require("./lib/PlacesTestUtils");
const {Cc, Ci, Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://services-sync/main.js");

XPCOMUtils.defineLazyModuleGetter(global, "NetUtil",
                                  "resource://gre/modules/NetUtil.jsm");

// A mock "Tabs" engine which the SyncedTabs module will use instead of the real
// engine. We pass a constructor that Sync creates.
function MockTabsEngine() {
  this.clients = {}; // We'll set this dynamically
}

MockTabsEngine.prototype = {
  name: "tabs",
  enabled: true,

  getAllClients() {
    return this.clients;
  },

  getOpenURLs() {
    return new Set();
  }
};

// A clients engine that doesn't need to be a constructor.
let MockClientsEngine = {
  clientSettings: null, // Set in `configureClients`.

  isMobile(guid) {
    if (!guid.endsWith("desktop") && !guid.endsWith("mobile")) {
      throw new Error("this module expected guids to end with 'desktop' or 'mobile'");
    }
    return guid.endsWith("mobile");
  },
  remoteClientExists(id) {
    return this.clientSettings[id] !== false;
  },
  getClientName(id) {
    if (this.clientSettings[id]) {
      return this.clientSettings[id];
    }
    let engine = Weave.Service.engineManager.get("tabs");
    return engine.clients[id].clientName;
  }
};

function configureClients(clients, clientSettings = {}) {
  // Configure the instance Sync created.
  let engine = Weave.Service.engineManager.get("tabs");
  // each client record is expected to have an id.
  for (let guid of Object.keys(clients)) {
    clients[guid].id = guid;
  }
  engine.clients = clients;
  // Apply clients collection overrides.
  MockClientsEngine.clientSettings = clientSettings;
  // Send an observer that pretends the engine just finished a sync.
  Services.obs.notifyObservers(null, "weave:engine:sync:finish", "tabs");
}

exports.test_Links_getRemoteTabsLinks = function*(assert) {
  // configure the mock sync client with some mock data
  yield configureClients({
    guid_iphone_mobile: {
      clientName: "My iPhone",
      tabs: [
        {
          urlHistory: ["http://foo.com/"],
          icon: "http://foo.com/favicon"
        }]
    },
    guid_android_mobile: {
      clientName: "My Android",
      tabs: [
        {
          urlHistory: ["http://example.com/"],
          icon: "http://example.com/favicon"
        }]
    }
  });

  // add visits to the places DB
  let testURIFoo = NetUtil.newURI("http://foo.com/");
  yield PlacesTestUtils.addVisits(testURIFoo);
  let testURIExample = NetUtil.newURI("http://example.com/");
  yield PlacesTestUtils.addVisits(testURIExample);

  // verify the remote tabs are returned with the correct device name
  let provider = PlacesProvider.links;
  let links = yield provider.getRemoteTabsLinks();
  assert.equal(links.length, 2);
  for (let link of links) {
    if (link.url === testURIFoo.spec) {
      assert.equal(link.deviceName, "My iPhone");
    } else {
      assert.equal(link.deviceName, "My Android");
    }
  }
};

before(exports, () => {
  // Configure Sync with our mock tabs engine and force it to become initialized.
  Services.prefs.setCharPref("services.sync.username", "someone@somewhere.com");

  Weave.Service.engineManager.unregister("tabs");
  Weave.Service.engineManager.register(MockTabsEngine);
  Weave.Service.clientsEngine = MockClientsEngine;

  // Tell the Sync XPCOM service it is initialized.
  let weaveXPCService = Cc["@mozilla.org/weave/service;1"]
                          .getService(Ci.nsISupports)
                          .wrappedJSObject;
  weaveXPCService.ready = true;
});

after(exports, () => {
  // Configure Sync with our mock tabs engine and force it to become initialized.
  Services.prefs.clearUserPref("services.sync.username");

  Weave.Service.engineManager.unregister("tabs");

  let weaveXPCService = Cc["@mozilla.org/weave/service;1"]
                          .getService(Ci.nsISupports)
                          .wrappedJSObject;
  weaveXPCService.ready = false;
});

require("sdk/test").run(exports);

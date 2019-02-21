/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

ChromeUtils.defineModuleGetter(this, "PrivateBrowsingUtils",
  "resource://gre/modules/PrivateBrowsingUtils.jsm");

const FEW_MINUTES = 15 * 60 * 1000; // 15 mins

/**
 * Wait for browser startup to finish to avoid accessing uninitialized
 * properties
 */
async function checkStartupFinished(win) {
  if (!win.gBrowserInit.delayedStartupFinished) {
    await new Promise(resolve => {
      let delayedStartupObserver = (subject, topic) => {
        if (topic === "browser-delayed-startup-finished" && subject === win) {
          Services.obs.removeObserver(delayedStartupObserver, "browser-delayed-startup-finished");
          resolve();
        }
      };

      Services.obs.addObserver(delayedStartupObserver, "browser-delayed-startup-finished");
    });
  }
}

/**
 * A Map from trigger IDs to singleton trigger listeners. Each listener must
 * have idempotent `init` and `uninit` methods.
 */
this.ASRouterTriggerListeners = new Map([
  ["frequentVisits", {
    _initialized: false,
    _triggerHandler: null,
    _hosts: null,
    _visits: null,

    async init(triggerHandler, hosts) {
      if (this._initialized) {
        return;
      }
      this.onTabSwitch = this.onTabSwitch.bind(this);

      // Add listeners to all existing browser windows
      for (let win of Services.wm.getEnumerator("navigator:browser")) {
        if (win.closed || PrivateBrowsingUtils.isWindowPrivate(win)) {
          continue;
        }
        await checkStartupFinished(win);
        win.addEventListener("TabSelect", this.onTabSwitch);
        win.gBrowser.addTabsProgressListener(this);
      }

      this._initialized = true;
      this._triggerHandler = triggerHandler;
      this._visits = new Map();
      if (this._hosts) {
        hosts.forEach(h => this._hosts.add(h));
      } else {
        this._hosts = new Set(hosts); // Clone the hosts to avoid unexpected behaviour
      }
    },

    // Store visit timestamp if it's been more than FEW_MINUTES since the last
    // visit
    _updateVisits(host) {
      const visits = this._visits.get(host);
      if (visits && Date.now() - visits[0] > FEW_MINUTES) {
        this._visits.set(host, [Date.now(), ...visits]);
      }
      if (!visits) {
        this._visits.set(host, [Date.now()]);
      }
    },

    onTabSwitch(event) {
      const host = (new URL(event.currentTarget.gBrowser.currentURI.spec)).hostname;
      const aBrowser = event.currentTarget.gBrowser.selectedBrowser;
      if (this._hosts.has(host)) {
        this._updateVisits(host);
        this.triggerHandler(aBrowser, host);
      }
    },

    triggerHandler(aBrowser, host) {
      this._triggerHandler(aBrowser, {
        id: "frequentVisits",
        param: host,
        context: {recentVisits: this._visits.get(host).map(timestamp => ({host, timestamp}))},
      });
    },

    onLocationChange(aBrowser, aWebProgress, aRequest, aLocationURI, aFlags) {
      const location = aLocationURI ? aLocationURI.spec : "";
      // Some websites trigger redirect events after they finish loading even
      // though the location remains the same. This results in onLocationChange
      // events to be fired twice.
      const isSameDocument = !!(aFlags & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);
      if (location && aWebProgress.isTopLevel && !isSameDocument) {
        try {
          const host = (new URL(location)).hostname;
          if (this._hosts.has(host)) {
            this._updateVisits(host);
            this.triggerHandler(aBrowser, host);
          }
        } catch (e) {} // Couldn't parse location URL
      }
    },

    observe(win, topic, data) {
      let onLoad;

      switch (topic) {
        case "domwindowopened":
          if (!(win instanceof Ci.nsIDOMWindow) || win.closed || PrivateBrowsingUtils.isWindowPrivate(win)) {
            break;
          }
          onLoad = () => {
            // Ignore non-browser windows.
            if (win.document.documentElement.getAttribute("windowtype") === "navigator:browser") {
              win.gBrowser.addTabsProgressListener(this);
            }
          };
          win.addEventListener("load", onLoad, {once: true});
          break;

        case "domwindowclosed":
          if ((win instanceof Ci.nsIDOMWindow) &&
              win.document.documentElement.getAttribute("windowtype") === "navigator:browser") {
            win.gBrowser.removeTabsProgressListener(this);
          }
          break;
      }
    },

    uninit() {},
  }],

  /**
   * Attach listeners to every browser window to detect location changes, and
   * notify the trigger handler whenever we navigate to a URL with a hostname
   * we're looking for.
   */
  ["openURL", {
    _initialized: false,
    _triggerHandler: null,
    _hosts: null,

    /*
     * If the listener is already initialised, `init` will replace the trigger
     * handler and add any new hosts to `this._hosts`.
     */
    async init(triggerHandler, hosts = []) {
      if (!this._initialized) {
        this.onLocationChange = this.onLocationChange.bind(this);

        // Listen for new windows being opened
        Services.ww.registerNotification(this);

        // Add listeners to all existing browser windows
        for (let win of Services.wm.getEnumerator("navigator:browser")) {
          if (win.closed || PrivateBrowsingUtils.isWindowPrivate(win)) {
            continue;
          }
          await checkStartupFinished(win);
          win.gBrowser.addTabsProgressListener(this);
        }

        this._initialized = true;
      }
      this._triggerHandler = triggerHandler;
      if (this._hosts) {
        hosts.forEach(h => this._hosts.add(h));
      } else {
        this._hosts = new Set(hosts); // Clone the hosts to avoid unexpected behaviour
      }
    },

    uninit() {
      if (this._initialized) {
        Services.ww.unregisterNotification(this);

        for (let win of Services.wm.getEnumerator("navigator:browser")) {
          if (win.closed || PrivateBrowsingUtils.isWindowPrivate(win)) {
            continue;
          }

          win.gBrowser.removeTabsProgressListener(this);
        }

        this._initialized = false;
        this._triggerHandler = null;
        this._hosts = null;
      }
    },

    onLocationChange(aBrowser, aWebProgress, aRequest, aLocationURI, aFlags) {
      const location = aLocationURI ? aLocationURI.spec : "";
      // Some websites trigger redirect events after they finish loading even
      // though the location remains the same. This results in onLocationChange
      // events to be fired twice.
      const isSameDocument = !!(aFlags & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);
      if (location && aWebProgress.isTopLevel && !isSameDocument) {
        try {
          const host = (new URL(location)).hostname;
          if (this._hosts.has(host)) {
            this._triggerHandler(aBrowser, {id: "openURL", param: host});
          }
        } catch (e) {} // Couldn't parse location URL
      }
    },

    observe(win, topic, data) {
      let onLoad;

      switch (topic) {
        case "domwindowopened":
          if (!(win instanceof Ci.nsIDOMWindow) || win.closed || PrivateBrowsingUtils.isWindowPrivate(win)) {
            break;
          }
          onLoad = () => {
            // Ignore non-browser windows.
            if (win.document.documentElement.getAttribute("windowtype") === "navigator:browser") {
              win.gBrowser.addTabsProgressListener(this);
            }
          };
          win.addEventListener("load", onLoad, {once: true});
          break;

        case "domwindowclosed":
          if ((win instanceof Ci.nsIDOMWindow) &&
              win.document.documentElement.getAttribute("windowtype") === "navigator:browser") {
            win.gBrowser.removeTabsProgressListener(this);
          }
          break;
      }
    },
  }],
]);

const EXPORTED_SYMBOLS = ["ASRouterTriggerListeners"];

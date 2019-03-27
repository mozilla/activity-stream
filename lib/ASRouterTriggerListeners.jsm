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

function isPrivateWindow(win) {
  return !(win instanceof Ci.nsIDOMWindow) || win.closed || PrivateBrowsingUtils.isWindowPrivate(win);
}

/**
 * Check current location against the list of whitelisted hosts
 * Additionally verify for redirects and check original request URL against
 * the whitelist.
 *
 * @returns {string} - the host that matched the whitelist
 */
function checkHost(aLocationURI, hosts, aRequest) {
  // Check current location against whitelisted hosts
  if (hosts.has(aLocationURI.host)) {
    return aLocationURI.host;
  }

  // The original URL at the start of the request
  const originalLocation = aRequest.QueryInterface(Ci.nsIChannel).originalURI;
  // We have been redirected
  if (originalLocation.spec !== aLocationURI.spec) {
    return hosts.has(originalLocation.host) && originalLocation.host;
  }

  return false;
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
        if (isPrivateWindow(win)) {
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

    /* _updateVisits - Record visit timestamps for websites that match `this._hosts` and only
     * if it's been more than FEW_MINUTES since the last visit.
     * @param {string} host - Location host of current selected tab
     * @returns {boolean} - If the new visit has been recorded
     */
    _updateVisits(host) {
      const visits = this._visits.get(host);

      if (visits && Date.now() - visits[0] > FEW_MINUTES) {
        this._visits.set(host, [Date.now(), ...visits]);
        return true;
      }
      if (!visits) {
        this._visits.set(host, [Date.now()]);
        return true;
      }

      return false;
    },

    onTabSwitch(event) {
      if (!event.target.ownerGlobal.gBrowser) {
        return;
      }

      let host;
      const {gBrowser} = event.target.ownerGlobal;

      try {
        // nsIURI.host can throw for non-nsStandardURL nsIURIs.
        host = gBrowser.currentURI.host;
      } catch (e) {} // Couldn't parse location URL

      if (host && this._hosts.has(host)) {
        this.triggerHandler(gBrowser.selectedBrowser, host);
      }
    },

    triggerHandler(aBrowser, host) {
      const updated = this._updateVisits(host);

      // If the previous visit happend less than FEW_MINUTES ago
      // no updates were made, no need to trigger the handler
      if (!updated) {
        return;
      }

      this._triggerHandler(aBrowser, {
        id: "frequentVisits",
        param: host,
        context: {
          // Remapped to {host, timestamp} because JEXL operators can only
          // filter over collections (arrays of objects)
          recentVisits: this._visits.get(host).map(timestamp => ({host, timestamp})),
        },
      });
    },

    onLocationChange(aBrowser, aWebProgress, aRequest, aLocationURI, aFlags) {
      let host;
      try {
        host = aLocationURI ? aLocationURI.host : "";
      } catch (e) { // about: pages will throw errors
        return;
      }
      // Some websites trigger redirect events after they finish loading even
      // though the location remains the same. This results in onLocationChange
      // events to be fired twice.
      const isSameDocument = !!(aFlags & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);
      if (host && aWebProgress.isTopLevel && !isSameDocument) {
        host = checkHost(aLocationURI, this._hosts, aRequest);
        if (host) {
          this.triggerHandler(aBrowser, host);
        }
      }
    },

    observe(win, topic, data) {
      let onLoad;

      switch (topic) {
        case "domwindowopened":
          if (isPrivateWindow(win)) {
            break;
          }
          onLoad = () => {
            // Ignore non-browser windows.
            if (win.document.documentElement.getAttribute("windowtype") === "navigator:browser") {
              win.addEventListener("TabSelect", this.onTabSwitch);
              win.gBrowser.addTabsProgressListener(this);
            }
          };
          win.addEventListener("load", onLoad, {once: true});
          break;

        case "domwindowclosed":
          if ((win instanceof Ci.nsIDOMWindow) &&
              win.document.documentElement.getAttribute("windowtype") === "navigator:browser") {
            win.removeEventListener("TabSelect", this.onTabSwitch);
            win.gBrowser.removeTabsProgressListener(this);
          }
          break;
      }
    },

    uninit() {
      if (this._initialized) {
        Services.ww.unregisterNotification(this);

        for (let win of Services.wm.getEnumerator("navigator:browser")) {
          if (isPrivateWindow(win)) {
            continue;
          }

          win.removeEventListener("TabSelect", this.onTabSwitch);
          win.gBrowser.removeTabsProgressListener(this);
        }

        this._initialized = false;
        this._triggerHandler = null;
        this._hosts = null;
        this._visits = null;
      }
    },
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
          if (isPrivateWindow(win)) {
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
          if (isPrivateWindow(win)) {
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
      let host;
      try {
        host = aLocationURI ? aLocationURI.host : "";
      } catch (e) { // about: pages will throw errors
        return;
      }
      // Some websites trigger redirect events after they finish loading even
      // though the location remains the same. This results in onLocationChange
      // events to be fired twice.
      const isSameDocument = !!(aFlags & Ci.nsIWebProgressListener.LOCATION_CHANGE_SAME_DOCUMENT);
      if (host && aWebProgress.isTopLevel && !isSameDocument) {
        host = checkHost(aLocationURI, this._hosts, aRequest);
        if (host) {
          this._triggerHandler(aBrowser, {id: "openURL", param: host});
        }
      }
    },

    observe(win, topic, data) {
      let onLoad;

      switch (topic) {
        case "domwindowopened":
          if (isPrivateWindow(win)) {
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

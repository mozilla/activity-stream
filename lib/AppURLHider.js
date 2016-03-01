/* globals Services */
"use strict";

const {Cu, Ci} = require("chrome");
const tabs = require("sdk/tabs");

Cu.import("resource://gre/modules/Services.jsm");

function AppURLHider(appURLs) {
  this._appURLs = appURLs;

  this.maybeHideURL = this.maybeHideURL.bind(this);
  tabs.on("open", this.maybeHideURL);
  tabs.on("ready", this.maybeHideURL);
  tabs.on("load", this.maybeHideURL);
  tabs.on("activate", this.maybeHideURL);
  tabs.on("pageshow", this.maybeHideURL);

  this._hideAppURLs();
}

AppURLHider.prototype = {
  uninit: function() {
    tabs.removeListener("open", this.maybeHideURL);
    tabs.removeListener("ready", this.maybeHideURL);
    tabs.removeListener("load", this.maybeHideURL);
    tabs.removeListener("activate", this.maybeHideURL);
    tabs.removeListener("pageshow", this.maybeHideURL);

    Services.ww.unregisterNotification(this._windowObserver);
    delete this._cachedWindowObserver;
  },

  /**
   * Returns true if the passed URL is an app URL.
   */
  isAppURL: function(url) {
    return this._appURLs.includes(url);
  },

  /**
   * Hide the URL of the most recent window.
   */
  hideURL: function() {
    let browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
    browserWindow.gURLBar.value = "";
  },

  /**
   * Hide the URL of the most recent window if the passed in tab is on an app URL.
   */
  maybeHideURL: function(tab) {
    if (this.isAppURL(tab.url)) {
      this.hideURL();
    }
  },

  /**
   * Add the app urls to the hidden pages of the passed in window.
   */
  _addHiddenURLsTo(window) {
    if (window.gInitialPages && !window.gInitialPages.includes(this._appURLs[0])) {
      window.gInitialPages.push(...this._appURLs);
    }
  },

  /**
   * Watches for new windows and adds app urls to the list of hidden awesomebar
   * URLs.
   */
  get _windowObserver() {
    if (!this._cachedWindowObserver) {
      this._cachedWindowObserver = {
        observe: (chromeWindow, topic) => {
          if (topic === "domwindowopened") {
            let window = chromeWindow;
            window.QueryInterface(Ci.nsIDOMWindow).addEventListener("DOMContentLoaded", {
              handleEvent: () => {
                this._addHiddenURLsTo(window);
              }
            }, false);
          }
        }
      };
    }
    return this._cachedWindowObserver;
  },

  /**
   * Adds app urls to the list of hidden awesomebar URLs of each open window and
   * sets up an observer for new windows that are opened.
   */
  _hideAppURLs() {
    let enumerator = Services.wm.getEnumerator("navigator:browser");
    while (enumerator.hasMoreElements()) {
      let window = enumerator.getNext();
      this._addHiddenURLsTo(window);
    }

    Services.ww.registerNotification(this._windowObserver);
  },
};

exports.AppURLHider = AppURLHider;

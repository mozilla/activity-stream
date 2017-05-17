"use strict";

const {Cu, Ci} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm");

function AppURLHider(appURLs) {
  this._appURLs = appURLs;
  this._hideAppURLs();
}

AppURLHider.prototype = {
  uninit() {
    Services.ww.unregisterNotification(this._windowObserver);
    delete this._cachedWindowObserver;
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
            const onListen = {
              handleEvent: () => {
                this._addHiddenURLsTo(window);
                window.QueryInterface(Ci.nsIDOMWindow).removeEventListener("DOMContentLoaded", onListen, false);
              }
            };
            window.QueryInterface(Ci.nsIDOMWindow).addEventListener("DOMContentLoaded", onListen, false);
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
  }
};

exports.AppURLHider = AppURLHider;

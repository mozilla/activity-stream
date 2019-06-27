/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

ChromeUtils.defineModuleGetter(this, "EveryWindow",
  "resource:///modules/EveryWindow.jsm");

const notificationsByWindow = new WeakMap();

class _ToolbarBadgeHub {
  constructor() {
    this.id = "toolbar-badge-hub";
    this.state = null;
    this.removeAllNotifications = this.removeAllNotifications.bind(this);
    this.removeToolbarNotification = this.removeToolbarNotification.bind(this);
    this.addBadge = this.addBadge.bind(this);

    this._handleMessageRequest = null;
    this._addImpression = null;
    this._blockMessageById = null;
  }

  async init(waitForInitialized, {handleMessageRequest, addImpression, blockMessageById}) {
    this._handleMessageRequest = handleMessageRequest;
    this._blockMessageById = blockMessageById;
    this._addImpression = addImpression;
    // Need to wait for ASRouter to initialize before trying to fetch messages
    await waitForInitialized;
    this.messageRequest("firstRunFxAccounts");
  }

  async messageRequest(triggerId) {
    const message = await this._handleMessageRequest({triggerId, template: "badge"});
    if (message) {
      this.registerBadgeNotificationListener(message);
    }
  }

  registerBadgeNotificationListener(message) {
    this._addImpression(message);
    EveryWindow.registerCallback(
      this.id,
      win => {
        if (notificationsByWindow.has(win)) {
          // nothing to do
          return;
        }
        const el = this.addBadge(win, message);
        notificationsByWindow.set(win, el);
      },
      win => {
        const el = notificationsByWindow.get(win);
        this.removeToolbarNotification(el);
        notificationsByWindow.delete(win);
      }
    );
  }

  addBadge(win, message) {
    const document = win.browser.ownerDocument;
    let toolbarbutton = document.getElementById(message.content.target);
    if (toolbarbutton) {
      toolbarbutton.setAttribute("badged", true);
      toolbarbutton.querySelector(".toolbarbutton-badge").setAttribute("value", "x");

      toolbarbutton.addEventListener("click", this.removeAllNotifications, { once: true });
      this.state = { badge: { id: message.id } };

      return toolbarbutton;
    }

    return null;
  }

  removeAllNotifications() {
    // Will call uninit on every window
    EveryWindow.unregisterCallback(this.id);
    this._blockMessageById(this.state.badge.id);
    this.state = null;
  }

  removeToolbarNotification(toolbarButton) {
    toolbarButton.querySelector(".toolbarbutton-badge").removeAttribute("value");
    toolbarButton.removeAttribute("badged");
  }
}

this._ToolbarBadgeHub = _ToolbarBadgeHub;

/**
 * ToolbarBadgeHub - singleton instance of _ToolbarBadgeHub that can initiate
 * message requests and render messages.
 */
this.ToolbarBadgeHub = new _ToolbarBadgeHub();

const EXPORTED_SYMBOLS = ["ToolbarBadgeHub", "_ToolbarBadgeHub"];

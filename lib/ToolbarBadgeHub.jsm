/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

ChromeUtils.defineModuleGetter(
  this,
  "EveryWindow",
  "resource:///modules/EveryWindow.jsm"
);

const notificationsByWindow = new WeakMap();

class _ToolbarBadgeHub {
  constructor() {
    this.id = "toolbar-badge-hub";
    this.template = "toolbar_badge";
    this.state = null;
    this.removeAllNotifications = this.removeAllNotifications.bind(this);
    this.removeToolbarNotification = this.removeToolbarNotification.bind(this);
    this.addToolbarNotification = this.addToolbarNotification.bind(this);

    this._handleMessageRequest = null;
    this._addImpression = null;
    this._blockMessageById = null;
  }

  async init(
    waitForInitialized,
    { handleMessageRequest, addImpression, blockMessageById }
  ) {
    this._handleMessageRequest = handleMessageRequest;
    this._blockMessageById = blockMessageById;
    this._addImpression = addImpression;
    // Need to wait for ASRouter to initialize before trying to fetch messages
    await waitForInitialized;
    this.messageRequest("toolbarBadgeUpdate");
  }

  executeAction({ id }) {
    switch (id) {
      case "show-whatsnew-button":
        break;
    }
  }

  removeAllNotifications() {
    // Will call uninit on every window
    EveryWindow.unregisterCallback(this.id);
    this._blockMessageById(this.state.notification.id);
    this.state = null;
  }

  removeToolbarNotification(toolbarButton) {
    toolbarButton
      .querySelector(".toolbarbutton-badge")
      .removeAttribute("value");
    toolbarButton.removeAttribute("badged");
  }

  addToolbarNotification(win, message) {
    const document = win.browser.ownerDocument;
    if (message.content.action) {
      this.executeAction(message.content.action);
    }
    let toolbarbutton = document.getElementById(message.content.target);
    if (toolbarbutton) {
      toolbarbutton.setAttribute("badged", true);
      toolbarbutton
        .querySelector(".toolbarbutton-badge")
        .setAttribute("value", "x");

      toolbarbutton.addEventListener("click", this.removeAllNotifications, {
        once: true,
      });
      this.state = { notification: { id: message.id } };

      return toolbarbutton;
    }

    return null;
  }

  registerBadgeNotificationListener(message, options = {}) {
    this._addImpression(message);

    // We need to clear any existing notifications and only show
    // the one set by devtools
    if (options.force) {
      EveryWindow.unregisterCallback(this.id);
    }

    EveryWindow.registerCallback(
      this.id,
      win => {
        if (notificationsByWindow.has(win)) {
          // nothing to do
          return;
        }
        const el = this.addToolbarNotification(win, message);
        notificationsByWindow.set(win, el);
      },
      win => {
        const el = notificationsByWindow.get(win);
        this.removeToolbarNotification(el);
        notificationsByWindow.delete(win);
      }
    );
  }

  async messageRequest(triggerId) {
    const message = await this._handleMessageRequest({
      triggerId,
      template: this.template,
    });
    if (message) {
      this.registerBadgeNotificationListener(message);
    }
  }
}

this._ToolbarBadgeHub = _ToolbarBadgeHub;

/**
 * ToolbarBadgeHub - singleton instance of _ToolbarBadgeHub that can initiate
 * message requests and render messages.
 */
this.ToolbarBadgeHub = new _ToolbarBadgeHub();

const EXPORTED_SYMBOLS = ["ToolbarBadgeHub", "_ToolbarBadgeHub"];

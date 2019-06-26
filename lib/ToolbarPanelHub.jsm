/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

ChromeUtils.defineModuleGetter(
  this,
  "Services",
  "resource://gre/modules/Services.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "EveryWindow",
  "resource:///modules/EveryWindow.jsm"
);

const WHATSNEW_ENABLED_PREF = "browser.messaging-system.whatsNewPanel.enabled";

const TOOLBAR_BUTTON_ID = "whats-new-menu-button";
const APPMENU_BUTTON_ID = "appMenu-whatsnew-button";
const PANEL_HEADER_SELECTOR = "#PanelUI-whatsNew-title > label";

const BUTTON_STRING_ID = "cfr-whatsnew-button";

class _ToolbarPanelHub {
  constructor() {
    this._showAppmenuButton = this._showAppmenuButton.bind(this);
    this._hideAppmenuButton = this._hideAppmenuButton.bind(this);
    this._showToolbarButton = this._showToolbarButton.bind(this);
    this._hideToolbarButton = this._hideToolbarButton.bind(this);
  }

  init() {
    if (this.whatsNewPanelEnabled) {
      this.enableAppmenuButton();
    }
  }

  uninit() {
    EveryWindow.unregisterCallback(TOOLBAR_BUTTON_ID);
    EveryWindow.unregisterCallback(APPMENU_BUTTON_ID);
  }

  get whatsNewPanelEnabled() {
    return Services.prefs.getBoolPref(WHATSNEW_ENABLED_PREF, false);
  }

  maybeInsertFTL(win) {
    win.MozXULElement.insertFTLIfNeeded("browser/newtab/asrouter.ftl");
  }

  // Turns on the Appmenu (hamburger menu) button for all open windows and future windows.
  enableAppmenuButton() {
    EveryWindow.registerCallback(
      APPMENU_BUTTON_ID,
      this._showAppmenuButton,
      this._hideAppmenuButton
    );
  }

  // Turns on the Toolbar button for all open windows and future windows.
  enableToolbarButton() {
    EveryWindow.registerCallback(
      TOOLBAR_BUTTON_ID,
      this._showToolbarButton,
      this._hideToolbarButton
    );
  }

  _showAppmenuButton(win) {
    this.maybeInsertFTL(win);
    this._showElement(
      win.browser.ownerDocument,
      APPMENU_BUTTON_ID,
      BUTTON_STRING_ID
    );
  }

  _hideAppmenuButton(win) {
    this._hideElement(win.browser.ownerDocument, APPMENU_BUTTON_ID);
  }

  _showToolbarButton(win) {
    const document = win.browser.ownerDocument;
    this.maybeInsertFTL(win);
    this._showElement(document, TOOLBAR_BUTTON_ID, BUTTON_STRING_ID);
    // The toolbar dropdown panel uses this extra header element that is hidden
    // in the appmenu subview version of the panel. We only need to set it
    // when showing the toolbar button.
    document.l10n.setAttributes(
      document.querySelector(PANEL_HEADER_SELECTOR),
      "cfr-whatsnew-panel-header"
    );
  }

  _hideToolbarButton(win) {
    this._hideElement(win.browser.ownerDocument, TOOLBAR_BUTTON_ID);
  }

  _showElement(document, id, string_id) {
    const el = document.getElementById(id);
    document.l10n.setAttributes(el, string_id);
    el.removeAttribute("hidden");
  }

  _hideElement(document, id) {
    document.getElementById(id).setAttribute("hidden", true);
  }
}

this._ToolbarPanelHub = _ToolbarPanelHub;

/**
 * ToolbarPanelHub - singleton instance of _ToolbarPanelHub that can initiate
 * message requests and render messages.
 */
this.ToolbarPanelHub = new _ToolbarPanelHub();

const EXPORTED_SYMBOLS = ["ToolbarPanelHub", "_ToolbarPanelHub"];

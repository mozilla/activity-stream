/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

ChromeUtils.import("resource://gre/modules/Services.jsm");

ChromeUtils.defineModuleGetter(this, "PrivateBrowsingUtils",
  "resource://gre/modules/PrivateBrowsingUtils.jsm");
ChromeUtils.defineModuleGetter(this, "Services",
  "resource://gre/modules/Services.jsm");

const POPUP_NOTIFICATION_ID = "contextual-feature-recommendation";
const SUMO_BASE_URL = Services.urlFormatter.formatURLPref("app.support.baseURL");

const DELAY_BEFORE_EXPAND_MS = 1000;

/**
 * A WeakMap from browsers to {host, recommendation} pairs. Recommendations are
 * defined in the ExtensionDoorhanger.schema.json.
 *
 * A recommendation is specific to a browser and host and is active until the
 * given browser is closed or the user navigates (within that browser) away from
 * the host.
 */
let RecommendationMap = new WeakMap();

/**
 * A WeakMap from windows to their CFR PageAction.
 */
let PageActionMap = new WeakMap();

/**
 * We need one PageAction for each window
 */
class PageAction {
  constructor(win, dispatchToASRouter) {
    this.window = win;
    this.urlbar = win.document.getElementById("urlbar");
    this.container = win.document.getElementById("contextual-feature-recommendation");
    this.button = win.document.getElementById("cfr-button");
    this.label = win.document.getElementById("cfr-label");

    // This should NOT be use directly to dispatch message-defined actions attached to buttons.
    // Please use dispatchUserAction instead.
    this._dispatchToASRouter = dispatchToASRouter;

    this._popupStateChange = this._popupStateChange.bind(this);
    this._collapse = this._collapse.bind(this);
    this._handleClick = this._handleClick.bind(this);
    this.dispatchUserAction = this.dispatchUserAction.bind(this);

    // Saved timeout IDs for scheduled state changes, so they can be cancelled
    this.stateTransitionTimeoutIDs = [];

    this.container.onclick = this._handleClick;
  }

  _dispatchImpression(message) {
    this._dispatchToASRouter({type: "IMPRESSION", data: message});
  }

  async show(recommendation, shouldExpand = false) {
    this.container.hidden = false;

    this.label.value = recommendation.content.notification_text;

    // Wait for layout to flush to avoid a synchronous reflow then calculate the
    // label width. We can safely get the width even though the recommendation is
    // collapsed; the label itself remains full width (with its overflow hidden)
    await this.window.promiseDocumentFlushed;
    const [{width}] = this.label.getClientRects();
    this.urlbar.style.setProperty("--cfr-label-width", `${width}px`);

    if (shouldExpand) {
      this._clearScheduledStateChanges();

      // After one second, expand
      this._expand(DELAY_BEFORE_EXPAND_MS);

      this._dispatchImpression(recommendation);
    }
  }

  hide() {
    this.container.hidden = true;
    this._clearScheduledStateChanges();
    this.urlbar.removeAttribute("cfr-recommendation-state");
    // This is safe even if this.currentNotification is invalid/undefined
    this.window.PopupNotifications.remove(this.currentNotification);
  }

  dispatchUserAction(action) {
    this._dispatchToASRouter(
      {type: "USER_ACTION", data: action},
      {browser: this.window.gBrowser.selectedBrowser}
    );
  }

  _expand(delay = 0) {
    if (!delay) {
      // Non-delayed state change overrides any scheduled state changes
      this._clearScheduledStateChanges();
      this.urlbar.setAttribute("cfr-recommendation-state", "expanded");
    } else {
      this.stateTransitionTimeoutIDs.push(this.window.setTimeout(() => {
        this.urlbar.setAttribute("cfr-recommendation-state", "expanded");
      }, delay));
    }
  }

  _collapse(delay = 0) {
    if (!delay) {
      // Non-delayed state change overrides any scheduled state changes
      this._clearScheduledStateChanges();
      if (this.urlbar.getAttribute("cfr-recommendation-state") === "expanded") {
        this.urlbar.setAttribute("cfr-recommendation-state", "collapsed");
      }
    } else {
      this.stateTransitionTimeoutIDs.push(this.window.setTimeout(() => {
        if (this.urlbar.getAttribute("cfr-recommendation-state") === "expanded") {
          this.urlbar.setAttribute("cfr-recommendation-state", "collapsed");
        }
      }, delay));
    }
  }

  _clearScheduledStateChanges() {
    while (this.stateTransitionTimeoutIDs.length > 0) {
      // clearTimeout is safe even with invalid/expired IDs
      this.window.clearTimeout(this.stateTransitionTimeoutIDs.pop());
    }
  }

  // This is called when the popup closes as a result of interaction _outside_
  // the popup, e.g. by hitting <esc>
  _popupStateChange(state) {
    if (["dismissed", "removed"].includes(state)) {
      this._collapse();
    }
  }

  _blockMessage(messageID) {
    this._dispatchToASRouter(
      {type: "BLOCK_MESSAGE_BY_ID", data: {id: messageID}}
    );
  }

  /**
   * Respond to a user click on the recommendation by showing a doorhanger/
   * popup notification
   */
  _handleClick(event) {
    const browser = this.window.gBrowser.selectedBrowser;
    if (!RecommendationMap.has(browser)) {
      // There's no recommendation for this browser, so the user shouldn't have
      // been able to click
      this.hide();
      return;
    }
    const {content, id} = RecommendationMap.get(browser);

    // The recommendation should remain either collapsed or expanded while the
    // doorhanger is showing
    this._clearScheduledStateChanges();

    // A hacky way of setting the popup anchor outside the usual url bar icon box
    // See https://searchfox.org/mozilla-central/rev/847b64cc28b74b44c379f9bff4f415b97da1c6d7/toolkit/modules/PopupNotifications.jsm#42
    browser.cfrpopupnotificationanchor = this.container;

    const notification = this.window.document.getElementById("contextual-feature-recommendation-notification");
    const headerLabel = this.window.document.getElementById("cfr-notification-header-label");
    const headerLink = this.window.document.getElementById("cfr-notification-header-link");
    const headerImage = this.window.document.getElementById("cfr-notification-header-image");
    const author = this.window.document.getElementById("cfr-notification-author");
    const footerText = this.window.document.getElementById("cfr-notification-footer-text");
    const footerLink = this.window.document.getElementById("cfr-notification-footer-learn-more-link");

    headerLabel.value = content.heading_text;
    headerLink.setAttribute("href", SUMO_BASE_URL + content.info_icon.sumo_path);
    const isRTL = this.window.getComputedStyle(notification).direction === "rtl";
    const attribute = isRTL ? "left" : "right";
    headerLink.setAttribute(attribute, 0);
    headerImage.setAttribute("tooltiptext", content.info_icon.label);

    // Must replace with fetch of localised string
    const authorString = "By <>";
    author.textContent = authorString.replace("<>", content.addon.author);

    footerText.textContent = content.text;
    footerLink.value = "Learn more";
    footerLink.setAttribute("href", content.addon.amo_url);

    const {primary, secondary} = content.buttons;

    const mainAction = {
      label: primary.label,
      accessKey: primary.accesskey,
      callback: () => {
        this._blockMessage(id);
        this.dispatchUserAction(primary.action);
        this.hide();
        RecommendationMap.delete(browser);
      }
    };

    const secondaryActions = [{
      label: secondary.label,
      accessKey: secondary.accesskey,
      callback: () => {
        this.hide();
        RecommendationMap.delete(browser);
      }
    }];

    const options = {
      popupIconURL: content.addon.icon,
      hideClose: true,
      eventCallback: this._popupStateChange
    };

    this.currentNotification = this.window.PopupNotifications.show(
      browser,
      POPUP_NOTIFICATION_ID,
      content.addon.title,
      "cfr",
      mainAction,
      secondaryActions,
      options
    );
  }
}

function isHostMatch(browser, host) {
  return (browser.documentURI.scheme.startsWith("http") &&
    browser.documentURI.host === host);
}

const CFRPageActions = {
  // For testing purposes
  RecommendationMap,
  PageActionMap,

  /**
   * To be called from browser.js on a location change, passing in the browser
   * that's been updated
   */
  updatePageActions(browser) {
    const win = browser.ownerGlobal;
    const pageAction = PageActionMap.get(win);
    if (!pageAction || browser !== win.gBrowser.selectedBrowser) {
      return;
    }
    if (RecommendationMap.has(browser)) {
      const recommendation = RecommendationMap.get(browser);
      if (isHostMatch(browser, recommendation.host)) {
        // The browser has a recommendation specified with this host, so show
        // the page action
        pageAction.show(recommendation);
      } else {
        // The user has navigated away from the specified host in the given
        // browser, so the recommendation is no longer valid and should be removed
        RecommendationMap.delete(browser);
        pageAction.hide();
      }
    } else {
      // There's no recommendation specified for this browser, so hide the page action
      pageAction.hide();
    }
  },

  /**
   * Force a recommendation to be shown. Should only happen via the Admin page.
   * @param browser             The browser for the recommendation
   * @param recommendation      The recommendation to show
   * @param dispatchToASRouter  A function to dispatch resulting actions to
   * @return                    Did adding the recommendation succeed?
   */
  async forceRecommendation(browser, recommendation, dispatchToASRouter) {
    // If we are forcing via the Admin page, the browser comes in a different format
    const win = browser.browser.ownerGlobal;
    const {id, content} = recommendation;
    RecommendationMap.set(browser.browser, {id, content});
    if (!PageActionMap.has(win)) {
      PageActionMap.set(win, new PageAction(win, dispatchToASRouter));
    }
    await PageActionMap.get(win).show(recommendation, true);
    return true;
  },

  /**
   * Add a recommendation specific to the given browser and host.
   * @param browser             The browser for the recommendation
   * @param host                The host for the recommendation
   * @param recommendation      The recommendation to show
   * @param dispatchToASRouter  A function to dispatch resulting actions to
   * @return                    Did adding the recommendation succeed?
   */
  async addRecommendation(browser, host, recommendation, dispatchToASRouter) {
    const win = browser.ownerGlobal;
    if (PrivateBrowsingUtils.isWindowPrivate(win)) {
      return false;
    }
    if (browser !== win.gBrowser.selectedBrowser || !isHostMatch(browser, host)) {
      return false;
    }
    const {id, content} = recommendation;
    RecommendationMap.set(browser, {id, host, content});
    if (!PageActionMap.has(win)) {
      PageActionMap.set(win, new PageAction(win, dispatchToASRouter));
    }
    await PageActionMap.get(win).show(recommendation, true);
    return true;
  },

  /**
   * Clear all recommendations and hide all PageActions
   */
  clearRecommendations() {
    // WeakMaps aren't iterable so we have to test all existing windows
    for (const win of Services.wm.getEnumerator("navigator:browser")) {
      if (win.closed || !PageActionMap.has(win)) {
        continue;
      }
      PageActionMap.get(win).hide();
    }
    // WeakMaps don't have a `clear` method
    PageActionMap = new WeakMap();
    RecommendationMap = new WeakMap();
  }
};
this.CFRPageActions = CFRPageActions;

const EXPORTED_SYMBOLS = ["CFRPageActions"];

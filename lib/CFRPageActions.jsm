/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {XPCOMUtils} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
const {DOMLocalization} = ChromeUtils.import("resource://gre/modules/DOMLocalization.jsm");
const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyGlobalGetters(this, ["fetch"]);

ChromeUtils.defineModuleGetter(this, "PrivateBrowsingUtils",
  "resource://gre/modules/PrivateBrowsingUtils.jsm");

const POPUP_NOTIFICATION_ID = "contextual-feature-recommendation";
const ANIMATION_BUTTON_ID = "cfr-notification-footer-animation-button";
const ANIMATION_LABEL_ID = "cfr-notification-footer-animation-label";
const SUMO_BASE_URL = Services.urlFormatter.formatURLPref("app.support.baseURL");
const ADDONS_API_URL = "https://services.addons.mozilla.org/api/v3/addons/addon";
const ANIMATIONS_ENABLED_PREF = "toolkit.cosmeticAnimations.enabled";

const DELAY_BEFORE_EXPAND_MS = 1000;
const CATEGORY_ICONS = {
  "cfrAddons": "webextensions-icon",
  "cfrFeatures": "recommendations-icon",
};

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
    this._showPopupOnClick = this._showPopupOnClick.bind(this);
    this.dispatchUserAction = this.dispatchUserAction.bind(this);

    this._l10n = new DOMLocalization([
      "browser/newtab/asrouter.ftl",
    ]);

    // Saved timeout IDs for scheduled state changes, so they can be cancelled
    this.stateTransitionTimeoutIDs = [];
  }

  async showAddressBarNotifier(recommendation, shouldExpand = false) {
    this.container.hidden = false;

    this.label.value = await this.getStrings(recommendation.content.notification_text);
    this.button.setAttribute("data-cfr-icon", CATEGORY_ICONS[recommendation.content.category]);

    // Wait for layout to flush to avoid a synchronous reflow then calculate the
    // label width. We can safely get the width even though the recommendation is
    // collapsed; the label itself remains full width (with its overflow hidden)
    let [{width}] = await this.window.promiseDocumentFlushed(() => this.label.getClientRects());
    this.urlbar.style.setProperty("--cfr-label-width", `${width}px`);

    this.container.addEventListener("click", this._showPopupOnClick);
    // Collapse the recommendation on url bar focus in order to free up more
    // space to display and edit the url
    this.urlbar.addEventListener("focus", this._collapse);

    if (shouldExpand) {
      this._clearScheduledStateChanges();

      // After one second, expand
      this._expand(DELAY_BEFORE_EXPAND_MS);

      this._dispatchImpression(recommendation);
      // Only send an impression ping upon the first expansion.
      // Note that when the user clicks on the "show" button on the asrouter admin
      // page (both `bucket_id` and `id` will be set as null), we don't want to send
      // the impression ping in that case.
      if (!!recommendation.id && !!recommendation.content.bucket_id) {
        this._sendTelemetry({message_id: recommendation.id, bucket_id: recommendation.content.bucket_id, event: "IMPRESSION"});
      }
    }
  }

  hideAddressBarNotifier() {
    this.container.hidden = true;
    this._clearScheduledStateChanges();
    this.urlbar.removeAttribute("cfr-recommendation-state");
    this.container.removeEventListener("click", this._showPopupOnClick);
    this.urlbar.removeEventListener("focus", this._collapse);
    if (this.currentNotification) {
      this.window.PopupNotifications.remove(this.currentNotification);
      this.currentNotification = null;
    }
  }

  _expand(delay) {
    if (delay > 0) {
      this.stateTransitionTimeoutIDs.push(this.window.setTimeout(() => {
        this.urlbar.setAttribute("cfr-recommendation-state", "expanded");
      }, delay));
    } else {
      // Non-delayed state change overrides any scheduled state changes
      this._clearScheduledStateChanges();
      this.urlbar.setAttribute("cfr-recommendation-state", "expanded");
    }
  }

  _collapse(delay) {
    if (delay > 0) {
      this.stateTransitionTimeoutIDs.push(this.window.setTimeout(() => {
        if (this.urlbar.getAttribute("cfr-recommendation-state") === "expanded") {
          this.urlbar.setAttribute("cfr-recommendation-state", "collapsed");
        }
      }, delay));
    } else {
      // Non-delayed state change overrides any scheduled state changes
      this._clearScheduledStateChanges();
      if (this.urlbar.getAttribute("cfr-recommendation-state") === "expanded") {
        this.urlbar.setAttribute("cfr-recommendation-state", "collapsed");
      }
    }

    // TODO: FIXME: find a nicer way of cleaning this up. Maybe listening to "popuphidden"?
    // Remove click listener on pause button;
    if (this.onAnimationButtonClick) {
      this.window.document.getElementById(ANIMATION_BUTTON_ID).removeEventListener("click", this.onAnimationButtonClick);
      delete this.onAnimationButtonClick;
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
      if (this.currentNotification) {
        this.window.PopupNotifications.remove(this.currentNotification);
        this.currentNotification = null;
      }
    }
  }

  dispatchUserAction(action) {
    this._dispatchToASRouter(
      {type: "USER_ACTION", data: action},
      {browser: this.window.gBrowser.selectedBrowser}
    );
  }

  _dispatchImpression(message) {
    this._dispatchToASRouter({type: "IMPRESSION", data: message});
  }

  _sendTelemetry(ping) {
    this._dispatchToASRouter({
      type: "DOORHANGER_TELEMETRY",
      data: {action: "cfr_user_event", source: "CFR", ...ping},
    });
  }

  _blockMessage(messageID) {
    this._dispatchToASRouter(
      {type: "BLOCK_MESSAGE_BY_ID", data: {id: messageID}}
    );
  }

  /**
   * getStrings - Handles getting the localized strings vs message overrides.
   *              If string_id is not defined it assumes you passed in an override
   *              message and it just returns it.
   *              If subAttribute is provided, the string for it is returned.
   * @return A string. One of 1) passed in string 2) a String object with
   *         attributes property if there are attributes 3) the sub attribute.
   */
  async getStrings(string, subAttribute = "") {
    if (!string.string_id) {
      if (subAttribute) {
        if (string.attributes) {
          return string.attributes[subAttribute];
        }

        Cu.reportError(`String ${string.value} does not contain any attributes`);
        return subAttribute;
      }

      if (typeof string.value === "string") {
        const stringWithAttributes = new String(string.value); // eslint-disable-line no-new-wrappers
        stringWithAttributes.attributes = string.attributes;
        return stringWithAttributes;
      }

      return string;
    }

    const [localeStrings] = await this._l10n.formatMessages([{
      id: string.string_id,
      args: string.args,
    }]);

    const mainString = new String(localeStrings.value); // eslint-disable-line no-new-wrappers
    if (localeStrings.attributes) {
      const attributes = localeStrings.attributes.reduce((acc, attribute) => {
        acc[attribute.name] = attribute.value;
        return acc;
      }, {});
      mainString.attributes = attributes;
    }

    return subAttribute ? mainString.attributes[subAttribute] : mainString;
  }

  async _setAddonAuthorAndRating(document, content) {
    const author = this.window.document.getElementById("cfr-notification-author");
    const footerFilledStars = this.window.document.getElementById("cfr-notification-footer-filled-stars");
    const footerEmptyStars = this.window.document.getElementById("cfr-notification-footer-empty-stars");
    const footerUsers = this.window.document.getElementById("cfr-notification-footer-users");
    const footerSpacer = this.window.document.getElementById("cfr-notification-footer-spacer");

    author.textContent = await this.getStrings({
      string_id: "cfr-doorhanger-extension-author",
      args: {name: content.addon.author},
    });

    const {rating} = content.addon;
    if (rating) {
      const MAX_RATING = 5;
      const STARS_WIDTH = 17 * MAX_RATING;
      const calcWidth = stars => `${stars / MAX_RATING * STARS_WIDTH}px`;
      footerFilledStars.style.width = calcWidth(rating);
      footerEmptyStars.style.width = calcWidth(MAX_RATING - rating);

      const ratingString = await this.getStrings({
        string_id: "cfr-doorhanger-extension-rating",
        args: {total: rating},
      }, "tooltiptext");
      footerFilledStars.setAttribute("tooltiptext", ratingString);
      footerEmptyStars.setAttribute("tooltiptext", ratingString);
    } else {
      footerFilledStars.style.width = "";
      footerEmptyStars.style.width = "";
      footerFilledStars.removeAttribute("tooltiptext");
      footerEmptyStars.removeAttribute("tooltiptext");
    }

    const {users} = content.addon;
    if (users) {
      footerUsers.setAttribute("value", await this.getStrings({
        string_id: "cfr-doorhanger-extension-total-users",
        args: {total: users},
      }));
      footerUsers.removeAttribute("hidden");
    } else {
      // Prevent whitespace around empty label from affecting other spacing
      footerUsers.setAttribute("hidden", true);
      footerUsers.removeAttribute("value");
    }

    // Spacer pushes the link to the opposite end when there's other content
    if (rating || users) {
      footerSpacer.removeAttribute("hidden");
    } else {
      footerSpacer.setAttribute("hidden", true);
    }
  }

  _createElementAndAppend({type, id}, parent) {
    let element = this.window.document.createElement(type);
    if (id) {
      element.setAttribute("id", id);
    }
    parent.appendChild(element);
    return element;
  }

  async _renderPinTabAnimation() {
    const ANIMATION_CONTAINER_ID = "cfr-notification-footer-pintab-animation-container";
    const footer = this.window.document.getElementById("cfr-notification-footer");
    let animationContainer = this.window.document.getElementById(ANIMATION_CONTAINER_ID);
    if (!animationContainer) {
      animationContainer = this._createElementAndAppend({type: "vbox", id: ANIMATION_CONTAINER_ID}, footer);

      let controlsContainer = this._createElementAndAppend(
        {type: "hbox", id: "cfr-notification-footer-animation-controls"}, animationContainer);

      // spacer
      this._createElementAndAppend({type: "vbox"}, controlsContainer).setAttribute("flex", 1);

      let animationButton = this._createElementAndAppend({type: "hbox", id: ANIMATION_BUTTON_ID}, controlsContainer);

      // animation button label
      this._createElementAndAppend({type: "label", id: ANIMATION_LABEL_ID}, animationButton);
    }

    animationContainer.toggleAttribute("animate", Services.prefs.getBoolPref(ANIMATIONS_ENABLED_PREF, true));
    animationContainer.removeAttribute("paused");

    this.window.document.getElementById(ANIMATION_LABEL_ID).textContent = await this.getStrings(
      {"string_id": "cfr-doorhanger-pintab-animation-pause"});

    if (!this.onAnimationButtonClick) {
      let animationButton = this.window.document.getElementById(ANIMATION_BUTTON_ID);
      this.onAnimationButtonClick = async () => {
        let animationLabel = this.window.document.getElementById(ANIMATION_LABEL_ID);
        if (animationContainer.toggleAttribute("paused")) {
          animationLabel.textContent = await this.getStrings({"string_id": "cfr-doorhanger-pintab-animation-resume"});
        } else {
          animationLabel.textContent = await this.getStrings({"string_id": "cfr-doorhanger-pintab-animation-pause"});
        }
      };
      animationButton.addEventListener("click", this.onAnimationButtonClick);
    }
  }

  async _renderPopup(message, browser) {
    const {id, content} = message;

    const headerLabel = this.window.document.getElementById("cfr-notification-header-label");
    const headerLink = this.window.document.getElementById("cfr-notification-header-link");
    const headerImage = this.window.document.getElementById("cfr-notification-header-image");
    const footerText = this.window.document.getElementById("cfr-notification-footer-text");
    const footerLink = this.window.document.getElementById("cfr-notification-footer-learn-more-link");
    const {primary, secondary} = content.buttons;
    let primaryActionCallback;
    let options = {};
    let panelTitle;

    // Use the message category as a CSS selector to hide different parts of the
    // notification template markup
    this.window.document.getElementById("contextual-feature-recommendation-notification")
      .setAttribute("data-notification-category", message.content.category);

    headerLabel.value = await this.getStrings(content.heading_text);
    headerLink.setAttribute("href", SUMO_BASE_URL + content.info_icon.sumo_path);
    headerLink.setAttribute(this.window.RTL_UI ? "left" : "right", 0);
    headerImage.setAttribute("tooltiptext", await this.getStrings(content.info_icon.label, "tooltiptext"));
    headerLink.onclick = () => this._sendTelemetry({message_id: id, bucket_id: content.bucket_id, event: "RATIONALE"});

    footerText.textContent = await this.getStrings(content.text);

    if (content.addon) {
      await this._setAddonAuthorAndRating(this.window.document, content);
      panelTitle = await this.getStrings(content.addon.title);
      options = {popupIconURL: content.addon.icon};

      footerLink.value = await this.getStrings({string_id: "cfr-doorhanger-extension-learn-more-link"});
      footerLink.setAttribute("href", content.addon.amo_url);
      footerLink.onclick = () => this._sendTelemetry({message_id: id, bucket_id: content.bucket_id, event: "LEARN_MORE"});

      primaryActionCallback = async () => {
        primary.action.data.url = await CFRPageActions._fetchLatestAddonVersion(content.addon.id); // eslint-disable-line no-use-before-define
        this._blockMessage(id);
        this.dispatchUserAction(primary.action);
        this.hideAddressBarNotifier();
        this._sendTelemetry({message_id: id, bucket_id: content.bucket_id, event: "INSTALL"});
        RecommendationMap.delete(browser);
      };
    } else {
      const stepsContainerId = "cfr-notification-feature-steps";
      let stepsContainer = this.window.document.getElementById(stepsContainerId);
      primaryActionCallback = () => {
        this._blockMessage(id);
        this.dispatchUserAction(primary.action);
        this.hideAddressBarNotifier();
        this._sendTelemetry({message_id: id, bucket_id: content.bucket_id, event: "PIN"});
        RecommendationMap.delete(browser);
      };
      panelTitle = await this.getStrings(content.heading_text);

      if (stepsContainer) { // If it exists we need to empty it
        stepsContainer.remove();
        stepsContainer = stepsContainer.cloneNode(false);
      } else {
        stepsContainer = this.window.document.createElement("vbox");
        stepsContainer.setAttribute("id", stepsContainerId);
      }
      footerText.parentNode.appendChild(stepsContainer);
      for (let step of content.descriptionDetails.steps) {
        const li = this.window.document.createElement("li");
        this._l10n.setAttributes(li, step.string_id);
        stepsContainer.appendChild(li);
      }
      await this._l10n.translateElements([...stepsContainer.children]);

      await this._renderPinTabAnimation();
    }

    const primaryBtnStrings = await this.getStrings(primary.label);
    const mainAction = {
      label: primaryBtnStrings,
      accessKey: primaryBtnStrings.attributes.accesskey,
      callback: primaryActionCallback,
    };

    // For each secondary action, get the strings and attributes
    const secondaryBtnStrings = [];
    for (let button of secondary) {
      let label = await this.getStrings(button.label);
      secondaryBtnStrings.push({label, attributes: label.attributes});
    }
    const secondaryActions = [{
      label: secondaryBtnStrings[0].label,
      accessKey: secondaryBtnStrings[0].attributes.accesskey,
      callback: () => {
        this.dispatchUserAction(secondary[0].action);
        this._sendTelemetry({message_id: id, bucket_id: content.bucket_id, event: "DISMISS"});
      },
    }, {
      label: secondaryBtnStrings[1].label,
      accessKey: secondaryBtnStrings[1].attributes.accesskey,
      callback: () => {
        this._blockMessage(id);
        this.hideAddressBarNotifier();
        this._sendTelemetry({message_id: id, bucket_id: content.bucket_id, event: "BLOCK"});
        RecommendationMap.delete(browser);
      },
    }, {
      label: secondaryBtnStrings[2].label,
      accessKey: secondaryBtnStrings[2].attributes.accesskey,
      callback: () => {
        this.dispatchUserAction(secondary[2].action);
        this._sendTelemetry({message_id: id, bucket_id: content.bucket_id, event: "MANAGE"});
      },
    }];

    // Actually show the notification
    this.currentNotification = this.window.PopupNotifications.show(
      browser,
      POPUP_NOTIFICATION_ID,
      panelTitle,
      "cfr",
      mainAction,
      secondaryActions,
      {
        ...options,
        hideClose: true,
        eventCallback: this._popupStateChange,
      }
    );
  }

  /**
   * Respond to a user click on the recommendation by showing a doorhanger/
   * popup notification
   */
  async _showPopupOnClick(event) {
    const browser = this.window.gBrowser.selectedBrowser;
    if (!RecommendationMap.has(browser)) {
      // There's no recommendation for this browser, so the user shouldn't have
      // been able to click
      this.hideAddressBarNotifier();
      return;
    }
    const message = RecommendationMap.get(browser);
    const {id, content} = message;

    // The recommendation should remain either collapsed or expanded while the
    // doorhanger is showing
    this._clearScheduledStateChanges(browser, message);

    // A hacky way of setting the popup anchor outside the usual url bar icon box
    // See https://searchfox.org/mozilla-central/rev/847b64cc28b74b44c379f9bff4f415b97da1c6d7/toolkit/modules/PopupNotifications.jsm#42
    browser.cfrpopupnotificationanchor = this.container;

    this._sendTelemetry({message_id: id, bucket_id: content.bucket_id, event: "CLICK_DOORHANGER"});
    await this._renderPopup(message, browser);
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
        pageAction.showAddressBarNotifier(recommendation);
      } else if (recommendation.retain) {
        // Keep the recommendation first time the user navigates away just in
        // case they will go back to the previous page
        pageAction.hideAddressBarNotifier();
        recommendation.retain = false;
      } else {
        // The user has navigated away from the specified host in the given
        // browser, so the recommendation is no longer valid and should be removed
        RecommendationMap.delete(browser);
        pageAction.hideAddressBarNotifier();
      }
    } else {
      // There's no recommendation specified for this browser, so hide the page action
      pageAction.hideAddressBarNotifier();
    }
  },

  /**
   * Fetch the URL to the latest add-on xpi so the recommendation can download it.
   * @param id          The add-on ID
   * @return            A string for the URL that was fetched
   */
  async _fetchLatestAddonVersion(id) {
    let url = null;
    try {
      const response = await fetch(`${ADDONS_API_URL}/${id}/`, {credentials: "omit"});
      if (response.status !== 204 && response.ok) {
        const json = await response.json();
        url = json.current_version.files[0].url;
      }
    } catch (e) {
      Cu.reportError("Failed to get the latest add-on version for this recommendation");
    }
    return url;
  },

  /**
   * Force a recommendation to be shown. Should only happen via the Admin page.
   * @param browser                 The browser for the recommendation
   * @param recommendation  The recommendation to show
   * @param dispatchToASRouter      A function to dispatch resulting actions to
   * @return                        Did adding the recommendation succeed?
   */
  async forceRecommendation(browser, recommendation, dispatchToASRouter) {
    // If we are forcing via the Admin page, the browser comes in a different format
    const win = browser.browser.ownerGlobal;
    const {id, content} = recommendation;
    RecommendationMap.set(browser.browser, {id, retain: true, content});
    if (!PageActionMap.has(win)) {
      PageActionMap.set(win, new PageAction(win, dispatchToASRouter));
    }
    await PageActionMap.get(win).showAddressBarNotifier(recommendation, true);
    return true;
  },

  /**
   * Add a recommendation specific to the given browser and host.
   * @param browser                 The browser for the recommendation
   * @param host                    The host for the recommendation
   * @param recommendation  The recommendation to show
   * @param dispatchToASRouter      A function to dispatch resulting actions to
   * @return                        Did adding the recommendation succeed?
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
    RecommendationMap.set(browser, {id, host, retain: true, content});
    if (!PageActionMap.has(win)) {
      PageActionMap.set(win, new PageAction(win, dispatchToASRouter));
    }
    await PageActionMap.get(win).showAddressBarNotifier(recommendation, true);
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
      PageActionMap.get(win).hideAddressBarNotifier();
    }
    // WeakMaps don't have a `clear` method
    PageActionMap = new WeakMap();
    RecommendationMap = new WeakMap();
    this.PageActionMap = PageActionMap;
    this.RecommendationMap = RecommendationMap;
  },
};

this.PageAction = PageAction;
this.CFRPageActions = CFRPageActions;

const EXPORTED_SYMBOLS = ["CFRPageActions", "PageAction"];

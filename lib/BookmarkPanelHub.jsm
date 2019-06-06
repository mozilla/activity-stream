/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

ChromeUtils.defineModuleGetter(
  this,
  "FxAccounts",
  "resource://gre/modules/FxAccounts.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "Services",
  "resource://gre/modules/Services.jsm"
);
ChromeUtils.defineModuleGetter(
  this,
  "PrivateBrowsingUtils",
  "resource://gre/modules/PrivateBrowsingUtils.jsm"
);

const MARKUP_IDENTIFIERS = {
  messageHeader: "editBookmarkPanelRecommendationTitle",
  headerClass: "cfrMessageHeader",
  contentParagraph: "editBookmarkPanelRecommendationContent",
  ctaBtn: "editBookmarkPanelRecommendationCta",
  // Div that contains header, message and cta
  messageContainer: "cfrMessageContainer",
  // Bookmark panel element where the messageContainer will be attached
  panelAnchor: "editBookmarkPanelRecommendation",
  // Bookmark panel info button used to toggle the message
  infoButton: "editBookmarkPanelInfoButton",
};

class _BookmarkPanelHub {
  constructor() {
    this._id = "BookmarkPanelHub";
    this._trigger = { id: "bookmark-panel" };
    this._handleMessageRequest = null;
    this._addImpression = null;
    this._dispatch = null;
    this._initialized = false;
    this._state = null;

    this.messageRequest = this.messageRequest.bind(this);
    this.toggleRecommendation = this.toggleRecommendation.bind(this);
    this.sendUserEventTelemetry = this.sendUserEventTelemetry.bind(this);
    this.collapseMessage = this.collapseMessage.bind(this);
  }

  /**
   * @param {function} handleMessageRequest
   * @param {function} addImpression
   * @param {function} dispatch - Used for sending user telemetry information
   */
  init(handleMessageRequest, addImpression, dispatch) {
    this._handleMessageRequest = handleMessageRequest;
    this._addImpression = addImpression;
    this._dispatch = dispatch;
    this._initialized = true;
    this._state = {};
  }

  uninit() {
    this._initialized = false;
    this._handleMessageRequest = null;
    this._addImpression = null;
    this._dispatch = null;
    this._state = null;
  }

  /**
   * Checks if a similar cached requests exists before forwarding the request
   * to ASRouter. Caches only 1 request, unique identifier is `request.url`.
   * Caching ensures we don't duplicate requests and telemetry pings.
   * Return value is important for the caller to know if a message will be
   * shown.
   *
   * @returns {obj|null} response object or null if no messages matched
   */
  async messageRequest(target, win) {
    if (!this._initialized) {
      return false;
    }

    if (this._state.url === target.url && this._state.message) {
      this.showMessage(target, win, this._state.message.content);
      return true;
    }

    // If we didn't match on a previously cached request then make sure
    // the container is empty
    this._removeContainer(target, win);
    const response = await this._handleMessageRequest({
      triggerId: this._trigger.id,
    });

    return this.onResponse(target, win, response);
  }

  insertFTLIfNeeded(win) {
    // Only insert localization files if we need to show a message
    win.MozXULElement.insertFTLIfNeeded("browser/newtab/asrouter.ftl");
    win.MozXULElement.insertFTLIfNeeded("browser/branding/sync-brand.ftl");
  }

  /**
   * If the response contains a message render it and send an impression.
   * Otherwise we remove the message from the container.
   */
  onResponse(target, win, response) {
    this._state = {
      message: response,
      collapsed: false,
      url: target.url,
    };

    if (response && response.content) {
      this.insertFTLIfNeeded(win);
      this.showMessage(target, win, response.content);
      this.sendImpression();
      this.sendUserEventTelemetry("IMPRESSION", win);
    } else {
      this.removeMessage(target, win);
    }

    target.infoButton.disabled = !response;

    return !!response;
  }

  showMessage(target, win, message) {
    const { document } = win;
    if (this._state.collapsed) {
      this.toggleRecommendation(target, false);
      return;
    }

    const createElement = elem =>
      target.document.createElementNS("http://www.w3.org/1999/xhtml", elem);
    let recommendation = document.getElementById(
      MARKUP_IDENTIFIERS.messageContainer
    );
    if (!recommendation) {
      recommendation = createElement("div");
      const headerContainer = createElement("div");
      headerContainer.classList.add(MARKUP_IDENTIFIERS.headerClass);
      recommendation.setAttribute("id", MARKUP_IDENTIFIERS.messageContainer);
      recommendation.addEventListener("click", async e => {
        target.hidePopup();
        const url = await FxAccounts.config.promiseEmailFirstURI("bookmark");
        win.ownerGlobal.openLinkIn(url, "tabshifted", {
          private: false,
          triggeringPrincipal: Services.scriptSecurityManager.createNullPrincipal(
            {}
          ),
          csp: null,
        });
        this.sendUserEventTelemetry("CLICK", win);
      });
      recommendation.style.color = message.color;
      recommendation.style.background = `-moz-linear-gradient(-45deg, ${
        message.background_color_1
      } 0%, ${message.background_color_2} 70%)`;
      const close = createElement("button");
      close.setAttribute("id", "cfrClose");
      close.setAttribute("aria-label", "close");
      close.style.color = message.color;
      close.addEventListener("click", e => {
        this.sendUserEventTelemetry("DISMISS", win);
        this.collapseMessage(target);
        target.close(e);
      });
      const title = createElement("h1");
      title.setAttribute("id", MARKUP_IDENTIFIERS.messageHeader);
      const content = createElement("p");
      content.setAttribute("id", MARKUP_IDENTIFIERS.contentParagraph);
      const cta = createElement("button");
      cta.setAttribute("id", MARKUP_IDENTIFIERS.ctaBtn);

      // If `string_id` is present it means we are relying on fluent for translations
      if (message.text.string_id) {
        document.l10n.setAttributes(
          close,
          message.close_button.tooltiptext.string_id
        );
        document.l10n.setAttributes(title, message.title.string_id);
        document.l10n.setAttributes(content, message.text.string_id);
        document.l10n.setAttributes(cta, message.cta.string_id);
      } else {
        close.setAttribute("title", message.close_button.tooltiptext);
        title.textContent = message.title;
        content.textContent = message.text;
        cta.textContent = message.cta;
      }

      headerContainer.appendChild(title);
      headerContainer.appendChild(close);
      recommendation.appendChild(headerContainer);
      recommendation.appendChild(content);
      recommendation.appendChild(cta);
      target.container.appendChild(recommendation);
    }

    this.toggleRecommendation(target, true);
    this._adjustPanelHeight(win, recommendation);
  }

  /**
   * Adjust the size of the container for locales where the message is
   * longer than the fixed 150px set for height
   */
  async _adjustPanelHeight(window, messageContainer) {
    const { document } = window;
    // Contains the screenshot of the page we are bookmarking
    const screenshotContainer = document.getElementById(
      "editBookmarkPanelImage"
    );
    // Wait for strings to be added which can change element height
    await document.l10n.translateElements([messageContainer]);
    window.requestAnimationFrame(() => {
      let { height } = messageContainer.getBoundingClientRect();
      if (height > 150) {
        messageContainer.classList.add("longMessagePadding");
        // Get the new value with the added padding
        height = messageContainer.getBoundingClientRect().height;
        // Needs to be adjusted to match the message height
        screenshotContainer.style.height = `${height}px`;
      }
    });
  }

  /**
   * Restore the panel back to the original size so the slide in
   * animation can run again
   */
  _restorePanelHeight(window) {
    const { document } = window;
    // Contains the screenshot of the page we are bookmarking
    document.getElementById("editBookmarkPanelImage").style.height = "";
  }

  toggleRecommendation(target, visible) {
    if (visible === undefined) {
      // When called from the info button of the bookmark panel
      target.infoButton.checked = !target.infoButton.checked;
    } else {
      target.infoButton.checked = visible;
    }
    if (target.infoButton.checked) {
      // If it was ever collapsed we need to cancel the state
      this._state.collapsed = false;
      target.container.removeAttribute("disabled");
    } else {
      target.container.setAttribute("disabled", "disabled");
    }
  }

  collapseMessage(target) {
    this._state.collapsed = true;
    this.toggleRecommendation(target, false);
  }

  _removeContainer(target, win) {
    const container = target.document.getElementById(
      MARKUP_IDENTIFIERS.messageContainer
    );
    if (container) {
      this._restorePanelHeight(win);
      container.remove();
    }
  }

  removeMessage(target, win) {
    this._removeContainer(target, win);
    this.toggleRecommendation(target, false);
    this._state = null;
  }

  async _forceShowMessage(target, message) {
    const win = target.browser.ownerGlobal.window;
    // Bookmark the page to force the panel to show and
    // remove the bookmark when the panel is hidden
    win.StarUI.panel.addEventListener("popupshown", () => {
      win.StarUI._removeBookmarksOnPopupHidden = true;
    }, {once: true});
    await win.PlacesCommandHook.bookmarkPage();

    const doc = target.browser.ownerGlobal.gBrowser.ownerDocument;
    const panelTarget = {
      container: doc.getElementById(MARKUP_IDENTIFIERS.panelAnchor),
      infoButton: doc.getElementById(MARKUP_IDENTIFIERS.infoButton),
      document: doc,
    };
    panelTarget.close = e => {
      e.stopPropagation();
      this.toggleRecommendation(panelTarget, false);
    };
    // Remove any existing message
    this.removeMessage(panelTarget, win);

    // Reset the reference to the panel elements
    this._state = { message, collapsed: false };
    this.insertFTLIfNeeded(win);
    this.showMessage(panelTarget, win, message.content);
  }

  sendImpression() {
    this._addImpression(this._state.message);
  }

  sendUserEventTelemetry(event, win) {
    // Only send pings for non private browsing windows
    if (
      !PrivateBrowsingUtils.isBrowserPrivate(
        win.ownerGlobal.gBrowser.selectedBrowser
      )
    ) {
      this._sendTelemetry({
        message_id: this._state.message.id,
        bucket_id: this._state.message.id,
        event,
      });
    }
  }

  _sendTelemetry(ping) {
    this._dispatch({
      type: "DOORHANGER_TELEMETRY",
      data: { action: "cfr_user_event", source: "CFR", ...ping },
    });
  }
}

this._BookmarkPanelHub = _BookmarkPanelHub;

/**
 * BookmarkPanelHub - singleton instance of _BookmarkPanelHub that can initiate
 * message requests and render messages.
 */
this.BookmarkPanelHub = new _BookmarkPanelHub();

const EXPORTED_SYMBOLS = ["BookmarkPanelHub", "_BookmarkPanelHub"];

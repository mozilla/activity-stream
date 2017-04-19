/* globals content, sendAsyncMessage */

"use strict";
function DOMFetcher() {
  this.cfmm = null;
}

/*
 * This a frame script that gets injected into web pages as they are opened.
 * It collects the raw DOM, as well as it's respective url once the content is
 * loaded. It uses the Content Frame Message Manager to send a message to
 * whoever is registered, sending the DOM and the url as it's payload.
 */
DOMFetcher.prototype = {
  init(cfmm) {
    this.cfmm = cfmm;
    this.cfmm.addEventListener("DOMContentLoaded", (this._addWindowListeners.bind(this)));
  },

  _addWindowListeners(event) {
    let window = event.target.defaultView;
    if (window === this.cfmm.content) {
      this._sendContentMessage();
    }
  },

  _sendContentMessage() {
    if (content.document.documentElement) {
      const text = content.document.documentElement.outerHTML;
      const url = content.document.documentURI;
      sendAsyncMessage("page-scraper-message", {type: "PAGE_HTML", data: {text, url}});
    }
  }
};

const fetcher = new DOMFetcher();
fetcher.init(this);

/* globals content, sendAsyncMessage */

"use strict";
function DOMFetcher() {
  this.cfmm = null;
}

DOMFetcher.prototype = {
  init(cfmm) {
    this.cfmm = cfmm;
    this.cfmm.addEventListener("DOMContentLoaded", (this._addWindowListeners.bind(this)), false);
  },

  _addWindowListeners(event) {
    let window = event.target.defaultView;
    if (window === this.cfmm.content) {
      window.addEventListener("load", this._sendContentMessage, false);
    }
  },

  _sendContentMessage() {
    const text = content.document.documentElement.outerHTML;
    const url = content.document.documentURI;
    sendAsyncMessage("page-scraper-message", {type: "PAGE_HTML", data: {text, url}});
  }
};

let fetcher = new DOMFetcher();
fetcher.init(this);

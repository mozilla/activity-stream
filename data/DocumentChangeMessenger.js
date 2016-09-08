/* globals content addEventListener sendAsyncMessage */

/**
 * Listen for document unloads and send back the document content
 */
function DocumentUnloadMessenger() {
  this.cfmm = null;
}

DocumentUnloadMessenger.prototype = {
  /**
   * Initializes the object.
   *
   * @param {nsIContentFrameMessageManager} cfmm
   *   the content frame message manager (frame script global).
   */
  init(cfmm) {
    this.cfmm = cfmm;
    // Reattach unload listener to the window for every new page loaded.
    this.cfmm.addEventListener("DOMContentLoaded", (this._addWindowListeners).bind(this), false);
  },

  /**
   * Add an unload listener to the main window only.
   *
   * @param {Event} event
   *   the DOMContentLoaded event object.
   */
  _addWindowListeners(event) {
    let window = event.target.defaultView;
    if (window === this.cfmm.content) { // we don't want to get iframes
      window.addEventListener("unload", this._sendContentMessage, false);
    }
  },

  /**
   * Send a message to the chrome process with the document content.
   *
   * @param {UIEvent} event
   *   the unload event object.
   */
  _sendContentMessage(event) {
    // Tries to get the canonical URL for a page
    const canonicalLink = content.document.querySelector('link[rel="canonical"]');
    const url = canonicalLink ? canonicalLink.href : content.location.href;
    const urlIsCanonical = Boolean(canonicalLink);
    sendAsyncMessage("loci@document-metadata", {
      type: "document-content",
      data: {
        url,
        urlIsCanonical,
        data: content.document.documentElement.outerHTML
      }
    });
  }
};

let DUMessenger = new DocumentUnloadMessenger();
DUMessenger.init(this);

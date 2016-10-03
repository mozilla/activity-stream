/* globals Services */
"use strict";

const {getResourceURL} = require("./utils");
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

const FRAMESCRIPT_PATH = getResourceURL("data/DocumentChangeMessenger.js");

/**
 * An event listener that will capture the DOM
 * content of every closing HTMLDocument.
 */
function DOMFetcher(listener) {
  this.listener = listener;
  Services.mm.loadFrameScript(FRAMESCRIPT_PATH, true);
  Services.mm.addMessageListener("loci@document-metadata", this.listener, true);
}

DOMFetcher.prototype = {
  /**
   * Removes the frame script and the message listener.
   */
  uninit() {
    Services.mm.removeMessageListener("loci@document-metadata", this.listener);
    Services.mm.removeDelayedFrameScript(FRAMESCRIPT_PATH);
  }
};

exports.DOMFetcher = DOMFetcher;

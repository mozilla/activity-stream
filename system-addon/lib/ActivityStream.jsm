"use strict";


class ActivityStream {

  /**
   * constructor - Initializes an instance of ActivityStream
   *
   * @param  {object} options Options for the ActivityStream instance
   * @param  {string} options.id Add-on ID. e.g. "activity-stream@mozilla.org".
   * @param  {string} options.version Version of the add-on. e.g. "0.1.0"
   * @param  {string} options.newTabURL URL of New Tab page on which A.S. is displayed. e.g. "about:newtab"
   */
  constructor(options) {
    this.initialized = false;
    this.options = options;
  }
  init() {
    this.initialized = true;
  }
  uninit() {
    this.initialized = false;
  }
}

this.EXPORTED_SYMBOLS = ["ActivityStream"];

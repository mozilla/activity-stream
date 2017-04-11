const {actionTypes: at} = require("common/Actions.jsm");

const VISIBLE = "visible";
const VISIBILITY_CHANGE_EVENT = "visibilitychange";

module.exports = class DetectUserSessionStart {
  constructor(options = {}) {
    // Overrides for testing
    this.sendAsyncMessage = options.sendAsyncMessage || window.sendAsyncMessage;
    this.document = options.document || document;

    this._onVisibilityChange = this._onVisibilityChange.bind(this);
  }

  /**
   * sendEventOrAddListener - Notify immediately if the page is already visible,
   *                    or else set up a listener for when visibility changes.
   *                    This is needed for accurate session tracking for telemetry,
   *                    because tabs are pre-loaded.
   */
  sendEventOrAddListener() {
    if (this.document.visibilityState === VISIBLE) {
      // If the document is already visible, to the user, send a notification
      // immediately that a session has started.
      this._sendEvent();
    } else {
      // If the document is not visible, listen for when it does become visible.
      this.document.addEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
    }
  }

  /**
   * _sendEvent - Sends a message to the main process to indicate the current tab
   *             is now visible to the user.
   */
  _sendEvent() {
    this.sendAsyncMessage("ActivityStream:ContentToMain", {type: at.NEW_TAB_VISIBLE});
  }

  /**
   * _onVisibilityChange - If the visibility has changed to visible, sends a notification
   *                      and removes the event listener. This should only be called once per tab.
   */
  _onVisibilityChange() {
    if (this.document.visibilityState === VISIBLE) {
      this._sendEvent();
      this.document.removeEventListener(VISIBILITY_CHANGE_EVENT, this._onVisibilityChange);
    }
  }
};

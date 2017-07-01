const {actionTypes: at} = require("common/Actions.jsm");
const {perfService: perfSvc} = require("common/PerfService.jsm");

const VISIBLE = "visible";
const VISIBILITY_CHANGE_EVENT = "visibilitychange";

module.exports = class DetectUserSessionStart {
  constructor(options = {}) {
    // Overrides for testing
    this.sendAsyncMessage = options.sendAsyncMessage || global.sendAsyncMessage;
    this.document = options.document || global.document;
    this._perfService = options.perfService || perfSvc;
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
   * _sendEvent - Sends a message to the main process to indicate the current
   *              tab is now visible to the user, includes the
   *              visibility-change-event time in ms from the UNIX epoch.
   */
  _sendEvent() {
    this._perfService.mark("visibility-change-event");

    let absVisChangeTime = this._perfService
        .getMostRecentAbsMarkStartByName("visibility-change-event");

    this.sendAsyncMessage("ActivityStream:ContentToMain", {
      type: at.NEW_TAB_VISIBLE,
      data: {absVisibilityChangeTime: absVisChangeTime}
    });
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

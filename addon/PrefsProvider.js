"use strict";
const am = require("common/action-manager");
const simplePrefs = require("sdk/simple-prefs");
const DEFAULT_OPTIONS = {eventTracker: {handleUserEvent() {}}};

/**
 * PrefsProvider
 * Listens to pref changes and broadcasts them to content.
 * It also provides an action handler that can respond to requests and notifications from content.
 */
exports.PrefsProvider = class PrefsProvider {

  /**
   * constructor
   *
   * @param  {obj} options
   *         {obj} options.eventTracker    The TabTracker in order to handler the user event for a pref change (ActivtyStreams.js)
   *         {func} options.broadcast    This is a method that takes an action created with am.actions (action-manager.js)
   */
  constructor(options = {}) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this._onPrefChange = this._onPrefChange.bind(this);
  }

  /**
   * Broadcast the pref change to content in the form
   *  {name: "prefName", value: "newPrefvalue"} and capture that event
   */
  _onPrefChange(name) {
    this.options.broadcast(am.actions.Response("PREF_CHANGED_RESPONSE", {
      name,
      value: simplePrefs.prefs[name]
    }));
    this.options.eventTracker.handleUserEvent({"event": "PREF_CHANGE", "source": name});
  }

  /**
   * init - Sets up a listener on pref changes
   */
  init() {
    simplePrefs.on("", this._onPrefChange);
  }

  /**
   * destroy - Removes the event listener on prefs
   */
  destroy() {
    simplePrefs.off("", this._onPrefChange);
    this._onPrefChange = null;
  }
};

const am = require("common/action-manager");
const simplePrefs = require("sdk/simple-prefs");

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
   *         {func} options.broadcast    This is a method that takes an action created with am.actions (action-manager.js)
   *         {func} options.send         This is a method that takes an action created with am.actions, and a worker.
   *                                     Note: broadcast and send are defined on the ActivityStreams.js instance.
   */
  constructor(options) {
    const {broadcast, send} = options;
    this.broadcast = broadcast;
    this.send = send;
  }

  /**
   * init - Sets up a listener on pref changes that broadcasts the change to content
   *        in the form {name: "prefName", value: "newPrefvalue"}
   */
  init() {
    this.onPrefChange = name => this.broadcast(am.actions.Response("PREF_CHANGED_RESPONSE", {
      name,
      value: simplePrefs.prefs[name]
    }));
    simplePrefs.on("", this.onPrefChange);
  }

  /**
   * destroy - Removes the event listener on prefs
   */
  destroy() {
    simplePrefs.off("", this.onPrefChange);
    this.onPrefChange = null;
  }

  /**
  * actionHandler - This is added to the message channel in ActivityStreams.js
  *                 It handles messages from content.
   * @param  {obj} options
   *         {obj} options.msg     This is the message from content (i.e. the 'action')
   *         {obj} options.worker  This is the worker to which this.send responds
   */
  actionHandler(options = {}) {
    const {msg: action, worker} = options;
    switch (action.type) {
      case "PREFS_REQUEST":
        this.send(am.actions.Response("PREFS_RESPONSE", simplePrefs.prefs), worker);
        break;
      case "NOTIFY_UPDATE_PREF":
        simplePrefs.prefs[action.data.name] = action.data.value;
        break;
    }
  }
};

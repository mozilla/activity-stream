const am = require("common/action-manager");

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
   *         {obj} options.simplePrefs   This should be sdk/simple-prefs, or an equivalent interface.
   *         {func} options.broadcast    This is a method that takes an action created with am.actions (action-manager.js)
   *         {func} options.send         This is a method that takes an action created with am.actions, and a worker.
   *                                     Note: broadcast and send are defined on the ActivityStreams.js instance.
   */
  constructor(options) {
    const {simplePrefs, broadcast, send} = options;
    this.simplePrefs = simplePrefs;
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
      value: this.simplePrefs.prefs[name]
    }));
    this.simplePrefs.on("", this.onPrefChange);
  }

  /**
   * destroy - Removes the event listener on prefs
   */
  destroy() {
    this.simplePrefs.off("", this.onPrefChange);
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
        this.send(am.actions.Response("PREFS_RESPONSE", this.simplePrefs.prefs), worker);
        break;
      case "NOTIFY_UPDATE_PREF":
        this.simplePrefs.prefs[action.data.name] = action.data.value;
        break;
    }
  }
};

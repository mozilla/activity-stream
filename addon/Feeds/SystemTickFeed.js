const Feed = require("addon/lib/Feed");
const {SYSTEM_TICK_INTERVAL} = require("common/constants");
const am = require("common/action-manager");
const {setInterval, clearInterval} = require("sdk/timers");

module.exports = class SystemTickFeed extends Feed {
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        this.intervalId = setInterval(() => this.store.dispatch({type: "SYSTEM_TICK"}), SYSTEM_TICK_INTERVAL);
        break;
      case am.type("APP_UNLOAD"):
        clearInterval(this.intervalId);
        break;
    }
  }
};

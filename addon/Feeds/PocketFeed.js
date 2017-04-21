/* globals Task */
const Feed = require("addon/lib/Feed");
const am = require("common/action-manager");
const Request = require("sdk/request").Request;

module.exports = class PocketFeed extends Feed {

  constructor(options, updateTime) {
    super(options);
    this.updateTime = updateTime;
  }

  fetch(from) {
    return new Promise((resolve, reject) => {
      Request({
        url: from,
        onComplete: response => {
          if (response.status !== 200) {
            reject(Error(response.statusText));
            return;
          }
          resolve(response.text);
        }
      }).get();
    });
  }

  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        this.refresh();
        break;

      case am.type("PREF_CHANGED_RESPONSE"):
        if (action.data.name === "experiments.pocket") {
          this.refresh();
        }
        break;

      case am.type("SYSTEM_TICK"):
        if (Date.now() - this.state.lastUpdated >= this.updateTime) {
          this.refresh();
        }
        break;
    }
  }
};

const am = require("common/action-manager");

module.exports = [
  function(action) {
    switch (action.type) {
      case am.type("NOTIFY_USER_EVENT"):
        this._tabTracker.handleUserEvent(action.data);
        break;
      case am.type("NOTIFY_ROUTE_CHANGE"):
        this._onRouteChange(action.data);
        break;
    }
  },
  require("./places").handler,
  require("./search").handler
];

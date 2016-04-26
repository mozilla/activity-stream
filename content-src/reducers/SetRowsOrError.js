const am = require("common/action-manager");

const DEFAULTS = {
  rows: [],
  error: false,
  init: false,
  isLoading: false,
  canLoadMore: true
};

module.exports = function setRowsOrError(requestType, responseType) {
  return (prevState = DEFAULTS, action) => {
    const state = {};
    const meta = action.meta || {};
    switch (action.type) {
      case am.type(requestType):
        state.isLoading = true;
        break;
      case am.type(responseType):
        state.init = true;
        state.isLoading = false;
        if (action.error) {
          state.rows = meta.append ? prevState.rows : [];
          state.error = action.data;
        } else {
          state.rows = meta.append ? prevState.rows.concat(action.data) : action.data;
          state.error = false;
          if (!action.data || !action.data.length) {
            state.canLoadMore = false;
          }
        }
        break;
      case am.type("NOTIFY_HISTORY_DELETE"):
        state.rows = prevState.rows.filter(val => val.url !== action.data);
        break;
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
};
module.exports.DEFAULTS = DEFAULTS;

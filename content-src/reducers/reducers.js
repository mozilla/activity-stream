const am = require("actions/action-manager");

function setRowsOrError(type) {
  return (prevState = {rows: [], error: false}, action) => {
    const state = {};
    switch (action.type) {
      case am.type(type):
        if (action.error) {
          state.rows = [];
          state.error = action.data;
        } else {
          state.rows = action.data;
          state.error = false;
        }
        break;
      case "NOTIFY_HISTORY_DELETE":
        state.rows = prevState.rows.filter(val => val.url !== action.data);
        break;
      // TODO: Handle changes
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
}

function setSearchState(type) {
  return (prevState = {currentEngine: {}, error: false}, action) => {
    const state = {};
    switch (action.type) {
      case am.type(type):
        if (action.error) {
          state.currentEngine = {};
          state.error = action.data;
        } else {
          if (!action.data || !action.data.currentEngine) {
            state.currentEngine = {};
            state.error = true;
          } else {
            state.error = false;
            state.currentEngine = action.data.currentEngine;
          }
        }
        break;
      // TODO: Handle changes
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
}

module.exports = {
  TopSites: setRowsOrError("TOP_FRECENT_SITES_RESPONSE"),
  FrecentHistory: setRowsOrError("FRECENT_LINKS_RESPONSE"),
  History: setRowsOrError("RECENT_LINKS_RESPONSE"),
  Bookmarks: setRowsOrError("RECENT_BOOKMARKS_RESPONSE"),
  Search: setSearchState("SEARCH_STATE_RESPONSE")
};

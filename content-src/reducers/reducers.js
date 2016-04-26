const am = require("common/action-manager");
const setRowsOrError = require("reducers/SetRowsOrError");

function setSearchState(type) {
  return (prevState = {currentEngine: {}, error: false, init: false}, action) => {
    const state = {};
    switch (action.type) {
      case am.type(type):
        state.init = true;
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

function Blocked(prevState = {urls: new Set()}, action) {
  let state = {};
  switch (action.type) {
    case am.type("BLOCK_URL"):
      state.urls = new Set(prevState.urls);
      state.urls.add(action.data);
      break;
    default:
      return prevState;
  }
  return Object.assign({}, prevState, state);
}

module.exports = {
  TopSites: setRowsOrError("TOP_FRECENT_SITES_REQUEST", "TOP_FRECENT_SITES_RESPONSE"),
  History: setRowsOrError("RECENT_LINKS_REQUEST", "RECENT_LINKS_RESPONSE"),
  Bookmarks: setRowsOrError("RECENT_BOOKMARKS_REQUEST", "RECENT_BOOKMARKS_RESPONSE"),
  Highlights: setRowsOrError("HIGHLIGHTS_LINKS_REQUEST", "HIGHLIGHTS_LINKS_RESPONSE"),
  Search: setSearchState("SEARCH_STATE_RESPONSE"),
  Blocked
};

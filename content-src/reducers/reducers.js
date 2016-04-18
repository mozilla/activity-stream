const am = require("common/action-manager");

const DEFAULT_ROWS_OR_ERRORS_STATE = {
  rows: [],
  error: false,
  init: false,
  isLoading: false,
  canLoadMore: true
};

function setRowsOrError(requestType, responseType) {
  return (prevState = DEFAULT_ROWS_OR_ERRORS_STATE, action) => {
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
          state.rows = [];
          state.error = action.data;
        } else {
          state.rows = meta.append ? prevState.rows.concat(action.data) : action.data;
          state.error = false;
          if (!action.data.length) {
            state.canLoadMore = false;
          }
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
  FrecentHistory: setRowsOrError("RECENT_LINKS_REQUEST", "FRECENT_LINKS_RESPONSE"),
  History: setRowsOrError("RECENT_LINKS_REQUEST", "RECENT_LINKS_RESPONSE"),
  Bookmarks: setRowsOrError("RECENT_BOOKMARKS_REQUEST", "RECENT_BOOKMARKS_RESPONSE"),
  Highlights: setRowsOrError("HIGHLIGHTS_LINKS_REQUEST", "HIGHLIGHTS_LINKS_RESPONSE"),
  Search: setSearchState("SEARCH_STATE_RESPONSE"),
  Blocked
};

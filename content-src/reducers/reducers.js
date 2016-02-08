const am = require("actions/action-manager");

module.exports = {
  // This is just placeholder for now
  Sites: (prevState = {frecent: [], changes: []}, action) => {
    const state = {};
    switch (action.type) {
      case am.type("TOP_FRECENT_SITES_RESPONSE"):
        state.frecent = action.data;
        break;
      case am.type("RECEIVE_PLACES_CHANGES"):
        state.changes = prevState.changes.concat(action.data);
        break;
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  },

  Bookmarks: (prevState = {rows: [], error: false}, action) => {
    const state = {};
    switch (action.type) {
      case am.type("RECENT_BOOKMARKS_RESPONSE"):
        if (action.error) {
          state.rows = [];
          state.error = action.data;
        } else {
          state.rows = action.data;
          state.error = false;
        }
        break;
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  }
};

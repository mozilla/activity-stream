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
      // TODO: Handle changes
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
}

module.exports = {
  TopSites: setRowsOrError("TOP_FRECENT_SITES_RESPONSE"),
  History: setRowsOrError("RECENT_LINKS_RESPONSE"),
  Bookmarks: setRowsOrError("RECENT_BOOKMARKS_RESPONSE")
};

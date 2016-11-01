const am = require("common/action-manager");

const initialState = {
  historySize: null,
  bookmarksSize: null
};

module.exports = (prevState = initialState, action) => {
  switch (action.type) {
    case am.type("PLACES_STATS_UPDATED"):
      return Object.assign({}, prevState, action.data);
    default:
      return prevState;
  }
};

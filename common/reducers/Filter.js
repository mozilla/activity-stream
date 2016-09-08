const am = require("common/action-manager");

// Track changes to the filtering of activity stream view.
const INITIAL_STATE = {
  // The query to filter content
  query: ""
};

module.exports = function Filter(prevState = INITIAL_STATE, action) {
  const state = Object.assign({}, prevState);
  switch (action.type) {
    case am.type("NOTIFY_FILTER_QUERY"):
      state.query = action.data;
      break;
  }
  return state;
};

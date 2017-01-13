const am = require("common/action-manager");

// Prefs
// This reducer keeps track of prefs from the addon,
// and creates an object with the following state:
const INITIAL_STATE = {
  // This is set to true when our request returns an error or times out
  error: false,

  // This is an object where each key/value pair is a pref in the addon.
  prefs: {}
};

module.exports = function Prefs(prevState = INITIAL_STATE, action) {
  const state = Object.assign({}, prevState);
  switch (action.type) {
    case am.type("PREFS_RESPONSE"):
      if (action.error) {
        state.error = action.data;
      } else {
        state.prefs = action.data;
        state.error = false;
      }
      return state;
    case am.type("PREF_CHANGED_RESPONSE"):
      state.prefs[action.data.name] = action.data.value;
      return state;
    default:
      return prevState;
  }
};
module.exports.INITIAL_STATE = INITIAL_STATE;

const am = require("common/action-manager");

// Prefs
// This reducer keeps track of prefs from the addon,
// and creates an object with the following state:
const initialState = {

  // This is set to true the first time we receive a response.
  init: false,

  // This is set to true when a request is sent out, and set to false
  // when a response is received.
  isLoading: false,

  // This is set to true when our request returns an error or times out
  error: false,

  // This is an object where each key/value pair is a pref in the addon.
  prefs: {}
};

module.exports = function Prefs(prevState = initialState, action) {
    const state  = Object.assign({}, prevState);
    switch (action.type) {
      case am.type("PREFS_REQUEST"):
        state.isLoading = true;
        return state;
      case am.type("PREFS_RESPONSE"):
        state.isLoading = false;
        if (action.error) {
          state.error = action.error
        } else {
          state.init = true;
          state.prefs = action.data;
        }
        return state;
      default:
        return prevState;
    }

};

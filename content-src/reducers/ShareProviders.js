const am = require("common/action-manager");

// Prefs
// This reducer keeps track of prefs from the addon,
// and creates an object with the following state:
const INITIAL_STATE = {

  // This is set to true the first time we receive a response.
  init: false,

  // This is set to true when a request is sent out, and set to false
  // when a response is received.
  isLoading: false,

  // This is set to true when our request returns an error or times out
  error: false,

  // This is the list of social share providers.
  providers: []
};

module.exports = function ShareProviders(prevState = INITIAL_STATE, action) {
  const state = Object.assign({}, prevState);
  switch (action.type) {
    case am.type("SHARE_PROVIDERS_REQUEST"):
      state.isLoading = true;
      return state;
    case am.type("SHARE_PROVIDERS_RESPONSE"):
      state.isLoading = false;
      if (action.error) {
        state.error = action.data;
      } else {
        state.init = true;
        state.providers = action.data;
        state.error = false;
      }
      return state;
    default:
      return prevState;
  }
};
module.exports.INITIAL_STATE = INITIAL_STATE;

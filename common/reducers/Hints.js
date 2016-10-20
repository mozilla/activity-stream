const am = require("common/action-manager");

module.exports = (prevState = {}, action) => {
  let state;
  switch (action.type) {
    case am.type("DISABLE_HINT"):
      state = {};
      // action.data should be the id of a hint, as defined in props.id on the Hint component
      state[action.data] = false;
      return Object.assign({}, prevState, state);
    case am.type("ENABLE_ALL_HINTS"):
      return {};
    default:
      return prevState;
  }
};

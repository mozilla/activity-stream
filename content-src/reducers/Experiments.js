const definitions = require("../../experiments.json");
const defaultState = {values: {}, error: false, init: false};

// Start with control values
Object.keys(definitions).forEach(key => {
  if (definitions[key].active === false) {
    return;
  }
  defaultState.values[key] = definitions[key].control.value;
});

module.exports = function Experiments(prevState = defaultState, action) {
  if (action.type !== "EXPERIMENTS_RESPONSE") {
    return prevState;
  } else if (action.error) {
    return {
      error: action.data,
      values: prevState.values
    };
  } else {
    return {
      init: true,
      error: false,
      values: action.data
    };
  }
};

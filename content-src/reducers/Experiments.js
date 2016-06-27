const definitions = require("../../experiments.json");
const defaultState = {data: {}, error: false};

// Start with control values
Object.keys(definitions).forEach(key => {
  if (definitions[key].active === false) {
    return;
  }
  defaultState.data[key] = {
    value: definitions[key].control.value,
    inExperiment: false
  };
});

module.exports = function Experiments(prevState = defaultState, action) {
  if (action.type !== "EXPERIMENTS_RESPONSE") {
    return prevState;
  } else if (action.error) {
    return {
      error: action.data,
      data: prevState.data
    };
  } else {
    return {
      error: false,
      data: action.data
    };
  }
};

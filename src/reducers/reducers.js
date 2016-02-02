module.exports = {
  // This is just placeholder for now
  Sites: (prevState = {frecent: [], changes: []}, action) => {
    const state = {};
    switch(action.type) {
      case "RECEIVE_TOP_FRECENT_SITES":
        state.frecent = action.data;
        break;
      case "RECEIVE_PLACES_CHANGES":
        state.changes = prevState.changes.concat(action.data);
        break;
    }
    return Object.assign({}, prevState, state);
  }
};

"use strict";
const am = require("common/action-manager");

const initialState = {
  isLoading: false,
  error: false,
  searchString: "",
  suggestions: [],
  formHistory: [],
  currentEngine: {
    name: "",
    icon: ""
  },
  engines: [],
  searchPlaceholder: "",
  searchSettings: "",
  searchHeader: "",
  searchForSomethingWith: ""
};

module.exports = function Search(type) {
  return (prevState = initialState, action) => {
    const state = {};
    if (action.error) {
      state.error = action.data;
      return Object.assign({}, prevState, state);
    }
    switch (action.type) {
      case am.type("SEARCH_STATE_RESPONSE"):
        state.currentEngine = JSON.parse(action.data.currentEngine);
        state.engines = action.data.engines.map(engine => ({
          name: engine.name,
          icon: engine.iconBuffer
        }));
        break;
      case am.type("SEARCH_UISTRINGS_RESPONSE"):
        state.searchPlaceholder = action.data.searchPlaceholder;
        state.searchSettings = action.data.searchSettings;
        state.searchHeader = action.data.searchHeader;
        state.searchForSomethingWith = action.data.searchForSomethingWith;
        break;
      case am.type("NOTIFY_UPDATE_SEARCH_STRING"):
        state.searchString = action.data.searchString;
        break;
      case am.type("SEARCH_SUGGESTIONS_RESPONSE"):
        state.formHistory = action.data.formHistory || [];
        state.suggestions = action.data.suggestions || [];
        break;
      case am.type("SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE"):
        state.currentEngine = action.data.currentEngine;
        break;
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
};

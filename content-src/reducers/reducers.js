/* global require, module */
"use strict";
const setRowsOrError = require("reducers/SetRowsOrError");
const setSearchContent = require("reducers/setSearchContent");

function Experiments(prevState = {data: {}, error: false}, action) {
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
}

module.exports = {
  TopSites: setRowsOrError("TOP_FRECENT_SITES_REQUEST", "TOP_FRECENT_SITES_RESPONSE"),
  History: setRowsOrError("RECENT_LINKS_REQUEST", "RECENT_LINKS_RESPONSE"),
  Bookmarks: setRowsOrError("RECENT_BOOKMARKS_REQUEST", "RECENT_BOOKMARKS_RESPONSE"),
  Highlights: setRowsOrError("HIGHLIGHTS_LINKS_REQUEST", "HIGHLIGHTS_LINKS_RESPONSE"),
  Search: setSearchContent("SEARCH_STATE_RESPONSE", "SEARCH_UISTRINGS_RESPONSE", "SEARCH_SUGGESTIONS_RESPONSE", "SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE"),
  Experiments
};

/* global require, module */
"use strict";
const setRowsOrError = require("./SetRowsOrError");
const setSearchContent = require("./setSearchContent");
const Experiments = require("./Experiments");
const Filter = require("./Filter");
const Prefs = require("./Prefs");
const ShareProviders = require("./ShareProviders");

module.exports = {
  TopSites: setRowsOrError("TOP_FRECENT_SITES_REQUEST", "TOP_FRECENT_SITES_RESPONSE"),
  History: setRowsOrError("RECENT_LINKS_REQUEST", "RECENT_LINKS_RESPONSE"),
  Highlights: setRowsOrError("HIGHLIGHTS_LINKS_REQUEST", "HIGHLIGHTS_LINKS_RESPONSE"),
  WeightedHighlights: setRowsOrError("WEIGHTED_HIGHLIGHTS_REQUEST", "WEIGHTED_HIGHLIGHTS_RESPONSE"),
  Search: setSearchContent("SEARCH_STATE_RESPONSE", "SEARCH_UISTRINGS_RESPONSE", "SEARCH_SUGGESTIONS_RESPONSE", "SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE"),
  Experiments,
  Filter,
  Prefs,
  ShareProviders
};

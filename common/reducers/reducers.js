/* global require, module */
"use strict";
const setRowsOrError = require("./SetRowsOrError");
const setSearchContent = require("./setSearchContent");
const Experiments = require("./Experiments");
const Filter = require("./Filter");
const Prefs = require("./Prefs");
const ShareProviders = require("./ShareProviders");
const Hints = require("./Hints");
const PlacesStats = require("./PlacesStats");

module.exports = {
  TopSites: setRowsOrError("TOP_FRECENT_SITES_REQUEST", "TOP_FRECENT_SITES_RESPONSE"),
  Highlights: setRowsOrError("HIGHLIGHTS_REQUEST", "HIGHLIGHTS_RESPONSE"),
  Search: setSearchContent("SEARCH_STATE_UPDATED", "SEARCH_UISTRINGS_RESPONSE", "SEARCH_SUGGESTIONS_RESPONSE", "SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE"),
  Experiments,
  Filter,
  Prefs,
  ShareProviders,
  Hints,
  PlacesStats
};

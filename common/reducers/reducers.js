"use strict";
const setRowsOrError = require("./SetRowsOrError");
const setSearchContent = require("./setSearchContent");
const Experiments = require("./Experiments");
const Filter = require("./Filter");
const Prefs = require("./Prefs");
const PlacesStats = require("./PlacesStats");
const Intl = require("./Intl");

module.exports = {
  TopSites: setRowsOrError("TOP_FRECENT_SITES_REQUEST", "TOP_FRECENT_SITES_RESPONSE"),
  Highlights: setRowsOrError("HIGHLIGHTS_REQUEST", "HIGHLIGHTS_RESPONSE"),
  Bookmarks: setRowsOrError("BOOKMARKS_REQUEST", "BOOKMARKS_RESPONSE"),
  VisitAgain: setRowsOrError("VISITAGAIN_REQUEST", "VISITAGAIN_RESPONSE"),
  PocketStories: setRowsOrError("POCKET_STORIES_REQUEST", "POCKET_STORIES_RESPONSE"),
  PocketTopics: setRowsOrError("POCKET_TOPICS_REQUEST", "POCKET_TOPICS_RESPONSE"),
  Search: setSearchContent("SEARCH_STATE_UPDATED", "SEARCH_SUGGESTIONS_RESPONSE", "SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE"),
  Experiments,
  Filter,
  Prefs,
  PlacesStats,
  Intl
};

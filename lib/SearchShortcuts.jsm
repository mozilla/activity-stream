/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

// List of sites we match against Topsites in order to identify sites
// that should be converted to search Topsites
const SEARCH_SHORTCUTS = [
  {keyword: "@google", shortURL: "google", url: "https://google.com", searchIdentifier: /^google/},
  {keyword: "@amazon", shortURL: "amazon", url: "https://amazon.com", searchIdentifier: /^amazon/}
];
this.SEARCH_SHORTCUTS = SEARCH_SHORTCUTS;

// Note: you must add the activity stream branch to the beginning of this if using outside activity stream
this.SEARCH_SHORTCUTS_EXPERIMENT = "improvesearch.topSiteSearchShortcuts";

function getSearchProvider(candidateShortURL) {
  return SEARCH_SHORTCUTS.filter(match => candidateShortURL === match.shortURL)[0] || null;
}
this.getSearchProvider = getSearchProvider;

const EXPORTED_SYMBOLS = ["getSearchProvider", "SEARCH_SHORTCUTS", "SEARCH_SHORTCUTS_EXPERIMENT"];
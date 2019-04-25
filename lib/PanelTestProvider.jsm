/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const MESSAGES = () => ([
  {
    "id": "SIMPLE_FXA_BOOKMARK_TEST_1",
    "content": {
      "title": "cfr-doorhanger-bookmark-fxa-header",
      "text": "cfr-doorhanger-bookmark-fxa-body",
      "link": {
        "text": "cfr-doorhanger-bookmark-fxa-link-text",
        "url": "https://mozilla.com",
      },
      "info_icon": {
        "tooltiptext": "cfr-doorhanger-bookmark-fxa-info-icon-tooltip",
      },
      "close_button": {
        "tooltiptext": "cfr-doorhanger-bookmark-fxa-close-btn-tooltip",
      },
    },
    "trigger": {"id": "bookmark-panel"},
  },
]);

const PanelTestProvider = {
  getMessages() {
    return MESSAGES()
      // Ensures we never actually show test except when triggered by debug tools
      .map(message => ({...message, targeting: `providerCohorts.panel_local_testing == "SHOW_TEST"`}));
  },
};
this.PanelTestProvider = PanelTestProvider;

const EXPORTED_SYMBOLS = ["PanelTestProvider"];

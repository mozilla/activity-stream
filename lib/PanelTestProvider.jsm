/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const MESSAGES = () => ([
  {
    "id": "SIMPLE_FXA_BOOKMARK_TEST_FLUENT",
    "template": "fxa_bookmark_panel",
    "content": {
      "title": {"string_id": "cfr-doorhanger-bookmark-fxa-header"},
      "text": {"string_id": "cfr-doorhanger-bookmark-fxa-body"},
      "cta": {"string_id": "cfr-doorhanger-bookmark-fxa-link-text"},
      "color": "white",
      "background_color_1": "#7d31ae",
      "background_color_2": "#5033be",
      "info_icon": {
        "tooltiptext": {"string_id": "cfr-doorhanger-bookmark-fxa-info-icon-tooltip"},
      },
      "close_button": {
        "tooltiptext": {"string_id": "cfr-doorhanger-bookmark-fxa-close-btn-tooltip"},
      },
    },
    "trigger": {"id": "bookmark-panel"},
  },
  {
    "id": "SIMPLE_FXA_BOOKMARK_TEST_NON_FLUENT",
    "template": "fxa_bookmark_panel",
    "content": {
      "title": "Bookmark Message Title",
      "text": "Bookmark Message Body",
      "cta": "Sync bookmarks now",
      "color": "white",
      "background_color_1": "#7d31ae",
      "background_color_2": "#5033be",
      "info_icon": {
        "tooltiptext": "Toggle tooltip",
      },
      "close_button": {
        "tooltiptext": "Close tooltip",
      },
    },
    "trigger": {"id": "bookmark-panel"},
  },
]);

const PanelTestProvider = {
  getMessages() {
    return MESSAGES()
      .map(message => ({...message, targeting: `providerCohorts.panel_local_testing == "SHOW_TEST"`}));
  },
};
this.PanelTestProvider = PanelTestProvider;

const EXPORTED_SYMBOLS = ["PanelTestProvider"];

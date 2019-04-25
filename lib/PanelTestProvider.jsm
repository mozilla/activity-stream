/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const MESSAGES = () => ([
  {
    "id": "SIMPLE_TEST_1",
    "template": "simple_snippet",
    "campaign": "test_campaign_blocking",
    "content": {
      "title": "Firefox Account!",
      "text": "<syncLink>Sync it, link it, take it with you</syncLink>. All this and more with a Firefox Account.",
      "links": {"syncLink": {"url": "https://www.mozilla.org/en-US/firefox/accounts"}},
      "block_button_text": "Block",
    },
  },
]);

const PanelTestProvider = {
  getMessages() {
    return MESSAGES()
      // Ensures we never actually show test except when triggered by debug tools
      // TODO where is this coming from
      .map(message => ({...message, targeting: `providerCohorts.panel_local_testing == "SHOW_TEST"`}));
  },
};
this.PanelTestProvider = PanelTestProvider;

const EXPORTED_SYMBOLS = ["PanelTestProvider"];

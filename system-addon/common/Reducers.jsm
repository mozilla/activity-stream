/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
const {actionTypes: at} = Cu.import("resource://activity-stream/common/Actions.jsm", {});

const INITIAL_STATE = {
  TopSites: {
    rows: [
      {
        "title": "Facebook",
        "url": "https://www.facebook.com/"
      },
      {
        "title": "YouTube",
        "url": "https://www.youtube.com/"
      },
      {
        "title": "Amazon",
        "url": "http://www.amazon.com/"
      },
      {
        "title": "Yahoo",
        "url": "https://www.yahoo.com/"
      },
      {
        "title": "eBay",
        "url": "http://www.ebay.com"
      },
      {
        "title": "Twitter",
        "url": "https://twitter.com/"
      }
    ]
  }
};

// TODO: Handle some real actions here, once we have a TopSites feed working
function TopSites(prevState = INITIAL_STATE.TopSites, action) {
  switch (action.type) {
    case at.TOP_SITES_UPDATED:
      if (!action.data || !action.data.length) {
        return prevState;
      }
      return Object.assign({}, prevState, {rows: action.data});
    case at.SCREENSHOT_UPDATED:

      updateByUrl(prevState.rows, action.data.url, {screenshot: action.data.screenshot})
  }
  return prevState;
}

this.INITIAL_STATE = INITIAL_STATE;
this.reducers = {TopSites};

this.EXPORTED_SYMBOLS = ["reducers", "INITIAL_STATE"];

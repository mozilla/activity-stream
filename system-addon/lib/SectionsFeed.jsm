/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const {actionCreators: ac, actionTypes: at} = Cu.import("resource://activity-stream/common/Actions.jsm", {});

const DUMMY_DATA = {
  catUrls: [
    "https://dncache-mauganscorp.netdna-ssl.com/thumbseg/655/655484-bigthumbnail.jpg",
    "https://c1.staticflickr.com/1/202/509388231_d774116746_b.jpg",
    "https://cdn.meme.am/cache/instances/folder829/500x/64673829/angry-cat-meme-update-your-firefox-now.jpg"
  ]
};

this.SectionsFeed = class SectionsFeed {
  constructor() {
    this.options = DUMMY_DATA;
  }
  init() {
    const initAction = {type: at.SECTION_INIT, data: {id: "dummy_section", options: this.options}};
    this.store.dispatch(ac.BroadcastToContent(initAction));
  }
  onAction(action) {
    switch (action.type) {
      case at.INIT:
        this.init();
        break;
    }
  }
};

this.EXPORTED_SYMBOLS = ["SectionsFeed"];

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;

const {actionCreators: ac, actionTypes: at} = Cu.import("resource://activity-stream/common/Actions.jsm", {});

const DUMMY_DATA = [
  {url: "http://www.example.com", context_menu_options: ["CheckBookmark", "SaveToPocket", "Separator", "OpenInNewWindow", "OpenInPrivateWindow", "Separator", "BlockUrl", "DeleteUrl"], type: "history", image: "http://cdn.attackofthecute.com/February-13-2013-20-34-03-ii.jpg", title: "Some dummy title goes here", description: "some dummy description goes here lalalala i'm very long and alalalalla"},
  {url: "http://www.example.com/1", context_menu_options: ["CheckBookmark", "SaveToPocket", "Separator", "OpenInNewWindow", "OpenInPrivateWindow", "Separator", "BlockUrl", "DeleteUrl"], type: "bookmark", image: null, title: "Some dummy title goes here", description: "some dummy description goes here lalalala i'm very long and alalalalla"},
  {url: "http://www.example.com/2", context_menu_options: ["CheckBookmark", "SaveToPocket", "Separator", "OpenInNewWindow", "OpenInPrivateWindow", "Separator", "BlockUrl"], type: "trending", image: "http://cdn.attackofthecute.com/February-13-2013-20-34-03-ii.jpg", title: "Some dummy title goes here", description: "some dummy description goes here lalalala i'm very long and alalalalla"}
];

/**
 * DummySectionFeed - Included to test the Sections API, prefed off by default.
 * Dispatches three image urls as rows data on init.
 */
this.DummySectionFeed = class DummySectionFeed {
  constructor() {
    this.options = {
      id: "dummy_section",
      icon: "pocket",
      title: {id: "Dummy Section"},
      rows: DUMMY_DATA,
      infoOption: {
        header: {id: "fake_id", defaultMessage: "Red Pandas"},
        body: {id: "fake_id", defaultMessage: "Find out more about the pandas on Wikipedia."},
        link: {
          href: "https://en.wikipedia.org/wiki/Red_panda",
          id: "fake_id",
          defaultMessage: "Red pandas article"
        }
      },
      emptyState: {
        message: {id: "fake_id", defaultMessage: "Cupcake ipsum dolor sit amet caramels caramels. Powder jelly beans tart. Tootsie roll sesame snaps marzipan brownie jujubes. Lollipop jelly-o gingerbread."},
        icon: "check"
      }
    };
  }
  init() {
    this.store.dispatch(ac.BroadcastToContent({type: at.SECTION_REGISTER, data: this.options}));
  }
  uninit() {
    this.store.dispatch(ac.BroadcastToContent({type: at.SECTION_DEREGISTER, data: this.options.id}));
  }
  onAction(action) {
    switch (action.type) {
      case at.INIT:
        this.init();
        break;
      case at.FEED_INIT:
        if (action.data === "feeds.section.dummy_section") { this.init(); }
        break;
    }
  }
};

this.EXPORTED_SYMBOLS = ["DummySectionFeed"];

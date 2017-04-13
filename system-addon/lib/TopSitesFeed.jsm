/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 /* globals PlacesProvider, PreviewProvider */
"use strict";

const {utils: Cu} = Components;
const {actionTypes: at, actionCreators: ac} = Cu.import("resource://activity-stream/common/Actions.jsm", {});

Cu.import("resource:///modules/PlacesProvider.jsm");
Cu.import("resource:///modules/PreviewProvider.jsm");

const TOP_SITES_SHOWMORE_LENGTH = 12;
const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes

this.TopSitesFeed = class TopSitesFeed {
  constructor() {
    this.lastUpdated = 0;
  }
  async getData(action) {
    let newAction;
    let links = await PlacesProvider.links.getLinks();
    let result;
    if (!links) {
      result = [];
    } else {
      result = links.filter(link => link && link.type !== "affiliate").slice(0, 12);
    }
    newAction = {type: at.TOP_SITES_UPDATED, data: result};
    // send an update to content so the preloaded tab can get the updated content
    this.store.dispatch(ac.SendToContent(newAction, action.meta.fromTarget));
    this.lastUpdated = Date.now();
    for (let link of links) {
      let screenshot = await PreviewProvider.getThumbnail(link.url);
      newAction = {type: at.SCREENSHOT_UPDATED, data: {url: link.url, screenshot}};
      this.store.dispatch(ac.BroadcastToContent(newAction));
    }
  }
  onAction(action) {
    switch (action.type) {
      case at.NEW_TAB_LOAD:
        // When a new tab is opened, if we don't have enough top sites yet, refresh the data.
        if (this.store.getState().TopSites.rows.length < TOP_SITES_SHOWMORE_LENGTH) {
          this.getData(action);
        } else if (Date.now() - this.lastUpdated >= UPDATE_TIME) {
          // When a new tab is opened, if the last time we refreshed the data
          // is greater than 15 minutes, refresh the data.
          this.getData(action);
        }
        break;
    }
  }
};

this.UPDATE_TIME = UPDATE_TIME;
this.EXPORTED_SYMBOLS = ["TopSitesFeed", "UPDATE_TIME"];

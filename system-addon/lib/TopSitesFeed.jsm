/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
const {actionTypes: at, actionCreators: ac} = Cu.import("resource://activity-stream/common/Actions.jsm", {});
const {Prefs} = Cu.import("resource://activity-stream/lib/ActivityStreamPrefs.jsm", {});

Cu.import("resource://gre/modules/NewTabUtils.jsm");
Cu.import("resource:///modules/PreviewProvider.jsm");

const TOP_SITES_SHOWMORE_LENGTH = 12;
const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes
const DEFAULT_TOP_SITES = [];

// Add default sites if any based on the pref
try {
  let sites = new Prefs().get("default.sites").split(",");
  sites.filter(url => url).forEach(url => {
    DEFAULT_TOP_SITES.push({
      isDefault: true,
      url
    });
  });
} catch (e) {
  // Use no defaults if something went wrong
}

this.TopSitesFeed = class TopSitesFeed {
  constructor() {
    this.lastUpdated = 0;
  }
  async getScreenshot(url) {
    let screenshot = await PreviewProvider.getThumbnail(url);
    const action = {type: at.SCREENSHOT_UPDATED, data: {url, screenshot}};
    this.store.dispatch(ac.BroadcastToContent(action));
  }
  async getLinksWithDefaults(action) {
    let links = await NewTabUtils.activityStreamLinks.getTopSites();

    if (!links) {
      links = [];
    } else {
      links = links.filter(link => link && link.type !== "affiliate").slice(0, 12);
    }

    if (links.length < TOP_SITES_SHOWMORE_LENGTH) {
      links = [...links, ...DEFAULT_TOP_SITES].slice(0, TOP_SITES_SHOWMORE_LENGTH);
    }

    return links;
  }
  async refresh(action) {
    const links = await this.getLinksWithDefaults();
    const newAction = {type: at.TOP_SITES_UPDATED, data: links};

    // Send an update to content so the preloaded tab can get the updated content
    this.store.dispatch(ac.SendToContent(newAction, action.meta.fromTarget));
    this.lastUpdated = Date.now();

    // Now, get a screenshot for every item
    for (let link of links) {
      this.getScreenshot(link.url);
    }
  }
  openNewWindow(action, isPrivate = false) {
    const win = action._target.browser.ownerGlobal;
    win.openLinkIn(action.data.url, "window", {private: isPrivate});
  }
  onAction(action) {
    let realRows;
    switch (action.type) {
      case at.NEW_TAB_LOAD:
        // Only check against real rows returned from history, not default ones.
        realRows = this.store.getState().TopSites.rows.filter(row => !row.isDefault);
        // When a new tab is opened, if we don't have enough top sites yet, refresh the data.
        if (realRows.length < TOP_SITES_SHOWMORE_LENGTH) {
          this.refresh(action);
        } else if (Date.now() - this.lastUpdated >= UPDATE_TIME) {
          // When a new tab is opened, if the last time we refreshed the data
          // is greater than 15 minutes, refresh the data.
          this.refresh(action);
        }
        break;
      case at.OPEN_NEW_WINDOW:
        this.openNewWindow(action);
        break;
      case at.OPEN_PRIVATE_WINDOW: {
        this.openNewWindow(action, true);
        break;
      }
    }
  }
};

this.UPDATE_TIME = UPDATE_TIME;
this.TOP_SITES_SHOWMORE_LENGTH = TOP_SITES_SHOWMORE_LENGTH;
this.DEFAULT_TOP_SITES = DEFAULT_TOP_SITES;
this.EXPORTED_SYMBOLS = ["TopSitesFeed", "UPDATE_TIME", "DEFAULT_TOP_SITES", "TOP_SITES_SHOWMORE_LENGTH"];

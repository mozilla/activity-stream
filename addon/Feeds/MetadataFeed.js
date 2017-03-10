/* globals module, require */
"use strict";
const {PlacesProvider} = require("addon/PlacesProvider");
const simplePrefs = require("sdk/simple-prefs");
const Feed = require("addon/lib/Feed");
const am = require("common/action-manager");
const MAX_NUM_LINKS = 5;

module.exports = class MetadataFeed extends Feed {
  constructor(options) {
    super(options);
    this.linksToFetch = new Map();
  }

  /**
   * When the app initializes, we want to have metadata for all existing entries,
   * therefore add them to the list of links to fetch metadata for, then refresh
   * the state
   */
  getInitialMetadata(reason) {
    // Get initial topsites metadata
    return PlacesProvider.links.getTopFrecentSites().then(links => {
      links.forEach(item => this.linksToFetch.set(item.url, Date.now()));
      this.refresh(reason);
    // Get initial highlights metadata
    }).then(() => PlacesProvider.links.getRecentlyVisited())
    .then(links => {
      links.forEach(item => this.linksToFetch.set(item.url, Date.now()));
      this.refresh(reason);
    });
  }

  /**
   * Once the max number of links is collected, start an async job to fetch
   * metadata for those links, and clear the list of links which are missing metadata
   */
  getData() {
    let links = Array.from(this.linksToFetch.keys(), item => Object.assign({"url": item}));
    this.linksToFetch.clear();

    // if we are in the experiment, make a network request through PageScraper
    if (simplePrefs.prefs["experiments.locallyFetchMetadata20"]) {
      return this.options.fetchNewMetadataLocally(links, "METADATA_FEED_REQUEST").then(() => (am.actions.Response("METADATA_UPDATED")));
    }
    return this.options.fetchNewMetadata(links, "METADATA_FEED_REQUEST").then(() => (am.actions.Response("METADATA_UPDATED")));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        this.getInitialMetadata("app was initializing");
        break;
      case am.type("RECEIVE_PLACES_CHANGES"):
        this.linksToFetch.set(action.data.url, Date.now());
        if (this.linksToFetch.size > MAX_NUM_LINKS) {
          this.refresh("metadata was needed for these links");
        }
        break;
    }
  }
};
module.exports.MAX_NUM_LINKS = MAX_NUM_LINKS;

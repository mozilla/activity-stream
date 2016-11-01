const {PlacesProvider} = require("addon/PlacesProvider");
const Feed = require("addon/lib/Feed");
const {TOP_SITES_LENGTH} = require("common/constants");
const am = require("common/action-manager");
const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes

module.exports = class TopSitesFeed extends Feed {
  // Used by this.refresh
  getData() {
    return PlacesProvider.links.getTopFrecentSites()
      .then(links => this.options.getMetadata(links, "TOP_FRECENT_SITES_RESPONSE"))
      .then(links => (am.actions.Response("TOP_FRECENT_SITES_RESPONSE", links)));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app first starts up, refresh the data.
        this.refresh("app was initializing");
        break;
      case am.type("RECEIVE_PLACES_CHANGES"):
        // When a user visits a site, if we don't have enough top sites yet, refresh the data.
        if (state.TopSites.rows.length < TOP_SITES_LENGTH) {
          this.refresh("there were not enough sites");
        }
        // When a user visits a site, if the last time we refreshed the data is greater than 15 minutes, refresh the data.
        else if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          this.refresh("the sites were too old");
        }
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

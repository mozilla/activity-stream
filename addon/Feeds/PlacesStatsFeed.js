const {PlacesProvider} = require("addon/PlacesProvider");
const Feed = require("addon/lib/Feed");
const am = require("common/action-manager");
const {PlacesStatsUpdate} = am.actions;
const UPDATE_TIME = 24 * 60 * 60 * 1000; // 24 hours

module.exports = class PlacesStatsFeed extends Feed {
  // Used by this.refresh
  getData() {
    return Promise.all([
      PlacesProvider.links.getHistorySize(),
      PlacesProvider.links.getBookmarksSize()
    ])
    .then(([historySize, bookmarksSize]) => (
      PlacesStatsUpdate(historySize, bookmarksSize)
    ));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app first starts up, refresh the data.
        this.refresh("app was initializing");
        break;
      case am.type("RECEIVE_PLACES_CHANGES"):
        // When a user visits a site, if the last time we refreshed the data is greater than 24 hours, refresh the data.
        if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          this.refresh("queries are older than 24 hours");
        }
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

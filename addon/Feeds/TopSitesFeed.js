const {PlacesProvider} = require("addon/PlacesProvider");
const Feed = require("./Feed");
const {TOP_SITES_LENGTH} = require("common/constants");

const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes

module.exports = class TopSitesFeed extends Feed {
  getData() {
    return PlacesProvider.links.getTopFrecentSites()
      .then(links => this.getMetadata(links, "TOP_FRECENT_SITES_RESPONSE"))
      .then(links => ({type: "TOP_FRECENT_SITES_RESPONSE", data: links}));
  }
  reducer(state, action) {
    switch (action.type) {
      case "APP_INIT":
        this.refresh("app was initializing");
        break;
      case "RECEIVE_PLACES_CHANGES":
        if (state.TopSites.rows.length < TOP_SITES_LENGTH) {
          this.refresh("there were not enough sites");
        }
        else if (Date.now() - this.lastUpdated >= UPDATE_TIME) {
          this.refresh("the sites were too old");
        }
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

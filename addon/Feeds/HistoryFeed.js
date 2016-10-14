const {PlacesProvider} = require("addon/PlacesProvider");
const Feed = require("./Feed");

const UPDATE_TIME = 1000;

module.exports = class HistoryFeed extends Feed {
  get inHighlightsExperiment() {
    return this.store.getState().Experiments.values.weightedHighlights;
  }
  getData() {
    return PlacesProvider.links.getRecentLinks()
      .then(links => this.getMetadata(links, "RECENT_LINKS_RESPONSE"))
      .then(links => ({type: "RECENT_LINKS_RESPONSE", data: links}));
  }
  reducer(state, action) {
    if (this.inHighlightsExperiment) {
      if (action.type === "APP_INIT") {
        this.store.dispatch({type: "RECENT_LINKS_RESPONSE", data: []});
      }
    } else {
      switch (action.type) {
        case "APP_INIT":
          this.refresh();
          break;
        case "RECEIVE_PLACES_CHANGES":
          if (Date.now() - this.lastUpdated >= UPDATE_TIME) {
            this.refresh();
          }
          break;
      }
    }
  }
};

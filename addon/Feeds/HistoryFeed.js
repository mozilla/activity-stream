const {PlacesProvider} = require("addon/PlacesProvider");
const Feed = require("addon/lib/Feed");

const UPDATE_TIME = 1000;

module.exports = class HistoryFeed extends Feed {
  // Used by this.refresh
  get inHighlightsExperiment() {
    return this.store.getState().Experiments.values.weightedHighlights;
  }
  getData() {
    return PlacesProvider.links.getRecentLinks()
      .then(links => this.options.getMetadata(links, "RECENT_LINKS_RESPONSE"))
      .then(links => ({type: "RECENT_LINKS_RESPONSE", data: links}));
  }
  onAction(state, action) {
    if (this.inHighlightsExperiment) {
      if (action.type === "APP_INIT") {
        this.store.dispatch({type: "RECENT_LINKS_RESPONSE", data: []});
      }
    } else {
      switch (action.type) {
        case "APP_INIT":
          this.refresh();
          break;
        case "EXPERIMENTS_RESPONSE":
        case "RECEIVE_PLACES_CHANGES":
          if (!state.History.init) {
            this.refresh();
          }
          if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
            this.refresh();
          }
          break;
      }
    }
  }
};

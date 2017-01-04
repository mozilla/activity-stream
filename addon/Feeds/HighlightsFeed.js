const simplePrefs = require("sdk/simple-prefs");
const {Cu} = require("chrome");
const {PlacesProvider} = require("addon/PlacesProvider");
const {Recommender} = require("common/recommender/Recommender");
const Feed = require("addon/lib/Feed");
const {TOP_SITES_LENGTH, HIGHLIGHTS_LENGTH} = require("common/constants");
const am = require("common/action-manager");

const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes

module.exports = class HighlightsFeed extends Feed {
  constructor(options) {
    super(options);
    this.baselineRecommender = null; // Added in initializeRecommender, if the experiment is turned on
  }

  /**
   * getCoefficientsFromPrefs - Try to get the coefficients for the recommender from prefs.
   *                            They should be an array of numbers
   *
   * @return {array/null}  If we could parse them, we return the array.
   *                       If we couldn't parse them, we return null.
   */
  getCoefficientsFromPrefs() {
    try {
      let value = JSON.parse(simplePrefs.prefs.weightedHighlightsCoefficients);
      if (Array.isArray(value)) {
        return value;
      }
      Cu.reportError("Coefficients values must be a valid array");
    } catch (e) {
      Cu.reportError(e);
    }
    return null;
  }

  /**
   * initializeRecommender - This creates a recommender and assigns it to .baselineRecommender
   *                         To do this, it calls the .getAllHistoryItems query on places provider.
   *                         It will then refresh the app
   *
   * @return {Promise}  Returns the promise created by .getAllHistoryItems
   */
  initializeRecommender(reason) {
    return PlacesProvider.links.getAllHistoryItems().then(links => {
      let highlightsCoefficients = this.getCoefficientsFromPrefs();
      this.baselineRecommender = new Recommender(links, {highlightsCoefficients});
    }).then(() => this.refresh(reason));
  }

  /**
   * getData
   *
   * @return Promise  A promise that resolves with the "HIGHLIGHTS_RESPONSE" action
   */
  getData() {
    if (!this.baselineRecommender) {
      return Promise.reject(new Error("Tried to get weighted highlights but there was no baselineRecommender"));
    }
    return PlacesProvider.links.getRecentlyVisited()
      .then(links => this.options.getCachedMetadata(links, "HIGHLIGHTS_RESPONSE"))
      .then(links => ({metadataLinks: links, weightedLinks: this.baselineRecommender.scoreEntries(links)}))
      .then(({metadataLinks, weightedLinks}) => {
        if (metadataLinks.length && !weightedLinks.length) {
          return am.actions.Response("HIGHLIGHTS_AWAITING_METADATA");
        }
        return am.actions.Response("HIGHLIGHTS_RESPONSE", weightedLinks);
      });
  }

  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app inititalizes, create a recommender, and then refresh the data.
        this.initializeRecommender("app was initializing");
        break;
      case am.type("RECEIVE_BOOKMARK_ADDED"):
        // We always want new bookmarks
        this.refresh("a bookmark was added");
        break;
      case am.type("HIGHLIGHTS_AWAITING_METADATA"):
        this.refresh("metadata for highlights is being fetched");
        break;
      case am.type("METADATA_FEED_UPDATED"):
        // If the user visits a site and we don't have enough weighted highlights yet, refresh the data.
        if (state.Highlights.rows.length < (HIGHLIGHTS_LENGTH + TOP_SITES_LENGTH)) {
          this.refresh("there were not enough sites");
        }
        // If the user visits a site & the last time we refreshed the data was older than 15 minutes, refresh the data.
        if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          this.refresh("the sites were too old");
        }
        break;
      case am.type("PREF_CHANGED_RESPONSE"):
        // If the weightedHighlightsCoefficients pref was changed and we have a recommender, update it with
        // the new coefficients.
        if (action.data.name === "weightedHighlightsCoefficients" && this.baselineRecommender) {
          let highlightsCoefficients = this.getCoefficientsFromPrefs();
          this.baselineRecommender.updateOptions({highlightsCoefficients});
          this.refresh("coefficients were changed");
        }
        break;
      case am.type("SYNC_COMPLETE"):
        // We always want new synced tabs.
        this.refresh("new tabs synced");
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

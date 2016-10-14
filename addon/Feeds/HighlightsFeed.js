const simplePrefs = require("sdk/simple-prefs");
const {Cu} = require("chrome");
const {PlacesProvider} = require("addon/PlacesProvider");
const {Recommender} = require("common/recommender/Recommender");
const Feed = require("addon/lib/Feed");
const {TOP_SITES_LENGTH, SPOTLIGHT_DEFAULT_LENGTH, WEIGHTED_HIGHLIGHTS_LENGTH} = require("common/constants");

const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes

module.exports = class HighlightsFeed extends Feed {
  constructor(options) {
    super(options);
    this.baselineRecommender = null; // Added in initializeRecommender, if the experiment is turned on
  }

  // This determines whether we return weighted highlights or old highlights
  get inExperiment() {
    return this.store.getState().Experiments.values.weightedHighlights;
  }

  // This checks if we have enough sites; it's different for weighted v.s. old highlights
  get hasEnoughSites() {
    const currentState = this.store.getState();
    if (this.inExperiment) {
      return currentState.WeightedHighlights.rows.length >= (WEIGHTED_HIGHLIGHTS_LENGTH + TOP_SITES_LENGTH);
    }
    return currentState.Highlights.rows.length >= SPOTLIGHT_DEFAULT_LENGTH;
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
   * getWeightedHighlights - Used by .getData if weightedHighlights is turned on.
   *
   * @return Promise  A promise that resolves with the "WEIGHTED_HIGHLIGHTS_RESPONSE" action
   */
  getWeightedHighlights() {
    if (!this.baselineRecommender) {
      return Promise.reject(new Error("Tried to get weighted highlights but there was no baselineRecommender"));
    }
    return PlacesProvider.links.getRecentlyVisited()
      .then(links => this.options.getMetadata(links, "WEIGHTED_HIGHLIGHTS_RESPONSE"))
      .then(links => this.baselineRecommender.scoreEntries(links))
      .then(links => ({type: "WEIGHTED_HIGHLIGHTS_RESPONSE", data: links}));
  }

  /**
   * getOldHighlights - Used by .getData if weightedHighlights is turned off.
   *
   * @return Promise  A promise that resolves with the "HIGHLIGHTS_LINKS_RESPONSE" action
   */
  getOldHighlights() {
    return PlacesProvider.links.getHighlightsLinks()
      .then(links => this.options.getMetadata(links, "HIGHLIGHTS_LINKS_RESPONSE"))
      .then(links => ({type: "HIGHLIGHTS_LINKS_RESPONSE", data: links}));
  }

  // Used by this.refresh
  getData() {
    return this.inExperiment ? this.getWeightedHighlights() : this.getOldHighlights();
  }

  onAction(state, action) {
    switch (action.type) {
      case "APP_INIT":
        // When the app inititalizes, create a recommender, and then refresh the data.
        if (this.inExperiment) {
          this.initializeRecommender("app was initializing");
        } else {
          this.refresh();
        }
        break;
      case "RECEIVE_BOOKMARK_ADDED":
        // We always want new bookmarks
        this.refresh("a bookmark was added");
        break;
      case "RECEIVE_PLACES_CHANGES":
        // If the user visits a site and we don't have enough weighted highlights yet, refresh the data.
        if (!this.hasEnoughSites) {
          this.refresh("there were not enough sites");
        }
        // If the user visits a site & the last time we refreshed the data was older than 15 minutes, refresh the data.
        if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          this.refresh("the sites were too old");
        }
        break;
      case "EXPERIMENTS_RESPONSE":
        // If the experiment is now turned on and we don't have a recommender, initialize it and refresh the data.
        if (this.inExperiment && !this.baselineRecommender) {
          this.initializeRecommender("experiment was turned on");
        }
        // If the experiment was turned off, remove the recommender.
        if (!this.inExperiment && this.baselineRecommender) {
          this.baselineRecommender = null;
          this.refresh("experiment was turned off");
        }
        break;
      case "PREF_CHANGED_RESPONSE":
        // If the weightedHighlightsCoefficients pref was changed and we have a recommender, update it with
        // the new coefficients.
        if (action.data.name === "weightedHighlightsCoefficients" && this.baselineRecommender) {
          let highlightsCoefficients = this.getCoefficientsFromPrefs();
          this.baselineRecommender.updateOptions({highlightsCoefficients});
          this.refresh("coefficients were changed");
        }
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

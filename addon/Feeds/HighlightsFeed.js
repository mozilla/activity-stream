const simplePrefs = require("sdk/simple-prefs");
const {Cu} = require("chrome");
const {PlacesProvider} = require("addon/PlacesProvider");
const {Recommender} = require("common/recommender/Recommender");
const Feed = require("./Feed");
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
   *
   * @return {Promise}  Returns the promise created by .getAllHistoryItems
   */
  initializeRecommender() {
    return PlacesProvider.links.getAllHistoryItems().then(links => {
      let highlightsCoefficients = this.getCoefficientsFromPrefs();
      this.baselineRecommender = new Recommender(links, {highlightsCoefficients});
      // console.log("Highlights Recommender ready!");
    });
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
      // .then(links => {
      //   console.log(links.length + " weighted highlights returned from query");
      //   return links;
      // })
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
        if (this.inExperiment) {
          this.initializeRecommender().then(() => this.refresh("app was initializing"));
        } else {
          this.refresh();
        }
        break;
      case "RECEIVE_PLACES_CHANGES":
        if (!this.hasEnoughSites) {
          this.refresh("there were not enough sites");
        }
        else if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          this.refresh("data was too old");
        }
        break;
      case "EXPERIMENTS_RESPONSE":
        if (this.inExperiment && !this.baselineRecommender) {
          this.initializeRecommender().then(() => this.refresh("experiment was turned on"));
        }
        break;
      case "PREF_CHANGED_RESPONSE":
        if (action.data.name === "weightedHighlightsCoefficients" && this.baselineRecommender) {
          this.baselineRecommender.updateOptions({highlightsCoefficients: this.getCoefficientsFromPrefs()});
          // console.log("WEIGHTED HIGHLIGHTS COEFFICIENTS CHANGED");
        }
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

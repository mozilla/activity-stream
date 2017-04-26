/* globals Task */
const simplePrefs = require("sdk/simple-prefs");
const {Cu} = require("chrome");
const {PlacesProvider} = require("addon/PlacesProvider");
const {Recommender} = require("common/recommender/Recommender");
const Feed = require("addon/lib/Feed");
const {TOP_SITES_DEFAULT_LENGTH, HIGHLIGHTS_LENGTH} = require("common/constants");
const am = require("common/action-manager");
const getScreenshot = require("addon/lib/getScreenshot");

Cu.import("resource://gre/modules/Task.jsm");

const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes

module.exports = class HighlightsFeed extends Feed {
  constructor(options) {
    super(options);
    this.baselineRecommender = null; // Added in initializeRecommender
    this.getScreenshot = getScreenshot;
    this.missingData = false;
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
      this.baselineRecommender = new Recommender(links, {
        experiments: this.store.getState().Experiments.values,
        highlightsCoefficients
      });
    }).then(() => this.refresh(reason));
  }

  /**
   * shouldGetScreenshot - Returns true if the link/site provided meets the following:
   * - is a bookmark
   * - has metadata
   * - doesn't have any images
   *
   * @return bool
   */
  shouldGetScreenshot(link) {
    return link.bookmarkGuid &&
           link.hasMetadata &&
           (!link.images || link.images.length === 0);
  }

  /**
   * getData
   *
   * @return Promise  A promise that resolves with the "HIGHLIGHTS_RESPONSE" action
   */
  getData() {
    return Task.spawn(function*() {
      if (!this.baselineRecommender) {
        return Promise.reject(new Error("Tried to get weighted highlights but there was no baselineRecommender"));
      }

      let links;
      // Get links from places
      links = yield PlacesProvider.links.getRecentlyVisited();

      // Get metadata from PreviewProvider
      links = yield this.options.getCachedMetadata(links, "HIGHLIGHTS_RESPONSE");

      // Score the links
      links = yield this.baselineRecommender.scoreEntries(links);

      this.missingData = false;

      // Get screenshots if we are missing images
      links = links.slice(0, 18);
      for (let link of links) {
        if (this.shouldGetScreenshot(link)) {
          const screenshot = this.getScreenshot(link.url, this.store);
          if (screenshot) {
            link.screenshot = screenshot;
            link.metadata_source = `${link.metadata_source}+Screenshot`;
          } else {
            this.missingData = true;
          }
        }
        if (!link.hasMetadata) {
          this.missingData = true;
        }
      }

      return am.actions.Response("HIGHLIGHTS_RESPONSE", links);
    }.bind(this));
  }
  onAction(state, action) {
    // Ignore any actions that come in before APP_INIT. We aren't ready.
    if (!this.baselineRecommender && action.type !== am.type("APP_INIT")) {
      return;
    }

    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app inititalizes, create a recommender, and then refresh the data.
        this.initializeRecommender("app was initializing");
        break;
      case am.type("RECEIVE_BOOKMARK_ADDED"):
        // We always want new bookmarks
        this.refresh("a bookmark was added");
        break;
      case am.type("SCREENSHOT_UPDATED"):
        if (this.missingData) {
          this.refresh("new screenshot is available and we're missing data");
        }
        break;
      case am.type("METADATA_UPDATED"):
        if (this.missingData) {
          this.refresh("new metadata is available and we're missing data");
        } else if (state.Highlights.rows.length < (HIGHLIGHTS_LENGTH + TOP_SITES_DEFAULT_LENGTH)) {
          // If the user visits a site and we don't have enough weighted highlights yet, refresh the data.
          this.refresh("new metadata is available and there were not enough sites");
        } else if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          // If the user visits a site & the last time we refreshed the data was older than 15 minutes, refresh the data.
          this.refresh("new metadata is available and the sites were too old");
        }
        break;
      case am.type("PREF_CHANGED_RESPONSE"):
        // If the weightedHighlightsCoefficients pref was changed and we have a recommender, we reinitialize it.
        if (action.data.name === "weightedHighlightsCoefficients" && this.baselineRecommender) {
          this.initializeRecommender("coefficients were changed");
        }
        break;
      case am.type("SYNC_COMPLETE"):
        // We always want new synced tabs.
        this.refresh("new tabs synced");
        break;
      case am.type("MANY_LINKS_CHANGED"):
        // manyLinksChanged is an event fired by Places when all history is cleared,
        // or when frecency of links change due to something like a sync
        this.refresh("frecency of many links changed");
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

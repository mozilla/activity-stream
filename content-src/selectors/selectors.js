const {createSelector} = require("reselect");
const firstRunData = require("lib/first-run-data");
const selectAndDedupe = require("selectors/selectAndDedupe");
const {assignImageAndBackgroundColor} = require("selectors/colorSelectors");
const {SPOTLIGHT_DEFAULT_LENGTH, WEIGHTED_HIGHLIGHTS_LENGTH, TOP_SITES_LENGTH} = require("common/constants");

/**
 * justDispatch - This can be used just to add the dispatch function to the props of a component
 */
module.exports.justDispatch = (() => ({}));

/**
 * selectNewTabSites
 *
 * @return {obj}
 *    .TopSites {obj} State object for Top Sites
 *    .Highlights {obj} State object for Highlights, including a boolean .weightedHighlights indicating whether it is in the experiment or not
 *    .TopActivity {obj} State object (empty for weightedHighlights experiment)
 *    .isReady {bool} Do we have all the required data to display New Tab?
 *    .showRecommendationOption {bool} Should we show the option to turn recommendations off/on?
 */
module.exports.selectNewTabSites = createSelector(
  [
    state => true,
    state => state.WeightedHighlights, // XXXdmose remove selectSpotlight code itself for #1611
    state => state.TopSites,
    state => Object.assign({}, state.History, {rows: []}), // XXXdmose remove state.History and whatever code implemented that #1611
    state => state.Experiments
  ],
  (isNewHighlights, Highlights, TopSites, History, Experiments) => {
    const [topSitesRows, highlightsRows, historyRows] = selectAndDedupe([
      {
        sites: TopSites.rows,
        max: TOP_SITES_LENGTH,
        defaults: firstRunData.TopSites
      },
      {
        sites: isNewHighlights ? assignImageAndBackgroundColor(Highlights.rows) : Highlights.rows,
        max: isNewHighlights ? WEIGHTED_HIGHLIGHTS_LENGTH : SPOTLIGHT_DEFAULT_LENGTH,
        defaults: assignImageAndBackgroundColor(firstRunData.Highlights)
      },
      {sites: History.rows}
    ]);
    return {
      TopSites: Object.assign({}, TopSites, {rows: topSitesRows}),
      Highlights: Object.assign({}, Highlights, {rows: highlightsRows, weightedHighlights: isNewHighlights}),
      TopActivity: Object.assign({}, History, {rows: historyRows}),
      isReady: TopSites.init && Highlights.init && History.init && Experiments.init,
      showRecommendationOption: Experiments.values.recommendedHighlight
    };
  }
);

/**
 * selectShareProviders - for the Share component
 */
module.exports.selectShareProviders = state => ({ShareProviders: state.ShareProviders});

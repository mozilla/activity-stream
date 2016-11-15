const {createSelector} = require("common/vendor")("reselect");
const firstRunData = require("lib/first-run-data");
const selectAndDedupe = require("./selectAndDedupe");
const {assignImageAndBackgroundColor} = require("./colorSelectors");
const {TOP_SITES_LENGTH, HIGHLIGHTS_LENGTH} = require("common/constants");
const {areSelectorsReady} = require("./selectorUtils");

/**
 * justDispatch - This can be used just to add the dispatch function to the props of a component
 */
module.exports.justDispatch = (() => ({}));

/**
 * selectNewTabSites
 *
 * @return {obj}
 *    .TopSites {obj} State object for Top Sites
 *    .Highlights {obj} State object for Highlights
 *    .isReady {bool} Do we have all the required data to display New Tab?
 */
module.exports.selectNewTabSites = createSelector(
  [
    state => state.Highlights,
    state => state.TopSites,
    state => state.Experiments,
    state => state
  ],
  (Highlights, TopSites, Experiments, state) => {
    const [topSitesRows, highlightsRows] = selectAndDedupe([
      {
        sites: TopSites.rows,
        max: TOP_SITES_LENGTH,
        defaults: firstRunData.TopSites
      },
      {
        sites: assignImageAndBackgroundColor(Highlights.rows),
        max: HIGHLIGHTS_LENGTH
      }
    ]);
    return {
      TopSites: Object.assign({}, TopSites, {rows: topSitesRows}),
      Highlights: Object.assign({}, Highlights, {rows: highlightsRows}),
      isReady: areSelectorsReady(state)
    };
  }
);

/**
 * selectShareProviders - for the Share component
 */
module.exports.selectShareProviders = state => ({ShareProviders: state.ShareProviders});

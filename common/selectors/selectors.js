const {createSelector} = require("common/vendor")("reselect");
const firstRunData = require("lib/first-run-data");
const selectAndDedupe = require("./selectAndDedupe");
const {assignImageAndBackgroundColor} = require("./colorSelectors");
const {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH, HIGHLIGHTS_LENGTH} = require("common/constants");
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
    state => state.PocketStories,
    state => state.PocketTopics,
    state => state.TopSites,
    state => state.Experiments,
    state => state.Prefs,
    state => state
  ],

  (Highlights, PocketStories, PocketTopics, TopSites, Experiments, Prefs, state) => { // eslint-disable-line max-params
    const [topSitesRows, highlightsRows] = selectAndDedupe([
      {
        sites: TopSites.rows,
        max: Prefs.prefs.showMoreTopSites ? TOP_SITES_SHOWMORE_LENGTH : TOP_SITES_DEFAULT_LENGTH,
        defaults: firstRunData.TopSites
      },
      {
        sites: assignImageAndBackgroundColor(Highlights.rows),
        max: HIGHLIGHTS_LENGTH
      }
    ]);
    return {
      TopSites: Object.assign({}, TopSites, {rows: topSitesRows}),
      PocketStories: Object.assign({}, PocketStories),
      PocketTopics: Object.assign({}, PocketTopics),
      Highlights: Object.assign({}, Highlights, {rows: highlightsRows}),
      Experiments,
      Prefs,
      isReady: areSelectorsReady(state)
    };
  }
);

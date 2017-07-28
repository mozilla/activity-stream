const {createSelector} = require("common/vendor")("reselect");
const firstRunData = require("lib/first-run-data");
const {selectAndDedupe} = require("./selectAndDedupe");
const {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH} = require("common/constants");
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
    state => state.PocketStories,
    state => state.PocketTopics,
    state => state.TopSites,
    state => state.Experiments,
    state => state.Prefs,
    state => state.Bookmarks,
    state => state.VisitAgain,
    state => state
  ],

  (PocketStories, PocketTopics, TopSites, Experiments, Prefs, Bookmarks, VisitAgain, state) => { // eslint-disable-line max-params
    const [topSitesRows] = selectAndDedupe([
      {
        sites: TopSites.rows,
        max: Prefs.prefs.showMoreTopSites ? TOP_SITES_SHOWMORE_LENGTH : TOP_SITES_DEFAULT_LENGTH,
        defaults: firstRunData.TopSites
      }
    ]);
    return {
      TopSites: Object.assign({}, TopSites, {rows: topSitesRows}),
      PocketStories: Object.assign({}, PocketStories),
      PocketTopics: Object.assign({}, PocketTopics),
      Experiments,
      Prefs,
      Bookmarks: Object.assign({}, Bookmarks, {rows: Bookmarks.rows}),
      VisitAgain,
      isReady: areSelectorsReady(state)
    };
  }
);

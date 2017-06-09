const {createSelector} = require("common/vendor")("reselect");
const firstRunData = require("lib/first-run-data");
const {selectAndDedupe, dedupeOne} = require("./selectAndDedupe");
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
    state => state.Bookmarks,
    state => state.RecentlyVisited,
    state => state
  ],

  (Highlights, PocketStories, PocketTopics, TopSites, Experiments, Prefs, Bookmarks, RecentlyVisited, state) => { // eslint-disable-line max-params
    console.log("selector", RecentlyVisited);
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
    console.log(RecentlyVisited.rows.map(e => e.url));
    return {
      TopSites: Object.assign({}, TopSites, {rows: topSitesRows}),
      PocketStories: Object.assign({}, PocketStories),
      PocketTopics: Object.assign({}, PocketTopics),
      Highlights: Object.assign({}, Highlights, {rows: highlightsRows}),
      Experiments,
      Prefs,
      Bookmarks: Object.assign({}, Bookmarks, {rows: Bookmarks.rows}),
      RecentlyVisited: Object.assign({}, RecentlyVisited, {rows: dedupeOne(RecentlyVisited.rows)}),
      isReady: areSelectorsReady(state)
    };
  }
);

const {createSelector} = require("reselect");
const dedupe = require("lib/dedupe");
const getBestImage = require("lib/getBestImage");

const SPOTLIGHT_LENGTH = module.exports.SPOTLIGHT_LENGTH = 3;
const TOP_SITES_LENGTH = module.exports.TOP_SITES_LENGTH = 6;

module.exports.justDispatch = (() => ({}));

const selectSpotlight = module.exports.selectSpotlight = createSelector(
  [state => state.History],
  (History) => {
    const rows = History.rows
    .map(site => {
      const bestImage = getBestImage(site.images);
      return Object.assign({}, site, {bestImage});
    })
    .filter(site => {
      return (
        site.bestImage &&
        site.title &&
        site.description &&
        site.title !== site.description
      );
    });
    return Object.assign({}, History, {rows});
  }
);

module.exports.dedupedSites = createSelector(
  [
    state => state.TopSites,
    state => state.History,
    state => state.Bookmarks,
    selectSpotlight
  ],
  (TopSites, History, Bookmarks, Spotlight) => {
    let [topSitesRows, spotlightRows] = dedupe.group([TopSites.rows.slice(0, TOP_SITES_LENGTH), Spotlight.rows]);
    spotlightRows = spotlightRows.slice(0, SPOTLIGHT_LENGTH);
    const topActivityRows = dedupe.group([topSitesRows, spotlightRows, History.rows])[2];
    return {
      TopSites: Object.assign({}, TopSites, {rows: topSitesRows}),
      Spotlight: Object.assign({}, History, {rows: spotlightRows}),
      TopActivity: Object.assign({}, History, {rows: topActivityRows}),
      History,
      Bookmarks
    };
  }
);

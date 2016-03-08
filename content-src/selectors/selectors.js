const {createSelector} = require("reselect");
const dedupe = require("lib/dedupe");
const getBestImage = require("lib/getBestImage");

const SPOTLIGHT_LENGTH = module.exports.SPOTLIGHT_LENGTH = 3;
const TOP_SITES_LENGTH = module.exports.TOP_SITES_LENGTH = 6;

module.exports.justDispatch = (() => ({}));

const selectSpotlight = module.exports.selectSpotlight = createSelector(
  [state => state.FrecentHistory],
  (FrecentHistory) => {
    const rows = FrecentHistory.rows
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
    return Object.assign({}, FrecentHistory, {rows});
  }
);

module.exports.selectNewTabSites = createSelector(
  [
    state => state.TopSites,
    state => state.FrecentHistory,
    selectSpotlight
  ],
  (TopSites, FrecentHistory, Spotlight) => {
    let [topSitesRows, spotlightRows] = dedupe.group([TopSites.rows.slice(0, TOP_SITES_LENGTH), Spotlight.rows]);
    spotlightRows = spotlightRows.slice(0, SPOTLIGHT_LENGTH);
    const topActivityRows = dedupe.group([topSitesRows, spotlightRows, FrecentHistory.rows])[2].sort((a, b) => {
      return b.lastVisitDate - a.lastVisitDate;
    });
    return {
      TopSites: Object.assign({}, TopSites, {rows: topSitesRows}),
      Spotlight: Object.assign({}, FrecentHistory, {rows: spotlightRows}),
      TopActivity: Object.assign({}, FrecentHistory, {rows: topActivityRows})
    };
  }
);

const dedupe = require("lib/dedupe");
const {createSelector} = require("reselect");
const firstRunData = require("lib/first-run-data");
const {assignImageAndBackgroundColor} = require("selectors/colorSelectors");

const SPOTLIGHT_LENGTH = module.exports.SPOTLIGHT_LENGTH = 3;
const TOP_SITES_LENGTH = module.exports.TOP_SITES_LENGTH = 6;
const TOP_HIGHLIGHTS_LENGTH = module.exports.TOP_HIGHLIGHTS_LENGTH = SPOTLIGHT_LENGTH;
const BOTTOM_HIGHLIGHTS_LENGTH = module.exports.BOTTOM_HIGHLIGHTS_LENGTH = 12;

module.exports.justDispatch = (() => ({}));

function isValidSpotlightSite(site) {
  return (site.bestImage &&
    site.title &&
    site.description &&
    site.title !== site.description);
}

/**
 * Dedupe items and appends defaults if result length is smaller than required.
 *
 * @param {Array} options.sites - sites to process.
 * @param {Array} options.dedupe - sites to dedupe against.
 * @param {Number} options.max - required number of items.
 * @param {Array} options.defaults - default values to use.
 * @returns {Array}
 */
const selectAndDedupe = module.exports.selectAndDedupe = options => {
  let rows = dedupe.group([
    options.dedupe,
    options.sites])[1];

  if (rows.length < options.max && options.defaults) {
    rows = rows.concat(options.defaults);
  }

  return rows.slice(0, options.max);
};

const selectWeightedHighlights = module.exports.selectWeightedHighlights = createSelector(
  [
    state => state.WeightedHighlights
  ],
  WeightedHighlights => Object.assign({}, WeightedHighlights, {rows: assignImageAndBackgroundColor(WeightedHighlights.rows)})
);

const selectSpotlight = module.exports.selectSpotlight = createSelector(
  [
    state => state.Highlights,
    state => state.Prefs.prefs.recommendations,
    state => state.Prefs.prefs.metadataRatingSystem,
    selectWeightedHighlights,
    state => state.Experiments.values.weightedHighlights
  ],
  (Highlights, recommendationShown, metadataRating, WeightedHighlights, prefWeightedHighlights) => {
    let rows;
    if (prefWeightedHighlights) {
      rows = WeightedHighlights.rows;
    } else {
      // Only concat first run data if init is true
      const highlightRows = Highlights.rows.concat(Highlights.init ? firstRunData.Highlights : []);
      rows = assignImageAndBackgroundColor(highlightRows)
        .sort((site1, site2) => {
          const site1Valid = isValidSpotlightSite(site1);
          const site2Valid = isValidSpotlightSite(site2);
          if (site2.type === firstRunData.FIRST_RUN_TYPE) {
            return -1;
          } else if (site1.type === firstRunData.FIRST_RUN_TYPE) {
            return 1;
          } else if (site1Valid && site2Valid) {
            return 0;
          } else if (site2Valid) {
            return 1;
          }
          return -1;
        });
    }

    return Object.assign({}, Highlights, {rows, recommendationShown, metadataRating, prefWeightedHighlights});
  }
);

const selectTopSites = module.exports.selectTopSites = createSelector(
  [
    state => state.TopSites
  ],
  TopSites => Object.assign({}, TopSites, {
    rows: dedupe.one(TopSites.rows
      // Add first run stuff to the end if init has already happened
      .concat(TopSites.init ? firstRunData.TopSites : []))
  })
);

module.exports.selectNewTabSites = createSelector(
  [
    selectWeightedHighlights,
    state => state.Experiments.values.weightedHighlights,
    selectTopSites,
    state => state.History,
    selectSpotlight,
    state => state.Experiments
  ],
  (WeightedHighlights, prefWeightedHighlights, TopSites, History, Spotlight, Experiments) => {
    // Remove duplicates
    // Note that we have to limit the length of topsites, spotlight so we
    // don't dedupe against stuff that isn't shown
    let [topSitesRows, spotlightRows] = dedupe.group([TopSites.rows.slice(0, TOP_SITES_LENGTH), Spotlight.rows]);

    // Find the index of the recommendation. If we have an index, find that recommendation and put it
    // in the third highlights spot
    let recommendation = spotlightRows.findIndex(element => element.recommended);
    if (recommendation >= 0) {
      spotlightRows.splice(2, 0, spotlightRows.splice(recommendation, 1)[0]);
    }
    spotlightRows = spotlightRows.slice(0, SPOTLIGHT_LENGTH);
    const historyRows = dedupe.group([
      topSitesRows,
      spotlightRows,
      History.rows])[2];

    let topHighlights = spotlightRows;
    if (prefWeightedHighlights) {
      topHighlights = selectAndDedupe({
        dedupe: topSitesRows,
        sites: WeightedHighlights.rows,
        max: BOTTOM_HIGHLIGHTS_LENGTH + TOP_HIGHLIGHTS_LENGTH,
        defaults: assignImageAndBackgroundColor(firstRunData.Highlights)
      });
    }

    return {
      TopSites: Object.assign({}, TopSites, {rows: topSitesRows}),
      Spotlight: Object.assign({}, Spotlight, {rows: topHighlights, weightedHighlights: prefWeightedHighlights}),
      TopActivity: Object.assign({}, History, {rows: historyRows}),
      isReady: TopSites.init && History.init && Spotlight.init && Experiments.init && WeightedHighlights.init,
      showRecommendationOption: Experiments.values.recommendedHighlight
    };
  }
);

// Timeline History view
module.exports.selectHistory = createSelector(
  [
    selectSpotlight,
    state => state.Filter,
    state => state.History,
    selectWeightedHighlights,
    state => state.Experiments.values.weightedHighlights
  ],
  (Spotlight, Filter, History, WeightedHighlights, prefWeightedHighlights) => {
    let rows;
    if (prefWeightedHighlights) {
      rows = selectAndDedupe({
        sites: WeightedHighlights.rows,
        dedupe: [],
        max: TOP_HIGHLIGHTS_LENGTH,
        defaults: assignImageAndBackgroundColor(firstRunData.Highlights)
      });
    } else {
      rows = dedupe.one(Spotlight.rows);
    }

    return {
      Spotlight: Object.assign({}, Spotlight, {rows}),
      Filter,
      History
    };
  }
);

// Timeline Bookmarks
module.exports.selectBookmarks = createSelector(
  [
    state => state.Filter,
    state => state.Bookmarks
  ],
  (Filter, Bookmarks) => ({Filter, Bookmarks})
);

// Share Providers
module.exports.selectShareProviders = state => ({ShareProviders: state.ShareProviders});

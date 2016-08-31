const dedupe = require("lib/dedupe");
const {createSelector} = require("reselect");
const firstRunData = require("lib/first-run-data");
const {assignImageAndBackgroundColor} = require("selectors/colorSelectors");

const SPOTLIGHT_LENGTH = module.exports.SPOTLIGHT_LENGTH = 3;
const TOP_SITES_LENGTH = module.exports.TOP_SITES_LENGTH = 6;

module.exports.justDispatch = (() => ({}));

function isValidSpotlightSite(site) {
  return (site.bestImage &&
    site.title &&
    site.description &&
    site.title !== site.description);
}

const selectSpotlight = module.exports.selectSpotlight = createSelector(
  [
    state => state.Highlights,
    state => state.Prefs.prefs.recommendations,
    state => state.Prefs.prefs.metadataRatingSystem,
    state => state.WeightedHighlights,
    state => state.Prefs.prefs.weightedHighlights
  ],
  (Highlights, recommendationShown, metadataRating, WeightedHighlights, prefWeightedHighlights) => {
    let rows;
    if (prefWeightedHighlights) {
      rows = assignImageAndBackgroundColor(WeightedHighlights.rows);
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
    state => state.WeightedHighlights,
    state => state.Prefs.prefs.weightedHighlights,
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

    // Find the index of the recommendation. If we have an index, find that recommmendation and put it
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
      const weightedRows = WeightedHighlights.rows.concat(WeightedHighlights.init ? firstRunData.Highlights : []);
      topHighlights = assignImageAndBackgroundColor(weightedRows);
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
    state => state.WeightedHighlights,
    state => state.Prefs.prefs.weightedHighlights
  ],
  (Spotlight, Filter, History, WeightedHighlights, prefWeightedHighlights) => {
    let rows;
    if (prefWeightedHighlights) {
      rows = assignImageAndBackgroundColor(WeightedHighlights.rows);
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

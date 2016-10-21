const firstRunData = require("lib/first-run-data");
const {createSelector} = require("reselect");
const {assignImageAndBackgroundColor} = require("selectors/colorSelectors");

function isValidSpotlightSite(site) {
  return (site.bestImage &&
    site.title &&
    site.description &&
    site.title !== site.description);
}

module.exports.selectSpotlight = createSelector(
  [
    state => state.Highlights,
    state => state.Prefs.prefs.recommendations,
    state => state.Experiments.values.weightedHighlights
  ],
  (Highlights, recommendationShown, isNewHighlights) => {
    // Only concat first run data if init is true
    const highlightRows = Highlights.rows.concat(Highlights.init ? firstRunData.Highlights : []);
    let rows = assignImageAndBackgroundColor(highlightRows)
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

    return Object.assign({}, Highlights, {rows, recommendationShown, isNewHighlights});
  }
);

const {createSelector} = require("reselect");
const dedupe = require("lib/dedupe");
const getBestImage = require("lib/getBestImage");
const {prettyUrl, getBlackOrWhite, toRGBString, getRandomColor} = require("lib/utils");
const urlParse = require("url-parse");

const SPOTLIGHT_LENGTH = module.exports.SPOTLIGHT_LENGTH = 3;
const TOP_SITES_LENGTH = module.exports.TOP_SITES_LENGTH = 6;
const BACKGROUND_FADE = 0.5;

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

module.exports.selectSiteIcon = createSelector(
  site => site,
  site => {
    const favicon = site.favicon_url || site.favicon;
    const parsedUrl = site.parsedUrl || urlParse(site.url || "") ;
    const label = prettyUrl(parsedUrl.hostname);
    let background = getRandomColor(label);
    try { background = site.favicon_colors[0].color || background; } catch (e) {/**/}
    const backgroundColor = toRGBString(...background, favicon ? BACKGROUND_FADE : 1);
    const fontColor = getBlackOrWhite(...background);
    const firstLetter = prettyUrl(parsedUrl.hostname)[0];
    return {
      url: site.url,
      favicon,
      firstLetter,
      backgroundColor,
      fontColor,
      label
    };
  }
);

module.exports.selectSiteIcon.BACKGROUND_FADE = BACKGROUND_FADE;

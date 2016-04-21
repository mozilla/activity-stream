const {createSelector} = require("reselect");
const dedupe = require("lib/dedupe");
const getBestImage = require("lib/getBestImage");
const {prettyUrl, getBlackOrWhite, toRGBString, getRandomColor} = require("lib/utils");
const urlParse = require("url-parse");

const SPOTLIGHT_LENGTH = module.exports.SPOTLIGHT_LENGTH = 3;
const TOP_SITES_LENGTH = module.exports.TOP_SITES_LENGTH = 6;
const BACKGROUND_FADE = 0.5;
const DEFAULT_FAVICON_BG_COLOR = [150, 150, 150];

module.exports.justDispatch = (() => ({}));

function getBackgroundRGB(site) {
  if (site.favicon_colors && site.favicon_colors[0] && site.favicon_colors[0].color) {
    return site.favicon_colors[0].color;
  }

  const favicon = site.favicon_url || site.favicon;
  const parsedUrl = site.parsedUrl || urlParse(site.url || "") ;
  const label = prettyUrl(parsedUrl.hostname);
  return favicon ? DEFAULT_FAVICON_BG_COLOR : getRandomColor(label);
}

module.exports.getBackgroundRGB = getBackgroundRGB;

function isValidSpotlightSite(site) {
  return (site.bestImage &&
    site.title &&
    site.description &&
    site.title !== site.description);
}

const selectSpotlight = module.exports.selectSpotlight = createSelector(
  [
    state => state.Highlights,
    state => state.Blocked
  ],
  (Highlights, Blocked) => {
    const rows = Highlights.rows
    .filter(site => !Blocked.urls.has(site.url))
    .map(site => {
      const newProps = {};
      const bestImage = getBestImage(site.images);
      if (bestImage) {
        newProps.bestImage = bestImage;
      }
      newProps.backgroundColor = toRGBString(...getBackgroundRGB(site, [200, 200, 200]), BACKGROUND_FADE - 0.1);
      return Object.assign({}, site, newProps);
    })
    .sort((site1, site2) => {
      const site1Valid = isValidSpotlightSite(site1);
      const site2Valid = isValidSpotlightSite(site2);
      if (site1Valid && site2Valid) {
        return 0;
      } else if (site2Valid) {
        return 1;
      } else {
        return -1;
      }
    });
    return Object.assign({}, Highlights, {rows});
  }
);

module.exports.selectNewTabSites = createSelector(
  [
    state => state.TopSites,
    state => state.Highlights,
    state => state.History,
    selectSpotlight,
    state => state.Blocked
  ],
  (TopSites, Highlights, History, Spotlight, Blocked) => {

    // Removed blocked
    [TopSites, Spotlight] = [TopSites, Spotlight].map(item => {
      return Object.assign({}, item, {rows: item.rows.filter(site => !Blocked.urls.has(site.url))});
    });

    // Remove duplicates
    let [topSitesRows, spotlightRows] = dedupe.group([TopSites.rows.slice(0, TOP_SITES_LENGTH), Spotlight.rows]);

    // Limit spotlight length
    spotlightRows = spotlightRows.slice(0, SPOTLIGHT_LENGTH);

    // Dedupe top activity
    const topActivityRows = dedupe.group([topSitesRows, spotlightRows, History.rows])[2].sort((a, b) => {
      return b.lastVisitDate - a.lastVisitDate;
    }).filter(site => !Blocked.urls.has(site.url));

    return {
      TopSites: Object.assign({}, TopSites, {rows: topSitesRows}),
      Spotlight: Object.assign({}, Highlights, {rows: spotlightRows}),
      TopActivity: Object.assign({}, History, {rows: topActivityRows}),
      isReady: TopSites.init && Highlights.init && History.init
    };
  }
);

const selectSiteIcon = createSelector(
  site => site,
  site => {
    const favicon = site.favicon_url || site.favicon;
    const parsedUrl = site.parsedUrl || urlParse(site.url || "") ;
    const label = prettyUrl(parsedUrl.hostname);
    const backgroundRGB = getBackgroundRGB(site);
    const backgroundColor = toRGBString(...backgroundRGB, favicon ? BACKGROUND_FADE : 1);
    const fontColor = getBlackOrWhite(...backgroundRGB);
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

// Timeline History view
module.exports.selectHistory = createSelector(
  [
    selectSpotlight,
    state => state.History,
    state => state.Blocked
  ],
  (Spotlight, History, Blocked) => {
    return {
      Spotlight,
      History: Object.assign({}, History, {rows: History.rows.filter(site => !Blocked.urls.has(site.url))})
    };
  }
);

// Timeline Bookmarks
module.exports.selectBookmarks = createSelector(
  [
    state => state.Bookmarks,
    state => state.Blocked
  ],
  (Bookmarks, Blocked) => {
    return {
      Bookmarks: Object.assign({}, Bookmarks, {rows: Bookmarks.rows.filter(site => !Blocked.urls.has(site.url))})
    };
  }
);

module.exports.selectSiteIcon = selectSiteIcon;
module.exports.selectSiteIcon.BACKGROUND_FADE = BACKGROUND_FADE;
module.exports.DEFAULT_FAVICON_BG_COLOR = DEFAULT_FAVICON_BG_COLOR;

const {createSelector} = require("reselect");
const getBestImage = require("lib/getBestImage");
const {selectSiteProperties} = require("selectors/siteMetadataSelectors");
const {prettyUrl, getBlackOrWhite, toRGBString, getRandomColor} = require("lib/utils");

const DEFAULT_FAVICON_BG_COLOR = [150, 150, 150];
const BACKGROUND_FADE = 0.5;

function getBackgroundRGB(site) {
  // This is from firefox
  if (site.favicon_color) {
    return site.favicon_color;
  }

  if (site.favicons && site.favicons[0] && site.favicons[0].color) {
    return site.favicons[0].color;
  }

  if (site.favicon_colors && site.favicon_colors[0] && site.favicon_colors[0].color) {
    return site.favicon_colors[0].color;
  }

  const {favicon, label} = selectSiteProperties(site);
  return favicon ? DEFAULT_FAVICON_BG_COLOR : getRandomColor(label);
}

function assignImageAndBackgroundColor(rows) {
  return rows.map(site => {
    const newProps = {};
    const bestImage = getBestImage(site.images);
    if (bestImage) {
      newProps.bestImage = bestImage;
    }

    // Use site.background_color if it's defined, otherwise calculate one based on
    // the favicon_colors or a default color.
    newProps.backgroundColor = site.background_color || toRGBString(...getBackgroundRGB(site, [200, 200, 200]), BACKGROUND_FADE - 0.1);
    return Object.assign({}, site, newProps);
  });
}

const selectSiteIcon = createSelector(
  site => site,
  site => {
    const {favicon, parsedUrl, label} = selectSiteProperties(site);
    const backgroundRGB = getBackgroundRGB(site);
    const backgroundColor = site.background_color || toRGBString(...backgroundRGB, favicon ? BACKGROUND_FADE : 1);
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

module.exports.selectSiteIcon = selectSiteIcon;
module.exports.getBackgroundRGB = getBackgroundRGB;
module.exports.assignImageAndBackgroundColor = assignImageAndBackgroundColor;

const {createSelector} = require("reselect");
const getBestImage = require("common/getBestImage");
const {selectSiteProperties} = require("common/selectors/siteMetadataSelectors");
const {prettyUrl, getBlackOrWhite, toRGBString, getRandomColor} = require("lib/utils");
const {BACKGROUND_FADE} = require("common/constants");

const DEFAULT_FAVICON_BG_COLOR = [150, 150, 150];

/**
 * getFallbackColor - Selects the best background colour as RGB based on metadata.
 *                    If none can be determined, returns a random color based on the label,
 *                    or as a last resort, a default color.
 *
 * @param  {obj} site  A site object (with metadata)
 * @return {array}     An RGB colour as an array of numbers. E.g. [150, 150, 150]
 */
function getFallbackColor(site) {
  const {favicon, label} = selectSiteProperties(site);
  return favicon ? DEFAULT_FAVICON_BG_COLOR : getRandomColor(label);
}

/**
 * assignImageAndBackgroundColor - Calculates the best image and background color for each site in an array of sites
 *
 * @param  {arr} rows  An array of sites
 * @return {arr}       An array of sites, where each site has two additional properties:
 *                    .bestImage         an image object (e.g. {url: "http://foo.com/image.jpg"})
 *                    .backgroundColor  an array representing an RGB background color (e.g. [150, 150, 150])
 */
function assignImageAndBackgroundColor(rows) {
  return rows.map(site => {
    const newProps = {};
    const bestImage = getBestImage(site.images);
    if (bestImage) {
      newProps.bestImage = bestImage;
    }

    // Use site.background_color if it's defined, otherwise calculate one based on
    // the background_color or a default color.
    newProps.backgroundColor = toRGBString(site.background_color || [...getFallbackColor(site), BACKGROUND_FADE - 0.1]);
    return Object.assign({}, site, newProps);
  });
}

// TODO: Add testing. Make less hacky, more generic, etc.
function isAlmostWhite(rgb) {
  const almostWhiteThreshold = 230;
  if (rgb[0] > almostWhiteThreshold && rgb[1] > almostWhiteThreshold && rgb[2] > almostWhiteThreshold) {
    return true;
  }
  return false;
}

/**
 * selectSiteIcon
 *
 * @return {obj} An object of props for the SiteIcon component
 *    .url {str} The url of the site
 *    .favicon {str} The url of the favicon image for the site
 *    .backgroundColor {arr} an array representing an RGB background color (e.g. [150, 150, 150])
 *    .fontColor {arr} an array representing an RGB font color, either black ([0, 0, 0]) or white ([255, 255, 255])
 *    .label {str} A pretty url based on the hostname of the site
 */
const selectSiteIcon = createSelector(
  site => site,
  site => {
    const {favicon, parsedUrl, label} = selectSiteProperties(site);
    const backgroundRGB = site.background_color || [...getFallbackColor(site), favicon ? BACKGROUND_FADE : 1];
    const backgroundColor = toRGBString(backgroundRGB);
    const fontColor = getBlackOrWhite(...backgroundRGB);
    const firstLetter = prettyUrl(parsedUrl.hostname)[0];
    const backgroundColorIsAlmostWhite = isAlmostWhite(backgroundRGB);

    return {
      url: site.url,
      favicon,
      firstLetter,
      backgroundColor,
      backgroundColorIsAlmostWhite,
      fontColor,
      label
    };
  }
);

module.exports.selectSiteIcon = selectSiteIcon;
module.exports.getFallbackColor = getFallbackColor;
module.exports.assignImageAndBackgroundColor = assignImageAndBackgroundColor;

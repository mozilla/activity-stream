/* globals module */
"use strict";

const urlParse = require("common/vendor")("url-parse");

/**
 * Convert a hex color string to the RGB form, e.g. #0A0102 => [10, 1, 2]
 */
function hexToRGB(hex) {
  if (!hex) {
    return hex;
  }
  let hexToConvert = hex;
  // if the hex is in shorthand form, expand it first
  if (/^#?([a-f\d])([a-f\d])([a-f\d])$/i.test(hexToConvert)) {
    const expandedHex = [...hex].slice(1, 4).map(item => `${item}${item}`).join("");
    hexToConvert = `#${expandedHex}`;
  }
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexToConvert);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

/*
 * Consolidate favicons from tippytop, firefox, and our own metadata. Tippytop
 * is our number 1 choice, followed by the favicon returned by the metadata service,
 * and finally firefox's data URI as a last resort
 */
function consolidateFavicons(tippyTopFavicon, metadataFavicon, firefoxFavicon) {
  return tippyTopFavicon || metadataFavicon || firefoxFavicon;
}

/*
 * Consolidate the background colors from tippytop, firefox, and our own metadata.
 * TippyTop background color and metadata background color both need to be converted
 * from hex to an rgb array, whereas the firefox background color is already rgb
 */
function consolidateBackgroundColors(tippyTopBackgroundColor, metadataBackgroundColor, firefoxBackgroundColor) {
  return hexToRGB(tippyTopBackgroundColor) || hexToRGB(metadataBackgroundColor) || firefoxBackgroundColor;
}

function extractMetadataFaviconFields(link) {
  let result = {
    url: null,
    height: null,
    width: null,
    color: null
  };
  if (link && link.favicons && link.favicons.length) {
    const favicons = link.favicons[0];
    result.url = favicons.url;
    result.height = favicons.height;
    result.width = favicons.width;
    result.color = favicons.color;
  }
  return result;
}

/**
 * Returns true if the path of the passed in url is "/" or ""
 */
function isRootDomain(url) {
  const path = urlParse(url).pathname;
  return path === "/" || path === "";
}

module.exports = {
  consolidateFavicons,
  consolidateBackgroundColors,
  hexToRGB,
  extractMetadataFaviconFields,
  isRootDomain
};

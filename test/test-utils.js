/* globals require, exports */

"use strict";

const {hexToRGB, consolidateFavicons, consolidateBackgroundColors, extractMetadataFaviconFields} = require("addon/lib/utils");

exports.test_favicon_consolidation = function(assert) {
  // create some fake icon urls
  let fakeFirefoxFavicon = "firefoxFavicon.ico";
  let fakeTippyTopFavicon = "tippyTopFavicon.ico";
  let fakeMetadataFavicon = "metadataFavicon.ico";

  // choose the best one - it's tippytop
  let chosenFavicon = consolidateFavicons(fakeTippyTopFavicon, fakeMetadataFavicon, fakeFirefoxFavicon);
  assert.equal(chosenFavicon, fakeTippyTopFavicon, "chose the tippytop favicon first");

  // without tippytop the next best one should be from metadata service
  fakeTippyTopFavicon = null;
  chosenFavicon = consolidateFavicons(fakeTippyTopFavicon, fakeMetadataFavicon, fakeFirefoxFavicon);
  assert.equal(chosenFavicon, fakeMetadataFavicon, "chose the metadata favicon second");

  // without metadata service our last resort is the firefox favicon
  fakeMetadataFavicon = null;
  chosenFavicon = consolidateFavicons(fakeTippyTopFavicon, fakeMetadataFavicon, fakeFirefoxFavicon);
  assert.equal(chosenFavicon, fakeFirefoxFavicon, "and finally falls back to the firefox favicon");
};

exports.test_background_color_consolidation = function(assert) {
  // create some fake background colors
  let fakeFirefoxBackgroundColor = [150, 150, 150];
  let fakeTippyTopBackgroundColor = "#FFFFFF";
  let fakeMetadataBackgroundColor = "#000000";

  // choose the best one - it's tippytop but it should be converted from hex to rgb
  let chosenBackgroundColor = consolidateBackgroundColors(fakeTippyTopBackgroundColor, fakeMetadataBackgroundColor, fakeFirefoxBackgroundColor);
  assert.deepEqual(chosenBackgroundColor, hexToRGB(fakeTippyTopBackgroundColor), "chose the tippytop background color first");

  // without tippytop the next best one is from metadata, which should get converted from hex to rgb
  fakeTippyTopBackgroundColor = null;
  chosenBackgroundColor = consolidateBackgroundColors(fakeTippyTopBackgroundColor, fakeMetadataBackgroundColor, fakeFirefoxBackgroundColor);
  assert.deepEqual(chosenBackgroundColor, hexToRGB(fakeMetadataBackgroundColor), "chose the firefox background color second");

  // without metadata our last resort is firefox color, already in rgb
  fakeMetadataBackgroundColor = null;
  chosenBackgroundColor = consolidateBackgroundColors(fakeTippyTopBackgroundColor, fakeMetadataBackgroundColor, fakeFirefoxBackgroundColor);
  assert.equal(chosenBackgroundColor, fakeFirefoxBackgroundColor, "and finally falls back to metadata background colors");
};

exports.test_rgbToHex = function(assert) {
  const correctRGB = [0, 51, 255];
  let hex = "#0033FF";
  const longHex = hexToRGB(hex);
  assert.deepEqual(longHex, correctRGB, "successfully converted a long hex to rgb");

  hex = "#03F";
  const shortHex = hexToRGB(hex);
  assert.deepEqual(shortHex, correctRGB, "successfully converted a short hex to rgb");

  hex = null;
  const noHex = hexToRGB(hex);
  assert.equal(noHex, null, "return null if there is no hex to convert");
};

exports.test_extract_favicon_metadata_fields = function(assert) {
  let link = {favicons: [{url: "favicon.ico", height: 96, width: 96, color: [255, 255, 255]}]};
  const {url: goodURL, width: goodWidth, height: goodHeight, color: goodColor} = extractMetadataFaviconFields(link);
  assert.deepEqual(link.favicons[0].url, goodURL, "extracted correct url");
  assert.deepEqual(link.favicons[0].width, goodWidth, "extracted correct width");
  assert.deepEqual(link.favicons[0].height, goodHeight, "extracted correct height");
  assert.deepEqual(link.favicons[0].color, goodColor, "extracted correct color");

  link.favicons = [];
  const {url: nullURL, width: nullWidth, height: nullHeight, color: nullColor} = extractMetadataFaviconFields(link);
  assert.deepEqual(null, nullURL, "extracted a null url");
  assert.deepEqual(null, nullWidth, "extracted a null width");
  assert.deepEqual(null, nullHeight, "extracted a null height");
  assert.deepEqual(null, nullColor, "extracted a null color");
};

require("sdk/test").run(exports);

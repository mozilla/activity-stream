/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {RemoteSettings} = ChromeUtils.import("resource://services-settings/remote-settings.js", {});

// Returns whether the passed in params match the criteria.
// To match, they must contain all the params specified in criteria and the values
// must match if a value is provided in criteria.
function _hasParams(criteria, params) {
  for (let param of criteria) {
    const val = params.get(param.key);
    if (val === null || (param.value && param.value !== val)) {
      return false;
    }
  }
  return true;
}

/**
 * classifySite
 * Classifies a given URL into a category based on classification data from RemoteSettings.
 *
 */
async function classifySite(url, RS = RemoteSettings) {
  let category = "other";
  let parsedURL;

  // Try to parse the url.
  for (let _url of [url, `http://${url}`]) {
    try {
      parsedURL = new URL(_url);
      break;
    } catch (e) {}
  }

  if (parsedURL) {
    // If we parsed successfully, find a match.
    const hostname = parsedURL.hostname.replace(/^www\./i, "");
    const params = parsedURL.searchParams;
    const siteTypes = await RS("sites-classification").get();
    const sortedSiteTypes = siteTypes.sort((x, y) => y.weight - x.weight);
    for (let type of sortedSiteTypes) {
      for (let criteria of type.criteria) {
        if (criteria.url && criteria.url !== url) {
          continue;
        }
        if (criteria.hostname && criteria.hostname !== hostname) {
          continue;
        }
        if (criteria.params && !_hasParams(criteria.params, params)) {
          continue;
        }
        return type.type;
      }
    }
  }
  return category;
}

const EXPORTED_SYMBOLS = ["classifySite"];

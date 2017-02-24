/* globals Task, XPCOMUtils, PreviewProvider */

const {Cu} = require("chrome");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(global, "PreviewProvider",
                                  "resource:///modules/PreviewProvider.jsm");

/**
 * getScreenshots: Given an array of sites with a url property, returns a Promise
 *                 that resolves with new copy of the array of sites, each with a new .screenshot property
 *
 * @param  {array} sites                    An array of sites, where each site is an object with the property .url
 * @param  {func} condition (optional)      A function that takes a single param "site", which fetches a screenshot if it
 *                                          returns true, and skips it if it returns false
 * @return {Promise}                              description
 */
module.exports = Task.async(function*getScreenshots(sites, condition) {
  const result = {};

  // TODO: FIXME: Rewrite this function so that the screenshotting is done
  // in parallel. For a start, see
  // https://github.com/mozilla/activity-stream/pull/2058/commits/f974b48a1974d9fb024ccb239d59ad4fc25b5042
  for (let site of sites) {
    // Don't fetch screenshots if the site doesn't meet the conditions
    if (condition && !condition(site)) {
      continue;
    }

    try {
      const dataURI = yield PreviewProvider.getThumbnail(site.url);
      result[site.url] = dataURI;
    } catch (e) {
      Cu.reportError(e);
    }
  }
  return sites.map(site => {
    if (!result[site.url]) {
      return site;
    }
    return Object.assign({}, site, {screenshot: result[site.url]});
  });
});

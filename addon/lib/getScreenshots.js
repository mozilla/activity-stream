/* globals Task, XPCOMUtils, PreviewProvider */

const {Cu} = require("chrome");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PreviewProvider",
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
  return yield sites.map(Task.async(function*(site) {
    // Don't fetch screenshots if the site doesn't meet the conditions
    if (condition && !condition(site)) {
      return site;
    }

    // Get the image
    let dataURI;
    try {
      dataURI = yield PreviewProvider.getThumbnail(site.url);
    } catch (e) {
      Cu.reportError(e);
    }

    // Return the site if no image was found
    if (!dataURI) {
      return site;
    }

    return Object.assign({}, site, {screenshot: dataURI});
  }));
});

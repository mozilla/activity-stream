/* globals XPCOMUtils, PreviewProvider */

const {Cu} = require("chrome");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PreviewProvider",
                                  "resource:///modules/PreviewProvider.jsm");

/**
 * getScreenshot: Given an url and a store object, returns a screenshot dataURI or null
 *
 * @param  {str} url                    The url we want a screenshot for
 * @param  {obj} store                  A redux store which is an object with a dispatch method
 * @return {str|null}                   Return either the screenshot if it was available otherwise null
 */

// Store computed screenshots to be looked up later
const screenshotCache = new Map();

// A constant to mark a screenshot as being processed
const SCREENSHOT_IN_FLIGHT = "IN FLIGHT";

module.exports = function getScreenshot(url, store) {
  if (screenshotCache.has(url)) {
    const foundScreenshot = screenshotCache.get(url);
    if (foundScreenshot !== SCREENSHOT_IN_FLIGHT) {
      return foundScreenshot;
    }
  } else {
    screenshotCache.set(url, SCREENSHOT_IN_FLIGHT);
    PreviewProvider.getThumbnail(url).then(dataURI => {
      screenshotCache.set(url, dataURI);
      store.dispatch({type: "SCREENSHOT_UPDATED"});
    }).catch(e => {
      screenshotCache.set(url, null);
    });
  }
  return null;
};

// Expose private variables for testing
module.exports.screenshotCache = screenshotCache;
module.exports.SCREENSHOT_IN_FLIGHT = SCREENSHOT_IN_FLIGHT;

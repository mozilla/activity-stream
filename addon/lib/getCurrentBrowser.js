/* globals XPCOMUtils, windowMediator */
const {Cu} = require("chrome");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyServiceGetter(this, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

module.exports = function getCurrentBrowser() {
  const win = windowMediator.getMostRecentWindow("navigator:browser");
  const gBrowser = win.getBrowser();
  return gBrowser.selectedBrowser;
};

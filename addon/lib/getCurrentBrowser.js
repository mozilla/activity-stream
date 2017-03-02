const {Cu} = require("chrome");

const {XPCOMUtils} = Cu.import("resource://gre/modules/XPCOMUtils.jsm", {});
const jsmodules = {};
XPCOMUtils.defineLazyServiceGetter(jsmodules, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

module.exports = function getCurrentBrowser() {
  const win = jsmodules.windowMediator.getMostRecentWindow("navigator:browser");
  const gBrowser = win.getBrowser();
  return gBrowser.selectedBrowser;
};

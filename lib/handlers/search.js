/* globals XPCOMUtils, windowMediator */

const am = require("common/action-manager");
const {SearchProvider} = require("lib/SearchProvider");
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyServiceGetter(this, "windowMediator",
                                   "@mozilla.org/appshell/window-mediator;1",
                                   "nsIWindowMediator");

exports.handler = function SearchHandler(action, worker) {
  switch (action.type) {
    case am.type("SEARCH_STATE_REQUEST"):
      SearchProvider.search.state.then(state => {
        this.send(am.actions.Response("SEARCH_STATE_RESPONSE", state), worker);
      });
      break;
    case am.type("NOTIFY_PERFORM_SEARCH"):
      SearchProvider.search.state.then(state => {
        let win = windowMediator.getMostRecentWindow("navigator:browser");
        let gBrowser = win.getBrowser();
        let browser = gBrowser.selectedBrowser;
        let searchData = {
          engineName: state.currentEngine.name,
          searchString: action.data,
          healthReportKey: "d",
          searchPurpose: "d"
        };
        SearchProvider.search.performSearch(browser, searchData);
      });
      break;
  }
};

/* globals Task */
const {Cu} = require("chrome");
const {PlacesProvider} = require("addon/PlacesProvider");
const Feed = require("addon/lib/Feed");
const {TOP_SITES_LENGTH} = require("common/constants");
const am = require("common/action-manager");
const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes
const getScreenshots = require("addon/lib/getScreenshots");
const {isRootDomain} = require("addon/lib/utils");

Cu.import("resource://gre/modules/Task.jsm");

module.exports = class TopSitesFeed extends Feed {
  // Used by this.refresh
  getData() {
    return Task.spawn(function*() {
      const experiments = this.store.getState().Experiments.values;

      // Get links from places
      let links = yield experiments.originalNewTabSites ? PlacesProvider.links.asyncGetTopNewTabSites() : PlacesProvider.links.getTopFrecentSites();

      // Get metadata from PreviewProvider
      links = yield this.options.getCachedMetadata(links, "TOP_FRECENT_SITES_RESPONSE");

      // Get screenshots if the favicons are too small
      if (experiments.screenshots) {
        try {
          links = yield getScreenshots(links, site => {
            if (site.favicon_height >= 64 && site.favicon_width >= 64 && isRootDomain(site.url)) {
              // If we are at the "root domain path" and the icon is big enough,
              // we don't show a screenshot.
              return false;
            }
            return true;
          });
          links = links.map(link => {
            if (link.screenshot) {
              link.metadata_source = `${link.metadata_source}+Screenshot`;
            }
            return link;
          });
        } catch (e) {
          Cu.reportError(e);
        }
      }
      // Create the action
      return am.actions.Response("TOP_FRECENT_SITES_RESPONSE", links);
    }.bind(this));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app first starts up, refresh the data.
        this.refresh("app was initializing");
        break;
      case am.type("RECEIVE_PLACES_CHANGES"):
        // When a user visits a site, if we don't have enough top sites yet, refresh the data.
        if (state.TopSites.rows.length < TOP_SITES_LENGTH) {
          this.refresh("there were not enough sites");
        }
        // When a user visits a site, if the last time we refreshed the data is greater than 15 minutes, refresh the data.
        else if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          this.refresh("the sites were too old");
        }
        break;
      case am.type("MANY_LINKS_CHANGED"):
        // manyLinksChanged is an event fired by Places when all history is cleared,
        // or when frecency of links change due to something like a sync
        this.refresh("frecency of many links changed");
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

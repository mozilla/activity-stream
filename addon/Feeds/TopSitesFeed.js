/* globals Task */
const {Cu} = require("chrome");
const {PlacesProvider} = require("addon/PlacesProvider");
const Feed = require("addon/lib/Feed");
const {TOP_SITES_LENGTH} = require("common/constants");
const am = require("common/action-manager");
const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes
const MIN_ICON_SIZE = 64;
const getScreenshot = require("addon/lib/getScreenshot");
const {isRootDomain} = require("addon/lib/utils");

Cu.import("resource://gre/modules/Task.jsm");

module.exports = class TopSitesFeed extends Feed {
  constructor(...args) {
    super(...args);
    this.getScreenshot = getScreenshot;
    this.missingData = false;
  }
  shouldGetScreenshot(link) {
    const isMissingIcon = !link.favicon_width && !link.favicon_height;
    const hasSmallIcon = !isMissingIcon && ((link.favicon_width < MIN_ICON_SIZE) || (link.favicon_height < MIN_ICON_SIZE));
    const badIcon = link.hasMetadata && (isMissingIcon || hasSmallIcon);
    return !isRootDomain(link.url) || badIcon;
  }
  getData() {
    return Task.spawn(function*() {
      const experiments = this.store.getState().Experiments.values;

      let links;
      // Get links from places
      links = yield PlacesProvider.links.getTopFrecentSites();

      // Get metadata from PreviewProvider
      links = yield this.options.getCachedMetadata(links, "TOP_FRECENT_SITES_RESPONSE");

      this.missingData = false;

      // Get screenshots if the favicons are too small
      if (experiments.screenshots) {
        for (let link of links) {
          if (this.shouldGetScreenshot(link)) {
            const screenshot = this.getScreenshot(link.url, this.store);
            if (screenshot) {
              link.screenshot = screenshot;
              link.metadata_source = `${link.metadata_source}+Screenshot`;
            } else {
              this.missingData = true;
            }
          } else if (!link.hasMetadata) {
            this.missingData = true;
          }
        }
      }

      return am.actions.Response("TOP_FRECENT_SITES_RESPONSE", links);
    }.bind(this));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app first starts up, refresh the data.
        this.refresh("app was initializing");
        break;
      case am.type("SCREENSHOT_UPDATED"):
        if (this.missingData) {
          this.refresh("new screenshot is available and we're missing data");
        }
        break;
      case am.type("METADATA_UPDATED"):
        if (this.missingData) {
          this.refresh("new metadata is available and we're missing data");
        }
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
module.exports.MIN_ICON_SIZE = MIN_ICON_SIZE;

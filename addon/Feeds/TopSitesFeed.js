/* globals Task, NewTabUtils */
const {Cu} = require("chrome");
const {PlacesProvider} = require("addon/PlacesProvider");
const Feed = require("addon/lib/Feed");
const {TOP_SITES_SHOWMORE_LENGTH} = require("common/constants");
const am = require("common/action-manager");
const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes
const getScreenshot = require("addon/lib/getScreenshot");
const {isRootDomain} = require("addon/lib/utils");

Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/NewTabUtils.jsm");

module.exports = class TopSitesFeed extends Feed {
  constructor(options) {
    super(options);
    this.getScreenshot = getScreenshot;
    this.missingData = false;
    this.pinnedLinks = options.pinnedLinks || NewTabUtils.pinnedLinks;
  }
  shouldGetScreenshot(link) {
    return !isRootDomain(link.url) || (link.hasMetadata && !link.hasHighResIcon);
  }
  pinLink(action) {
    this.pinnedLinks.pin(action.data.site, action.data.index);
  }
  unpinLink(action) {
    this.pinnedLinks.unpin(action.data.site);
  }
  sortLinks(links, pinned) {
    // Separate out the pinned from the rest
    let pinnedLinks = [];
    let sortedLinks = [];
    links.forEach(link => {
      if (this.pinnedLinks.isPinned(link)) {
        pinnedLinks.push(link);
      } else {
        sortedLinks.push(link);
      }
    });

    // Insert the pinned links in their location
    pinned.forEach((val, index) => {
      if (!val) { return; }
      let site = Object.assign({}, pinnedLinks.find(link => link.url === val.url), {isPinned: true, pinIndex: index});
      if (index > sortedLinks.length) {
        sortedLinks[index] = site;
      } else {
        sortedLinks.splice(index, 0, site);
      }
    });

    return sortedLinks;
  }
  getData() {
    return Task.spawn(function*() {
      const experiments = this.store.getState().Experiments.values;

      // Get pinned links
      let pinned = this.pinnedLinks.links;

      // Get links from places and cache them
      let frecent = yield PlacesProvider.links.getTopFrecentSites();

      // Filter out pinned links from frecent
      frecent = frecent.filter(link => !this.pinnedLinks.isPinned(link));

      // Concat the pinned with the frecent
      let links = pinned.filter(link => !!link).concat(frecent);

      // Get metadata from PreviewProvider
      links = yield this.options.getCachedMetadata(links, "TOP_FRECENT_SITES_RESPONSE");

      this.missingData = false;

      // Get screenshots if the favicons are too small
      if (experiments.screenshotsLongCache) {
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

      // Place the pinned links where they go
      links = this.sortLinks(links, pinned);

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
        if (state.TopSites.rows.length < TOP_SITES_SHOWMORE_LENGTH) {
          this.refresh("there were not enough sites");
        } else if (Date.now() - this.state.lastUpdated >= UPDATE_TIME) {
          // When a user visits a site, if the last time we refreshed the data
          // is greater than 15 minutes, refresh the data.
          this.refresh("the sites were too old");
        }
        break;
      case am.type("MANY_LINKS_CHANGED"):
        // manyLinksChanged is an event fired by Places when all history is cleared,
        // or when frecency of links change due to something like a sync
        this.refresh("frecency of many links changed");
        break;
      case am.type("NOTIFY_PIN_TOPSITE"):
        this.pinLink(action);
        this.refresh("a site was pinned");
        break;
      case am.type("NOTIFY_UNPIN_TOPSITE"):
        this.unpinLink(action);
        this.refresh("a site was unpinned");
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

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
  addTopSite(action) {
    // Adding a top site pins it in the first slot, pushing over any link already
    // pinned in the slot.
    this._insertPin(action.data, 0);

    // Return the new set of top sites.
    this._getLinks()
      .then(links => this.options.send(am.actions.Response("TOP_FRECENT_SITES_RESPONSE", links), action.workerId, true))
      .catch(Cu.reportError);
  }
  editTopSite(action) {
    const {title, url, index} = action.data;
    const site = {title, url};

    // Editing a top site pins it in the specified slot index, replacing any link
    // already pinned in the slot.
    this.pinnedLinks.pin(site, index);

    // Return the new set of top sites.
    this._getLinks()
      .then(links => this.options.send(am.actions.Response("TOP_FRECENT_SITES_RESPONSE", links), action.workerId, true))
      .catch(Cu.reportError);
  }
  dropTopSite(action) {
    const {title, url, index} = action.data;
    const site = {title, url};

    // Dropping a top site pins it in the slot it was dropped, pushing over any link already
    // pinned in the slot (unless it's the last slot, then it replaces).
    this._insertPin(site, index);

    // Return the new set of top sites.
    this._getLinks()
      .then(links => this.options.send(am.actions.Response("TOP_FRECENT_SITES_RESPONSE", links), action.workerId, true))
      .catch(Cu.reportError);
  }
  _insertPin(site, index) {
    // Don't insert any pins past the end of the visible top sites. Otherwise,
    // we can end up with a bunch of pinned sites that can never be unpinned again
    // from the UI.
    if (index >= TOP_SITES_SHOWMORE_LENGTH) {
      return;
    }

    // Insert a pin at the given index. If that slot is already taken, we need
    // to insert it in the next slot. Rinse and repeat if that next slot is also
    // taken.
    let pinned = this.pinnedLinks.links;
    if (pinned.length > index && pinned[index]) {
      // OMG! RECURSION
      this._insertPin(pinned[index], index + 1);
    }
    this.pinnedLinks.pin(site, index);
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
      let site = Object.assign({}, pinnedLinks.find(link => link.url === val.url), {isPinned: true, pinIndex: index, pinTitle: val.title});
      if (index > sortedLinks.length) {
        sortedLinks[index] = site;
      } else {
        sortedLinks.splice(index, 0, site);
      }
    });

    return sortedLinks;
  }
  _getLinks() {
    return Task.spawn(function*() {
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

      // Place the pinned links where they go
      links = this.sortLinks(links, pinned);

      return links;
    }.bind(this));
  }
  getData() {
    return Task.spawn(function*() {
      const links = yield this._getLinks();

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
      case am.type("TOPSITES_ADD_REQUEST"):
        this.addTopSite(action);
        this.refresh("a site was added (pinned)");
        break;
      case am.type("TOPSITES_EDIT_REQUEST"):
        this.editTopSite(action);
        this.refresh("a site was edited");
        break;
      case am.type("TOPSITES_DROP_REQUEST"):
        this.dropTopSite(action);
        this.refresh("a site was dragged and dropped");
        break;
    }
  }
};

module.exports.UPDATE_TIME = UPDATE_TIME;

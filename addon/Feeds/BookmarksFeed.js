const {Cu} = require("chrome");
const {PlacesProvider} = require("addon/PlacesProvider");
const Feed = require("addon/lib/Feed");
const {BOOKMARKS_LENGTH} = require("common/constants");
const am = require("common/action-manager");
const getScreenshot = require("addon/lib/getScreenshot");

Cu.import("resource://gre/modules/Task.jsm");

const UPDATE_TIME = 15 * 60 * 1000; // 15 minutes

module.exports = class BookmarksFeed extends Feed {
  constructor(options) {
    super(options);
    this.getScreenshot = getScreenshot;
    this.missingData = false;
  }

  /**
   * shouldGetScreenshot - Returns true if the link/site provided meets the following:
   * - is a bookmark
   * - has metadata
   * - doesn't have any images
   *
   * @return bool
   */
  shouldGetScreenshot(link) {
    return link.bookmarkGuid &&
      link.hasMetadata &&
      (!link.images || link.images.length === 0);
  }

  /**
   * getData
   *
   * @return Promise  A promise that resolves with the "BOOKMARKS_RESPONSE" action
   */
  getData() {
    return Task.spawn(function*() {
      let links;
      // Get links from places
      links = yield PlacesProvider.links.getBookmarks({limit: BOOKMARKS_LENGTH});

      // Get metadata from PreviewProvider
      links = yield this.options.getCachedMetadata(links, "BOOKMARKS_RESPONSE");

      this.missingData = false;

      // Get screenshots if we are missing images
      for (let link of links) {
        if (this.shouldGetScreenshot(link)) {
          const screenshot = this.getScreenshot(link.url, this.store);
          if (screenshot) {
            link.screenshot = screenshot;
            link.metadata_source = `${link.metadata_source}+Screenshot`;
          } else {
            this.missingData = true;
          }
        }
        if (!link.hasMetadata) {
          this.missingData = true;
        }
      }

      return am.actions.Response("BOOKMARKS_RESPONSE", links);
    }.bind(this));
  }

  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        // When the app inititalizes refresh the data. TODO
        this.refresh("app was initializing");
        break;
      case am.type("RECEIVE_BOOKMARK_ADDED"):
        // We always want new bookmarks
        this.refresh("a bookmark was added");
        break;
      case am.type("RECEIVE_BOOKMARK_REMOVED"):
        this.refresh("a bookmark was removed");
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
      case am.type("SYNC_COMPLETE"):
        // We always want new synced tabs.
        this.refresh("new tabs synced");
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

const am = require("common/action-manager");
const {PlacesProvider} = require("lib/PlacesProvider");

exports.handler = function PlacesHandler(action, worker) {
  switch (action.type) {
    case am.type("TOP_FRECENT_SITES_REQUEST"):
      this._memoized.getTopFrecentSites(action.data).then(links => {
        this._processAndSendLinks(links, "TOP_FRECENT_SITES_RESPONSE", worker, action.meta);
      });
      break;
    case am.type("RECENT_BOOKMARKS_REQUEST"):
      this._memoized.getRecentBookmarks(action.data).then(links => {
        this._processAndSendLinks(links, "RECENT_BOOKMARKS_RESPONSE", worker, action.meta);
      });
      break;
    case am.type("RECENT_LINKS_REQUEST"):
      this._memoized.getRecentLinks(action.data).then(links => {
        this._processAndSendLinks(links, "RECENT_LINKS_RESPONSE", worker, action.meta);
      });
      break;
    case am.type("HIGHLIGHTS_LINKS_REQUEST"):
      this._memoized.getHighlightsLinks(action.data).then(links => {
        this._processAndSendLinks(links, "HIGHLIGHTS_LINKS_RESPONSE", worker, action.meta);
      });
      break;
    case am.type("NOTIFY_BOOKMARK_DELETE"):
      PlacesProvider.links.asyncDeleteBookmark(action.data);
      break;
    case am.type("NOTIFY_HISTORY_DELETE"):
      PlacesProvider.links.deleteHistoryLink(action.data);
      break;
    case am.type("NOTIFY_BLOCK_URL"):
      PlacesProvider.links.blockURL(action.data);
      break;
    case am.type("NOTIFY_UNBLOCK_URL"):
      PlacesProvider.links.unblockURL(action.data);
      break;
    case am.type("NOTIFY_UNBLOCK_ALL"):
      PlacesProvider.links.unblockAll();
      break;
  }
};

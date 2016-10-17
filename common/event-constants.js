const DEFAULT_PAGE = "NEW_TAB";

const constants = {
  CONTENT_TO_ADDON: "content-to-addon",
  ADDON_TO_CONTENT: "addon-to-content",
  defaultPage: DEFAULT_PAGE,
  events: new Set([
    "BLOCK",
    "BOOKMARK_ADD",
    "BOOKMARK_DELETE",
    "CLICK",
    "DELETE",
    "LOAD_MORE",
    "LOAD_MORE_SCROLL",
    "OPEN_NEW_WINDOW",
    "OPEN_PRIVATE_WINDOW",
    "SEARCH",
    "SHARE",
    "UNBLOCK",
    "UNBLOCK_ALL",
    "TOGGLE_RECOMMENDATION",
    "NEW_RECOMMENDATION",
    "SHARE_TOOLBAR"
  ]),
  sources: new Set([
    "TOP_SITES",
    "FEATURED",
    "ACTIVITY_FEED"
  ])
};

module.exports = constants;

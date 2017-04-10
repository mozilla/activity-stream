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
    "CLOSE_EDIT_TOPSITES",
    "CLOSE_NEWTAB_PREFS",
    "DELETE",
    "LOAD_MORE",
    "LOAD_MORE_SCROLL",
    "OPEN_EDIT_TOPSITES",
    "OPEN_NEWTAB_PREFS",
    "OPEN_NEW_WINDOW",
    "OPEN_PRIVATE_WINDOW",
    "PIN",
    "SEARCH",
    "UNBLOCK",
    "UNPIN"
  ]),
  undesiredEvents: new Set([
    "HIDE_LOADER",
    "MISSING_IMAGE",
    "SHOW_LOADER",
    "SLOW_ADDON_DETECTED"
  ]),
  sources: new Set([
    "TOP_SITES",
    "FEATURED",
    "ACTIVITY_FEED",
    "NEW_TAB"
  ])
};

module.exports = constants;

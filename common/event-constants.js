const DEFAULT_PAGE = "NEW_TAB";

const constants = {
  CONTENT_TO_ADDON: "content-to-addon",
  ADDON_TO_CONTENT: "addon-to-content",
  defaultPage: DEFAULT_PAGE,
  events: new Set([
    "ADD_TOPSITE",
    "BLOCK",
    "BOOKMARK_ADD",
    "BOOKMARK_DELETE",
    "CLICK",
    "CLOSE_EDIT_TOPSITES",
    "CLOSE_NEWTAB_PREFS",
    "DELETE",
    "DRAG_TOPSITE",
    "DROP_TOPSITE",
    "EDIT_TOPSITE",
    "LOAD_MORE",
    "LOAD_MORE_SCROLL",
    "OPEN_ADD_TOPSITE_FORM",
    "OPEN_EDIT_TOPSITES",
    "OPEN_EDIT_TOPSITE_FORM",
    "OPEN_NEWTAB_PREFS",
    "OPEN_NEW_WINDOW",
    "OPEN_PRIVATE_WINDOW",
    "PIN",
    "SAVE_TO_POCKET",
    "SEARCH",
    "UNBLOCK",
    "UNPIN"
  ]),
  undesiredEvents: new Set([
    "HIDE_LOADER",
    "MISSING_IMAGE",
    "SHOW_LOADER"
  ]),
  sources: new Set([
    "TOP_SITES",
    "FEATURED",
    "RECOMMENDED",
    "ACTIVITY_FEED",
    "NEW_TAB",
    "BOOKMARKS"
  ])
};

module.exports = constants;

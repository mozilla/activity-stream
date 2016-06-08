const DEFAULT_PAGE = "NEW_TAB";
const urlPatternToPageMap = new Map([
  [/\/timeline$/, "TIMELINE_ALL"],
  [/\/timeline\/bookmarks$/, "TIMELINE_BOOKMARKS"]
]);

const constants = {
  CONTENT_TO_ADDON: "content-to-addon",
  ADDON_TO_CONTENT: "addon-to-content",
  urlPatternToPageMap,
  defaultPage: DEFAULT_PAGE,
  pages: new Set(Array.from(urlPatternToPageMap.values()).concat(DEFAULT_PAGE)),
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
    "UNBLOCK_ALL"
  ]),
  sources: new Set([
    "TOP_SITES",
    "FEATURED",
    "ACTIVITY_FEED"
  ])
};

module.exports = constants;

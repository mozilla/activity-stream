const DEFAULT_PAGE = "NEW_TAB";
const urlPatternToPageMap = new Map([
  [/\/timeline$/, "TIMELINE_ALL"],
  [/\/timeline\/bookmarks$/, "TIMELINE_BOOKMARKS"]
]);

const constants = {
  CONTENT_TO_ADDON: "content-to-addon",
  urlPatternToPageMap,
  defaultPage: DEFAULT_PAGE,
  pages: new Set(Array.from(urlPatternToPageMap.values()).concat(DEFAULT_PAGE)),
  events: new Set([
    "CLICK",
    "DELETE",
    "BOOKMARK_DELETE",
    "BLOCK",
    "UNBLOCK",
    "UNBLOCK_ALL",
    "SHARE",
    "LOAD_MORE",
    "LOAD_MORE_SCROLL",
    "SEARCH"
  ]),
  sources: new Set([
    "TOP_SITES",
    "FEATURED",
    "ACTIVITY_FEED"
  ])
};

module.exports = constants;

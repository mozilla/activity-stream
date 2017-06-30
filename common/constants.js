module.exports = {
  // The opacity value of favicon background colors
  BACKGROUND_FADE: 0.5,

  // Age of bookmarks in milliseconds that results in a 1.0 quotient, i.e., an
  // age smaller/younger than this value results in a larger-than-1.0 fraction
  BOOKMARK_AGE_DIVIDEND: 3 * 24 * 60 * 60 * 1000,

  // What is our default locale for the app?
  DEFAULT_LOCALE: "en-US",

  // Locales that should be displayed RTL
  RTL_LIST: ["ar", "he", "fa", "ur"],

  // Number of large Highlight tiles used to display Pocket story recommendations
  POCKET_STORIES_LENGTH: 3,

  // Number of "Read More" topics to display at the bottom of Pocket recommendations
  POCKET_TOPICS_LENGTH: 5,

  // Number of items in the Bookmarks section. Request more than actually being displayed
  // in case the user will remove some of them we still have 3 items to display.
  BOOKMARKS_LENGTH: 12,
  BOOKMARKS_DISPLAYED_LENGTH: 3,
  // Delay amount added to oldest bookmarkAdded timestamp, used to filter out default browser bookmarks.
  BOOKMARKS_THRESHOLD: 3 * 1e6, // 3 seconds to microseconds.

  // Number of links requested from placesProvider.
  VISITAGAIN_LENGTH: 24,
  // Number of links actually displayed.
  VISITAGAIN_DISPLAYED_LENGTH: 6,

  // How many items per query?
  LINKS_QUERY_LIMIT: 500,

  // This is where we cache redux state so it can be shared between pages
  LOCAL_STORAGE_KEY: "ACTIVITY_STREAM_STATE",

  // Default number of top sites
  TOP_SITES_DEFAULT_LENGTH: 6,

  // Number of top sites with show more pref enabled
  TOP_SITES_SHOWMORE_LENGTH: 12,

  // This is a perf event
  WORKER_ATTACHED_EVENT: "WORKER_ATTACHED",

  // Newtab preferences encoding
  NEWTAB_PREFS_ENCODING: {
    "showSearch": 1 << 0,
    "showTopSites": 1 << 1,
    "showMoreTopSites": 1 << 3,
    "showPocket": 1 << 4,
    "collapseBookmarks": 1 << 6,
    "showBookmarks": 1 << 7,
    "showVisitAgain": 1 << 8,
    "collapseVisitAgain": 1 << 9,
    "defaultBookmarksAge": 1 << 10
  },

  // The minimum size to consider an icon high res
  MIN_HIGHRES_ICON_SIZE: 64,

  // Frequency at which the SYSTEM_TICK event is fired
  SYSTEM_TICK_INTERVAL: 5 * 60 * 1000
};

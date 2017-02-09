module.exports = {
  // The opacity value of favicon background colors
  BACKGROUND_FADE: 0.5,

  // Age of bookmarks in milliseconds that results in a 1.0 quotient, i.e., an
  // age smaller/younger than this value results in a larger-than-1.0 fraction
  BOOKMARK_AGE_DIVIDEND: 3 * 24 * 60 * 60 * 1000,

  // What is our default locale for the app?
  DEFAULT_LOCALE: "en-US",

  // Number of large Highlight titles in the new Highlights world, including
  // all rows.
  HIGHLIGHTS_LENGTH: 9,

  // How many items per query?
  LINKS_QUERY_LIMIT: 500,

  // This is where we cache redux state so it can be shared between pages
  LOCAL_STORAGE_KEY: "ACTIVITY_STREAM_STATE",

  // Number of top sites
  TOP_SITES_LENGTH: 6,

  // This is a perf event
  WORKER_ATTACHED_EVENT: "WORKER_ATTACHED"
};

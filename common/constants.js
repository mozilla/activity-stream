module.exports = {
  // The opacity value of favicon background colors
  BACKGROUND_FADE: 0.5,

  // Number of large Highlight titles in the new Highlights world, including
  // all rows.
  HIGHLIGHTS_LENGTH: 9,

  // Thresholds for highlights query
  HIGHLIGHTS_THRESHOLDS: {
    created: "-3 day",
    visited: "-30 minutes",
    ageLimit: "-4 day"
  },

  // How many items per query?
  LINKS_QUERY_LIMIT: 20,

  // This is where we cache redux state so it can be shared between pages
  LOCAL_STORAGE_KEY: "ACTIVITY_STREAM_STATE",

  // Number of top sites
  TOP_SITES_LENGTH: 6,

  // This is a perf event
  WORKER_ATTACHED_EVENT: "WORKER_ATTACHED"
};

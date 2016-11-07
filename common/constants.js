module.exports = {
  // How many items per query?
  LINKS_QUERY_LIMIT: 20,

  // Number of top sites
  TOP_SITES_LENGTH: 6,

  // Number of large Highlight titles in the new Highlights world, including
  // all rows.
  HIGHLIGHTS_LENGTH: 9,

  // Thresholds for highlights query
  HIGHLIGHTS_THRESHOLDS: {
    created: "-3 day",
    visited: "-30 minutes",
    ageLimit: "-4 day"
  },

  // This is how many pixels before the bottom that
  // infinite scroll is triggered
  INFINITE_SCROLL_THRESHOLD: 20,

  // How many pixels offset for the infinite scroll top
  // due to the header?
  SCROLL_TOP_OFFSET: 50,

  // This is where we cache redux state so it can be shared between pages
  LOCAL_STORAGE_KEY: "ACTIVITY_STREAM_STATE"
};

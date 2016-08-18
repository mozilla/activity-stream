module.exports = {
  // How many items per query?
  LINKS_QUERY_LIMIT: 20,

  // Number of large Highlight tiles.
  SPOTLIGHT_DEFAULT_LENGTH: 3,

  // Max number of Recent Activity/More Highlights section.
  MAX_TOP_ACTIVITY_ITEMS: 10,

  // Time interval for for frecent links query in milliseconds (72 hours).
  FRECENT_RESULTS_TIME_LIMIT: 72 * 60 * 60 * 1000,

  // Thresholds for highlights query
  HIGHLIGHTS_THRESHOLDS: {
    created: "-3 day",
    visited: "-1 minutes",
    ageLimit: "-4 day"
  },

  // This is how many pixels before the bottom that
  // infinite scroll is triggered
  INFINITE_SCROLL_THRESHOLD: 20,

  // How many pixels offset for the infinite scroll top
  // due to the header?
  SCROLL_TOP_OFFSET: 50
};

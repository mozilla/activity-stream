module.exports = {
  // How many items per query?
  LINKS_QUERY_LIMIT: 20,

  // Time interval for for frecent links query in milliseconds (72 hours).
  FRECENT_RESULTS_TIME_LIMIT: 72 * 60 * 60 * 1000,

  // Thresholds for highlights query
  HIGHLIGHTS_THRESHOLDS: {
    created: "-3 day",
    visited: "-30 minutes",
  }
};

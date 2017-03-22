const am = require("common/action-manager");

const DEFAULTS = {
  rows: [],
  error: false,
  init: false,
  isLoading: false,
  canLoadMore: true
};

module.exports = function setRowsOrError(requestType, responseType, querySize) {
  return (prevState = DEFAULTS, action) => {
    const state = {};
    const meta = action.meta || {};
    switch (action.type) {
      case am.type(requestType):
        state.isLoading = true;
        break;
      case am.type(responseType):
        state.isLoading = false;
        if (action.error) {
          state.rows = meta.append ? prevState.rows : [];
          state.error = action.data;
        } else {
          state.init = true;
          state.rows = meta.append ? prevState.rows.concat(action.data) : action.data;
          state.error = false;
          // If there is no data, we definitely can't load more.
          if (!action.data || !action.data.length) {
            state.canLoadMore = false;
          } else if (querySize && action.data.length < querySize) {
            // If the results returned are less than the query size, we should
            // be on our last page of results.
            state.canLoadMore = false;
          }
        }
        break;
      case am.type("RECEIVE_BOOKMARK_ADDED"):
        state.rows = prevState.rows.map(site => {
          if (site.url === action.data.url) {
            const {bookmarkGuid, bookmarkTitle, lastModified} = action.data;
            const frecency = typeof action.data.frecency !== "undefined" ? action.data.frecency : site.frecency;
            return Object.assign({}, site, {bookmarkGuid, bookmarkTitle, frecency, bookmarkDateCreated: lastModified});
          }
          return site;
        });
        break;
      case am.type("RECEIVE_BOOKMARK_REMOVED"):
        state.rows = prevState.rows.map(site => {
          if (site.url === action.data.url) {
            const frecency = typeof action.data.frecency !== "undefined" ? action.data.frecency : site.frecency;
            const newSite = Object.assign({}, site, {frecency});
            delete newSite.bookmarkGuid;
            delete newSite.bookmarkTitle;
            delete newSite.bookmarkDateCreated;
            return newSite;
          }
          return site;
        });
        break;
      case am.type("NOTIFY_BLOCK_URL"):
      case am.type("NOTIFY_HISTORY_DELETE"):
        state.rows = prevState.rows.filter(val => val.url !== action.data);
        break;
      case requestType === "RECENT_LINKS_REQUEST" && am.type("NOTIFY_FILTER_QUERY"):
        // Allow loading more even if we hit the end as the filter has changed
        state.canLoadMore = true;
        break;
      default:
        return prevState;
    }
    return Object.assign({}, prevState, state);
  };
};
module.exports.DEFAULTS = DEFAULTS;

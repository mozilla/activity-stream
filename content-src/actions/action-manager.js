// This has to be relative so the firefox add-on side can read the path
const ActionManager = require("../lib/ActionManager");

const am = new ActionManager([
  "TOP_FRECENT_SITES_REQUEST",
  "TOP_FRECENT_SITES_RESPONSE",
  "RECEIVE_PLACES_CHANGES",
  "RECENT_BOOKMARKS_REQUEST",
  "RECENT_BOOKMARKS_RESPONSE",
  "RECEIVE_BOOKMARKS_CHANGES",
]);

function Response(type, data, options = {}) {
  const action = {type, data};
  if (options.error) {
    action.error = true;
  }
  return action;
}

function RequestExpect(type, expect, options = {}) {
  const action = {
    type,
    meta: {broadcast: "content-to-addon", expect}
  };
  if (options.timeout) {
    action.meta.timeout = options.timeout;
  }
  if (options.query) {
    action.query = options.query;
  }
  return action;
}

function RequestTopFrecent() {
  return RequestExpect("TOP_FRECENT_SITES_REQUEST", "TOP_FRECENT_SITES_RESPONSE");
}

function RequestBookmarks() {
  return RequestExpect("RECENT_BOOKMARKS_REQUEST", "RECENT_BOOKMARKS_RESPONSE");
}

am.defineActions({
  Response,
  RequestExpect,
  RequestTopFrecent,
  RequestBookmarks,
});

module.exports = am;

// This has to be relative so the firefox add-on side can read the path
const ActionManager = require("../lib/ActionManager");

const am = new ActionManager([
  "TOP_FRECENT_SITES_REQUEST",
  "TOP_FRECENT_SITES_RESPONSE",
  "RECEIVE_PLACES_CHANGES",
  "RECENT_BOOKMARKS_REQUEST",
  "RECENT_BOOKMARKS_RESPONSE",
  "RECEIVE_BOOKMARKS_CHANGES",
  "RECENT_LINKS_REQUEST",
  "RECENT_LINKS_RESPONSE",
  "FRECENT_LINKS_REQUEST",
  "FRECENT_LINKS_RESPONSE",
  "NOTIFY_HISTORY_DELETE",
  "NOTIFY_PERFORM_SEARCH",
  "RECEIVE_CURRENT_ENGINE",
  "SEARCH_STATE_REQUEST",
  "SEARCH_STATE_RESPONSE",
  "NOTIFY_ROUTE_CHANGE",
  "NOTIFY_PERFORMANCE",
]);

// This is a a set of actions that have sites in them,
// so we can do stuff like filter them, add embedly data, etc.
am.ACTIONS_WITH_SITES = new Set([
  "TOP_FRECENT_SITES_RESPONSE",
  "RECENT_BOOKMARKS_RESPONSE",
  "RECENT_LINKS_RESPONSE",
  "FRECENT_LINKS_RESPONSE"
].map(type => am.type(type)));

function Notify(type, data) {
  const action = {
    type,
    meta: {broadcast: "content-to-addon"}
  };
  if (data) {
    action.data = data;
  }
  return action;
}

function Response(type, data, options = {}) {
  const action = {type, data};
  if (options.error) {
    action.error = true;
  }
  if (options.append) {
    action.meta = {append: true};
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
  if (options.data) {
    action.data = options.data;
  }
  if (options.append) {
    action.meta.append = true;
  }
  return action;
}

function RequestTopFrecent() {
  return RequestExpect("TOP_FRECENT_SITES_REQUEST", "TOP_FRECENT_SITES_RESPONSE");
}

function RequestBookmarks() {
  return RequestExpect("RECENT_BOOKMARKS_REQUEST", "RECENT_BOOKMARKS_RESPONSE");
}

function RequestRecentLinks(options) {
  return RequestExpect("RECENT_LINKS_REQUEST", "RECENT_LINKS_RESPONSE", options);
}

function RequestMoreRecentLinks(beforeDate) {
  return RequestExpect("RECENT_LINKS_REQUEST", "RECENT_LINKS_RESPONSE", {
    data: {beforeDate},
    append: true
  });
}

function RequestFrecentLinks() {
  return RequestExpect("FRECENT_LINKS_REQUEST", "FRECENT_LINKS_RESPONSE");
}

function RequestSearchState() {
  return RequestExpect("SEARCH_STATE_REQUEST", "SEARCH_STATE_RESPONSE");
}

function NotifyHistoryDelete(data) {
  return Notify("NOTIFY_HISTORY_DELETE", data);
}

function NotifyPerformSearch(data) {
  return Notify("NOTIFY_PERFORM_SEARCH", data);
}

function NotifyRouteChange(data) {
  return Notify("NOTIFY_ROUTE_CHANGE", data);
}

function NotifyTelemetry(data) {
  return Notify("NOTIFY_PERFORMANCE", data);
}

am.defineActions({
  Notify,
  Response,
  RequestExpect,
  RequestTopFrecent,
  RequestBookmarks,
  RequestRecentLinks,
  RequestMoreRecentLinks,
  RequestFrecentLinks,
  RequestSearchState,
  NotifyHistoryDelete,
  NotifyPerformSearch,
  NotifyRouteChange,
  NotifyTelemetry,
});

module.exports = am;

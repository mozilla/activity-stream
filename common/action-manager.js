// This has to be relative so the firefox add-on side can read the path
const ActionManager = require("./ActionManager");
const eventConstants = require("./event-constants");

const am = new ActionManager([
  "TOP_FRECENT_SITES_REQUEST",
  "TOP_FRECENT_SITES_RESPONSE",
  "RECEIVE_PLACES_CHANGES",
  "RECENT_BOOKMARKS_REQUEST",
  "RECENT_BOOKMARKS_RESPONSE",
  "RECEIVE_BOOKMARKS_CHANGES",
  "RECENT_LINKS_REQUEST",
  "RECENT_LINKS_RESPONSE",
  "HIGHLIGHTS_LINKS_REQUEST",
  "HIGHLIGHTS_LINKS_RESPONSE",
  "EXPERIMENTS_REQUEST",
  "EXPERIMENTS_RESPONSE",
  "NOTIFY_BLOCK_URL",
  "NOTIFY_UNBLOCK_URL",
  "NOTIFY_UNBLOCK_ALL",
  "NOTIFY_BOOKMARK_ADD",
  "NOTIFY_BOOKMARK_DELETE",
  "NOTIFY_HISTORY_DELETE",
  "NOTIFY_HISTORY_DELETE_CANCELLED",
  "NOTIFY_PERFORM_SEARCH",
  "RECEIVE_CURRENT_ENGINE",
  "SEARCH_STATE_REQUEST",
  "SEARCH_STATE_RESPONSE",
  "NOTIFY_ROUTE_CHANGE",
  "NOTIFY_PERFORMANCE",
  "NOTIFY_USER_EVENT",
  "NOTIFY_OPEN_WINDOW"
]);

// This is a a set of actions that have sites in them,
// so we can do stuff like filter them, add embedly data, etc.
am.ACTIONS_WITH_SITES = new Set([
  "TOP_FRECENT_SITES_RESPONSE",
  "RECENT_BOOKMARKS_RESPONSE",
  "RECENT_LINKS_RESPONSE",
  "HIGHLIGHTS_LINKS_RESPONSE",
].map(type => am.type(type)));

function Notify(type, data) {
  const action = {
    type,
    meta: {broadcast: eventConstants.CONTENT_TO_ADDON}
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
    meta: {broadcast: eventConstants.CONTENT_TO_ADDON, expect}
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

function RequestBookmarks(options) {
  return RequestExpect("RECENT_BOOKMARKS_REQUEST", "RECENT_BOOKMARKS_RESPONSE", options);
}

function RequestMoreBookmarks(beforeDate) {
  return RequestBookmarks({
    data: {beforeDate},
    append: true,
    skipPreviewRequest: true
  });
}

function RequestRecentLinks(options) {
  return RequestExpect("RECENT_LINKS_REQUEST", "RECENT_LINKS_RESPONSE", options);
}

function RequestMoreRecentLinks(beforeDate) {
  return RequestRecentLinks({
    data: {beforeDate},
    append: true,
    skipPreviewRequest: true
  });
}

function RequestHighlightsLinks() {
  return RequestExpect("HIGHLIGHTS_LINKS_REQUEST", "HIGHLIGHTS_LINKS_RESPONSE");
}

function RequestSearchState() {
  return RequestExpect("SEARCH_STATE_REQUEST", "SEARCH_STATE_RESPONSE");
}

function RequestExperiments() {
  return RequestExpect("EXPERIMENTS_REQUEST", "EXPERIMENTS_RESPONSE");
}

function NotifyBookmarkAdd(url) {
  return Notify("NOTIFY_BOOKMARK_ADD", url);
}

function NotifyBookmarkDelete(bookmarkGuid) {
  return Notify("NOTIFY_BOOKMARK_DELETE", bookmarkGuid);
}

function NotifyHistoryDelete(data) {
  if (confirm("Are you sure you want to delete this from your entire history? This action cannot be undone.")) {
    return Notify("NOTIFY_HISTORY_DELETE", data);
  } else {
    return {type: "NOTIFY_HISTORY_DELETE_CANCELLED"};
  }
}

function NotifyBlockURL(url) {
  return Notify("NOTIFY_BLOCK_URL", url);
}

function NotifyUnblockURL(url) {
  return Notify("NOTIFY_UNBLOCK_URL", url);
}

function NotifyUnblockAll() {
  return Notify("NOTIFY_UNBLOCK_ALL");
}

function NotifyPerformSearch(data) {
  return Notify("NOTIFY_PERFORM_SEARCH", data);
}

function NotifyRouteChange(data) {
  return Notify("NOTIFY_ROUTE_CHANGE", data);
}

function NotifyPerf(data) {
  return Notify("NOTIFY_PERFORMANCE", data);
}

function NotifyEvent(data) {
  if (!eventConstants.pages.has(data.page)) {
    throw new Error(`${data.page} is not a valid page`);
  }
  if (!eventConstants.events.has(data.event)) {
    throw new Error(`${data.event} is not a valid event type`);
  }
  if (data.source && !eventConstants.sources.has(data.source)) {
    throw new Error(`${data.source} is not a valid source`);
  }
  return Notify("NOTIFY_USER_EVENT", data);
}

function NotifyOpenWindow(data) {
  return Notify("NOTIFY_OPEN_WINDOW", data);
}

am.defineActions({
  Notify,
  Response,
  RequestExpect,
  RequestTopFrecent,
  RequestBookmarks,
  RequestMoreBookmarks,
  RequestRecentLinks,
  RequestMoreRecentLinks,
  RequestHighlightsLinks,
  RequestSearchState,
  RequestExperiments,
  NotifyBlockURL,
  NotifyUnblockURL,
  NotifyUnblockAll,
  NotifyBookmarkAdd,
  NotifyBookmarkDelete,
  NotifyHistoryDelete,
  NotifyPerformSearch,
  NotifyRouteChange,
  NotifyPerf,
  NotifyEvent,
  NotifyOpenWindow
});

module.exports = am;

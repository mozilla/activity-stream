// This has to be relative so the firefox add-on side can read the path
const ActionManager = require("./ActionManager");
const eventConstants = require("./event-constants");

const am = new ActionManager([
  "APP_INIT",
  "APP_UNLOAD",
  "EXPERIMENTS_RESPONSE",
  "HIGHLIGHTS_AWAITING_METADATA",
  "HIGHLIGHTS_LINKS_REQUEST",
  "HIGHLIGHTS_LINKS_RESPONSE",
  "HIGHLIGHTS_REQUEST",
  "HIGHLIGHTS_RESPONSE",
  "LOCALE_UPDATED",
  "MANY_LINKS_CHANGED",
  "MERGE_STORE",
  "METADATA_FEED_UPDATED",
  "NOTIFY_BLOCK_URL",
  "NOTIFY_BOOKMARK_ADD",
  "NOTIFY_BOOKMARK_DELETE",
  "NOTIFY_COPY_URL",
  "NOTIFY_EMAIL_URL",
  "NOTIFY_FILTER_QUERY",
  "NOTIFY_HISTORY_DELETE_CANCELLED",
  "NOTIFY_HISTORY_DELETE",
  "NOTIFY_MANAGE_ENGINES",
  "NOTIFY_OPEN_WINDOW",
  "NOTIFY_PERFORM_SEARCH",
  "NOTIFY_PERFORMANCE",
  "NOTIFY_REMOVE_FORM_HISTORY_ENTRY",
  "NOTIFY_ROUTE_CHANGE",
  "NOTIFY_SHARE_URL",
  "NOTIFY_UNBLOCK_URL",
  "NOTIFY_UNDESIRED_EVENT",
  "NOTIFY_UPDATE_SEARCH_STRING",
  "NOTIFY_USER_EVENT",
  "PLACES_STATS_UPDATED",
  "PREF_CHANGED_RESPONSE",
  "PREFS_RESPONSE",
  "RECEIVE_BOOKMARK_ADDED",
  "RECEIVE_BOOKMARK_REMOVED",
  "RECEIVE_PLACES_CHANGES",
  "RECENT_LINKS_REQUEST",
  "RECENT_LINKS_RESPONSE",
  "SEARCH_CYCLE_CURRENT_ENGINE_REQUEST",
  "SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE",
  "SEARCH_ENGINES_CHANGED",
  "SEARCH_STATE_UPDATED",
  "SEARCH_SUGGESTIONS_REQUEST",
  "SEARCH_SUGGESTIONS_RESPONSE",
  "SHARE_PROVIDERS_REQUEST",
  "SHARE_PROVIDERS_RESPONSE",
  "SYNC_COMPLETE",
  "TOP_FRECENT_SITES_REQUEST",
  "TOP_FRECENT_SITES_RESPONSE"
]);

// This is a a set of actions that have sites in them,
// so we can do stuff like filter them, add metadata, etc.
am.ACTIONS_WITH_SITES = new Set([
  "HIGHLIGHTS_LINKS_RESPONSE",
  "RECENT_LINKS_RESPONSE",
  "TOP_FRECENT_SITES_RESPONSE"
].map(type => am.type(type)));

/**
 * Notify - Notify add-on action
 *
 * @param  {string} type  name of the action
 * @param  {obj} data    (optional) data associated with the action
 * @param  {obj} meta    (optional) options to be included in the meta part of the action.
 *               meta.skipMasterStore - Does not dispatch to the master store
 * @return {obj} action   The final action as a plain object
 */
function Notify(type, data, meta) {
  const action = {
    type,
    meta: {broadcast: eventConstants.CONTENT_TO_ADDON}
  };
  if (data) {
    action.data = data;
  }
  if (meta) {
    action.meta = Object.assign(action.meta, meta);
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
  if (options.meta) {
    action.meta = Object.assign({}, options.meta, action.meta);
  }
  return action;
}

function RequestHighlightsLinks() {
  return RequestExpect("HIGHLIGHTS_LINKS_REQUEST", "HIGHLIGHTS_LINKS_RESPONSE");
}

function RequestSearchSuggestions(data) {
  return RequestExpect("SEARCH_SUGGESTIONS_REQUEST", "SEARCH_SUGGESTIONS_RESPONSE", {data});
}

function NotifyRemoveFormHistory(data) {
  return Notify("NOTIFY_REMOVE_FORM_HISTORY_ENTRY", data);
}

function NotifyCycleEngine(data) {
  return Notify("SEARCH_CYCLE_CURRENT_ENGINE_REQUEST", data);
}

function NotifyManageEngines() {
  return Notify("NOTIFY_MANAGE_ENGINES");
}

function NotifyUpdateSearchString(searchString) {
  return Notify("NOTIFY_UPDATE_SEARCH_STRING", {searchString}, {skipMasterStore: true});
}

function NotifyBookmarkAdd(url) {
  return Notify("NOTIFY_BOOKMARK_ADD", url);
}

function NotifyBookmarkDelete(bookmarkGuid) {
  return Notify("NOTIFY_BOOKMARK_DELETE", bookmarkGuid);
}

function NotifyHistoryDelete(data) {
  if (confirm("Are you sure you want to delete this from your entire history? This action cannot be undone.")) { // eslint-disable-line no-alert
    return Notify("NOTIFY_HISTORY_DELETE", data);
  }
  return {type: "NOTIFY_HISTORY_DELETE_CANCELLED"};
}

function NotifyBlockURL(url) {
  return Notify("NOTIFY_BLOCK_URL", url);
}

function NotifyUnblockURL(url) {
  return Notify("NOTIFY_UNBLOCK_URL", url);
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
  if (!eventConstants.defaultPage === data.page) {
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

function NotifyUndesiredEvent(data) {
  if (!eventConstants.defaultPage === data.page) {
    throw new Error(`${data.page} is not a valid page`);
  }
  if (!eventConstants.undesiredEvents.has(data.event)) {
    throw new Error(`${data.event} is not a valid event type`);
  }
  return Notify("NOTIFY_UNDESIRED_EVENT", data);
}

function NotifyFilterQuery(data) {
  return Notify("NOTIFY_FILTER_QUERY", data);
}

function NotifyOpenWindow(data) {
  return Notify("NOTIFY_OPEN_WINDOW", data);
}

function RequestShareProviders() {
  return RequestExpect("SHARE_PROVIDERS_REQUEST", "SHARE_PROVIDERS_RESPONSE");
}

function NotifyCopyUrl(url) {
  return Notify("NOTIFY_COPY_URL", {url});
}

function NotifyEmailUrl(url, title) {
  return Notify("NOTIFY_EMAIL_URL", {url, title});
}

function NotifyShareUrl(url, title, provider) {
  return Notify("NOTIFY_SHARE_URL", {url, title, provider});
}

function PlacesStatsUpdate(historySize, bookmarksSize) {
  const data = {};
  if (typeof historySize !== "undefined") {
    data.historySize = historySize;
  }
  if (typeof bookmarksSize !== "undefined") {
    data.bookmarksSize = bookmarksSize;
  }
  return {type: "PLACES_STATS_UPDATED", data};
}

am.defineActions({
  Notify,
  NotifyBlockURL,
  NotifyBookmarkAdd,
  NotifyBookmarkDelete,
  NotifyCopyUrl,
  NotifyCycleEngine,
  NotifyEmailUrl,
  NotifyEvent,
  NotifyFilterQuery,
  NotifyHistoryDelete,
  NotifyManageEngines,
  NotifyOpenWindow,
  NotifyPerf,
  NotifyPerformSearch,
  NotifyRemoveFormHistory,
  NotifyRouteChange,
  NotifyShareUrl,
  NotifyUnblockURL,
  NotifyUndesiredEvent,
  NotifyUpdateSearchString,
  PlacesStatsUpdate,
  RequestExpect,
  RequestHighlightsLinks,
  RequestSearchSuggestions,
  RequestShareProviders,
  Response
});

module.exports = am;

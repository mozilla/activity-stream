/* globals Services, Locale */

const tabs = require("sdk/tabs");
const {Cu} = require("chrome");
const self = require("sdk/self");
const simplePrefs = require("sdk/simple-prefs");
const eventConstants = require("../common/event-constants");

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Locale.jsm");

const TELEMETRY_PREF = "telemetry";
const COMPLETE_NOTIF = "tab-session-complete";
const ACTION_NOTIF = "user-action-event";
const PERF_LOG_COMPLETE_NOTIF = "performance-log-complete";

function TabTracker(trackableURLs, clientID, placesQueries) {
  this._tabData = {};

  this._clientID = clientID;
  this._trackableURLs = trackableURLs;
  this._placesQueries = placesQueries;
  this.onOpen = this.onOpen.bind(this);
  this.onPerfLoadComplete = this.onPerfLoadComplete.bind(this);

  this._onPrefChange = this._onPrefChange.bind(this);
  this.enabled = simplePrefs.prefs[TELEMETRY_PREF];
  if (this.enabled) {
    this._addListeners();
  }
  simplePrefs.on(TELEMETRY_PREF, this._onPrefChange);
}

TabTracker.prototype = {
  _openTabs: {},

  get tabData() {
    return this._tabData;
  },

  _addListeners() {
    tabs.on("open", this.onOpen);
    Services.obs.addObserver(this.onPerfLoadComplete, PERF_LOG_COMPLETE_NOTIF);
  },

  _removeListeners() {
    for (let id in this._openTabs) {
      let tab = this._openTabs[id].tab;
      tab.removeListener("ready", this.logReady);
      tab.removeListener("activate", this.logActivate);
      tab.removeListener("deactivate", this.logDeactivate);
      tab.removeListener("close", this.logClose);
    }
    tabs.removeListener("open", this.onOpen);

    if (this.enabled) {
      Services.obs.removeObserver(this.onPerfLoadComplete, PERF_LOG_COMPLETE_NOTIF);
    }
  },

  _clearTabData() {
    // keep history and bookmarks sizes of the current tabData
    let {total_history_size, total_bookmarks} = this._tabData;
    this._tabData = {
      total_history_size,
      total_bookmarks
    };
  },

  _resolvePageType(tabUrl) {
    let page = eventConstants.defaultPage;
    eventConstants.urlPatternToPageMap.forEach((value, pattern) => {
      if (pattern.test(tabUrl)) {
        page = value;
      }
    });
    return page;
  },

  _setCommonProperties(payload, url) {
    payload.client_id = this._clientID;
    payload.addon_version = self.version;
    payload.locale = Locale.getLocale();
    payload.page = this._resolvePageType(url);
  },

  uninit() {
    this._removeListeners();
    if (this.enabled) {
      simplePrefs.removeListener(TELEMETRY_PREF, this._onPrefChange);
      this.enabled = false;
    }
  },

  isActivityStreamsURL(URL) {
    return this._trackableURLs.indexOf(URL) !== -1;
  },

  handleUserEvent(payload) {
    payload.action = "activity_stream_event";
    payload.tab_id = tabs.activeTab.id;
    this._setCommonProperties(payload, tabs.activeTab.url);
    Services.obs.notifyObservers(null, ACTION_NOTIF, JSON.stringify(payload));
  },

  handleRouteChange(tab, route) {
    if (!route.isFirstLoad) {
      this.navigateAwayFromPage(tab, "route_change");
      this.logReady(tab);
    }
  },

  navigateAwayFromPage(tab, reason) {
    // we can't use tab.url, because it's pointing to a new url of the page
    // we have to use the URL stored in this._openTabs object
    this._setCommonProperties(this._tabData, this._openTabs[tab.id].url);
    this._tabData.action = "activity_stream_session";
    this._tabData.unload_reason = reason;

    if (!this._tabData.tab_id) {
      // We're navigating away from an activity streams page that
      // didn't even load yet. Let's say it's been active for 0 seconds.
      this._tabData.url = tab.url;
      this._tabData.tab_id = tab.id;
      this._tabData.load_reason = this._tabData.load_reason || "none"; // Page didn't load at all.
      this._tabData.session_duration = 0;
      delete this._tabData.start_time;
      Services.obs.notifyObservers(null, COMPLETE_NOTIF, JSON.stringify(this._tabData));
      this._clearTabData();
      return;
    }
    if (this._tabData.start_time) {
      this._tabData.session_duration = (Date.now() - this._tabData.start_time);
      delete this._tabData.start_time;
    }
    delete this._tabData.active;
    Services.obs.notifyObservers(null, COMPLETE_NOTIF, JSON.stringify(this._tabData));
    this._clearTabData();
  },

  logReady(tab) {
    // If an inactive tab is done loading, we don't care. It's session would have
    // already ended, likely with an 'unfocus' unload reason.
    if (this.isActivityStreamsURL(tab.url) && tabs.activeTab.id === tab.id) {
      if (!this._tabData.url) {
        this._tabData.url = tab.url;
        this._tabData.tab_id = tab.id;
        this._tabData.load_reason = "newtab";
      } else if (!this._tabData.session_duration) {
        // The page content has been reloaded but a total time wasn't set.
        // This is due to a page refresh. Let's set the total time now.
        this.navigateAwayFromPage(tab, "refresh");
        this._tabData.load_reason = "refresh";
      }
      this.logActivate(tab);
      return;
    }
    // We loaded a URL other than activity streams. If URL is loaded into the
    // same tab (tab_id must match) and the previous URL is activity streams URL,
    // then we are replacing the activity streams tab and we must update its state.
    if (this._tabData.tab_id === tab.id &&
        this._openTabs[tab.id] &&
        this.isActivityStreamsURL(this._openTabs[tab.id].url)) {
      this.navigateAwayFromPage(tab, "navigation");
    }
  },

  logActivate(tab) {
    if (this.isActivityStreamsURL(tab.url)) {
      // note that logActivate may be called from logReady handler when page loads
      // but also from "activate" event, when the tab gains focus, in which case
      // we need to restore tab_id and url, because they could have been errased
      // by a call navigateAwayFromPage() caused by another tab
      this._tabData.load_reason = this._tabData.load_reason || "focus";
      this._tabData.start_time = Date.now();
      this._tabData.tab_id = tab.id;
      this._tabData.url = tab.url;
      // URL stored in this._openTabs object keeps the previous URL after the tab.url
      // is replaced with a different page URL, as in click action of page reload
      this._openTabs[tab.id].url = tab.url;
      this._openTabs[tab.id].active = true;
    }
  },

  logDeactivate(tab) {
    // If there is no activeTab, that means we closed the whole window
    // we already log "close", so no need to log deactivate as well.
    if (!tabs.activeTab) {
      return;
    }
    if (this.isActivityStreamsURL(tab.url)) {
      this.navigateAwayFromPage(tab, "unfocus");
      this._openTabs[tab.id].active = false;
    }
  },

  logClose(tab) {
    if (this.isActivityStreamsURL(tab.url)) {
      // check whether this tab is inactive or not, don't send the close ping
      // if it's inactive as an "unfocus" one has already been sent by logDeactivate.
      // Note that the test !tabs.activeTab won't work here when the user closes
      // the window
      if (!this._openTabs[tab.id].active) {
        return;
      }
      this.navigateAwayFromPage(tab, "close");
    }
    // get rid of that tab reference
    delete this._openTabs[tab.id];
  },

  onOpen(tab) {
    this._openTabs[tab.id] = {tab: tab, url: tab.url, active: true};

    this.logReady = this.logReady.bind(this);
    this.logActivate = this.logActivate.bind(this);
    this.logDeactivate = this.logDeactivate.bind(this);
    this.logClose = this.logClose.bind(this);

    tab.on("ready", this.logReady);
    tab.on("activate", this.logActivate);
    tab.on("deactivate", this.logDeactivate);
    tab.on("close", this.logClose);

    // update history and bookmark sizes
    this._placesQueries.getHistorySize().then(size => {this._tabData.total_history_size = size;});
    this._placesQueries.getBookmarksSize().then(size => {this._tabData.total_bookmarks = size;});
  },

  _onPrefChange() {
    let newValue = simplePrefs.prefs.telemetry;
    if (!this.enabled && newValue) {
      this._addListeners();
    } else if (this.enabled && !newValue) {
      this._removeListeners();
    }
    this.enabled = newValue;
  },

  onPerfLoadComplete: function(subject, topic, data) {
    let eventData = JSON.parse(data);
    if (eventData.tabId === this._tabData.tab_id) {
      this._tabData.load_latency = eventData.events[eventData.events.length - 1].start;
    }
  },
};

exports.TabTracker = TabTracker;

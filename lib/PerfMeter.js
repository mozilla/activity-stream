/* globals Services */
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

const tabs = require("sdk/tabs");
const simplePrefs = require("sdk/simple-prefs");

const VALID_TELEMETRY_TAGS = new Set([
  "TAB_READY",
  "WORKER_ATTACHED",
  "TOP_FRECENT_SITES_REQUEST",
  "TOP_FRECENT_SITES_RESPONSE",
  "RECENT_BOOKMARKS_REQUEST",
  "RECENT_BOOKMARKS_RESPONSE",
  "RECENT_LINKS_REQUEST",
  "RECENT_LINKS_RESPONSE",
  "FRECENT_LINKS_REQUEST",
  "FRECENT_LINKS_RESPONSE",
  "SEARCH_STATE_REQUEST",
  "SEARCH_STATE_RESPONSE",
  "NOTIFY_PERFORMANCE",
]);

function PerfMeter(trackableURLs) {
  this._trackableURLs = trackableURLs;
  this._tabs = {};
  this.onOpen = this.onOpen.bind(this);
  this.onReady = this.onReady.bind(this);
  this.onClose = this.onClose.bind(this);
  this.onPrefChange = this.onPrefChange.bind(this);
  tabs.on("open", this.onOpen);
  simplePrefs.on("performance.log", this.onPrefChange);
  this._active = simplePrefs.prefs["performance.log"];
}

PerfMeter.prototype = {

  get events() {
    return this._tabs;
  },

  uninit() {
    tabs.removeListener("open", this.onOpen);
    simplePrefs.removeListener("performance.log", this.onPrefChange);
    this.clearTabs();
  },

  clearTabs() {
    // remove tab listeners
    for (let id of Object.keys(this._tabs)) {
      this._tabs[id].tab.removeListener("ready", this.onReady);
      this._tabs[id].tab.removeListener("close", this.onClose);
    }
    this._tabs = {};
  },

  onPrefChange() {
    this._active = simplePrefs.prefs["performance.log"];
    Services.obs.notifyObservers(null, "performance-pref-changed", null);
  },

  isActivityStreamsURL(URL) {
    return this._trackableURLs.indexOf(URL) !== -1;
  },

  onReady(tab) {
    if (this.isActivityStreamsURL(tab.url)) {
      this.log(tab, "TAB_READY");
    } else {
      // not an activity stream tab, get rid of it
      delete this._tabs[tab.id];
    }
    tab.removeListener("ready", this.onReady);
  },

  onClose(tab) {
    delete this._tabs[tab.id];
  },

  onOpen(tab) {
    let item = {tag: "TAB_OPEN", start: 0};
    this._tabs[tab.id] = {
      tab: tab,
      openAt: Date.now(),
      events: [item],
      requests: new Map(),
      workerWasAttached: false,
    };
    tab.on("ready", this.onReady);
    tab.on("close", this.onClose);
    this.displayItem(tab.id, item);
  },

  log(tab, tag, data) {
    if (this.isActivityStreamsURL(tab.url) && VALID_TELEMETRY_TAGS.has(tag)) {
      let tabData = this._tabs[tab.id];

      // when tab is reloaded, the worker will be re-attached to the tab and another
      // WORKER_ATTACHED event will be sent. In which case we re-initialize tabData
      if (tag == "WORKER_ATTACHED") {
        if (tabData.workerWasAttached) {
          // tab is reloaded - re-initialize it. Since reload does not generate TAB_OPEN
          // and TAB_READY events, we introduce articficial ones starting at 0
          tabData.events = [
            {tag: "TAB_RELOAD", start: 0},
            {tag: "TAB_READY", start: 0},
          ];
          tabData.requests = new Map();
          tabData.openAt = Date.now();
        }
        tabData.workerWasAttached = true;
      }

      let item = {
        tag: tag,
        start: Date.now() - tabData.openAt,
        data: data,
      };

      // handle requests/response pairs
      if (tag.endsWith("_REQUEST")) {
        tabData.requests.set(tag, item.start);
      } else if (tag.endsWith("_RESPONSE")) {
        let request = tag.replace("_RESPONSE", "_REQUEST");
        item.delta = item.start - tabData.requests.get(request);
      }

      tabData.events.push(item);

      // display the event onto console
      this.displayItem(tab.id, item);

      // check for last event
      if (data === "NEWTAB_RENDER") {
        Services.obs.notifyObservers(null, "performance-log-complete", JSON.stringify({tabId: tab.id, events: tabData.events}));
      }
    }
  },

  displayItem(tabId, item) {
    if (this._active) {
      console.info(`${tabId} ${item.start} ${item.tag}${item.data ? ":" + item.data : ""} ${item.delta || ""}`);
    }
  },
};

exports.PerfMeter = PerfMeter;

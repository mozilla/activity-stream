/* globals Services */
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

const tabs = require("sdk/tabs");
const simplePrefs = require("sdk/simple-prefs");

const {absPerf} = require("common/AbsPerf");
const {WORKER_ATTACHED_EVENT} = require("common/constants");

const VALID_TELEMETRY_TAGS = new Set([
  "TAB_READY",
  "NOTIFY_PERFORMANCE",
  WORKER_ATTACHED_EVENT
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
  this._stats = {
    sum: 0,
    squareSum: 0,
    samples: []
  };
}

PerfMeter.prototype = {

  get events() {
    return this._tabs;
  },

  _addSampleValue(value) {
    this._stats.sum += value;
    this._stats.squareSum += value * value;
    this._stats.samples.push(value);
  },

  _isLoadCompleteEvent(item) {
    return !!(item.data && item.data === "NEWTAB_RENDER");
  },

  _twoDigitsRound(number) {
    return Math.round(number * 100) / 100;
  },

  _computeStats() {
    let total = this._stats.samples.length;
    // deal with median first
    let sorted = this._stats.samples.sort((a, b) => a - b);
    let median;
    let index = Math.floor(total / 2);
    // if there's odd number of samples, take a middle one
    if (total % 2 === 1) {
      median = sorted[index];
    } else {
      // otherwise take a middle point between middle points
      median = (sorted[index - 1] + sorted[index]) / 2;
    }

    let mean = this._stats.sum / total;
    let variance = (this._stats.squareSum / total) - mean * mean;

    return {
      total,
      mean: this._twoDigitsRound(mean),
      std: this._twoDigitsRound(Math.sqrt(variance)),
      median
    };
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
  },

  isActivityStreamsURL(URL) {
    return this._trackableURLs.includes(URL);
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
    // Removes the listener for ready, just in case "ready" never fired.
    tab.removeListener("ready", this.onReady);
    delete this._tabs[tab.id];
  },

  onOpen(tab) {
    let item = {tag: "TAB_OPEN", start: 0};
    this._tabs[tab.id] = {
      tab,
      openAt: absPerf.now(),
      events: [item],
      requests: new Map(),
      workerWasAttached: false
    };
    tab.on("ready", this.onReady);
    tab.on("close", this.onClose);
    this.displayItem(tab.id, item);
  },

  log(tab, tag, data) {
    if (this.isActivityStreamsURL(tab.url) && VALID_TELEMETRY_TAGS.has(tag)) {
      let tabData = this._tabs[tab.id];

      if (!tabData) {
        // If the tab was restored, onOpen was never called.
        this.onOpen(tab);
        tabData = this._tabs[tab.id];
      }

      // when tab is reloaded, the worker will be re-attached to the tab and another
      // WORKER_ATTACHED event will be sent. In which case we re-initialize tabData
      if (tag === WORKER_ATTACHED_EVENT) {
        if (tabData.workerWasAttached) {
          // tab is reloaded - re-initialize it. Since reload does not generate TAB_OPEN
          // and TAB_READY events, we introduce articficial ones starting at 0
          tabData.events = [
            {tag: "TAB_RELOAD", start: 0},
            {tag: "TAB_READY", start: 0}
          ];
          tabData.requests = new Map();
          tabData.openAt = absPerf.now();
        }
        tabData.workerWasAttached = true;
      }

      let item = {
        tag,
        start: absPerf.now() - tabData.openAt,
        data
      };

      // handle requests/response pairs
      if (tag.endsWith("_REQUEST")) {
        tabData.requests.set(tag, item.start);
      } else if (tag.endsWith("_RESPONSE")) {
        let request = tag.replace("_RESPONSE", "_REQUEST");
        item.delta = item.start - tabData.requests.get(request);
      }

      tabData.events.push(item);

      // check for last event
      if (this._isLoadCompleteEvent(item)) {
        Services.obs.notifyObservers(null, "performance-log-complete", JSON.stringify({tabId: tab.id, events: tabData.events}));
        this._addSampleValue(item.start);
      }

      // display the event onto console
      this.displayItem(tab.id, item);
    }
  },

  displayItem(tabId, item) {
    if (this._active) {
      console.info(`${tabId} ${item.start} ${item.tag}${item.data ? `:${item.data}` : ""} ${item.delta || ""}`); // eslint-disable-line no-console
      if (this._isLoadCompleteEvent(item)) {
        let {total, mean, std, median} = this._computeStats();
        console.info(`SIZE=${total} MEAN=${mean} STD=${std} MEDIAN=${median}`); // eslint-disable-line no-console
      }
    }
  }
};

exports.PerfMeter = PerfMeter;

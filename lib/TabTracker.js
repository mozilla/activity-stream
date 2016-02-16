const tabs = require("sdk/tabs");
const ss = require("sdk/simple-storage");

function TabTracker(trackableURLs) {
  if (!ss.storage.tabData) {
    ss.storage.tabData = {};
  }
  for (let trackableURL of trackableURLs) {
    if (!ss.storage.tabData[trackableURL]) {
      ss.storage.tabData[trackableURL] = {};
    }
  }
  this._trackableURLs = trackableURLs;
  this.onOpen = this.onOpen.bind(this);
  tabs.on("open", this.onOpen);
}

TabTracker.prototype = {
  _openTabs: [],

  uninit: function() {
    for (let tab of this._openTabs) {
      tab.removeListener("ready", this.logReady);
      tab.removeListener("activate", this.logActivate);
      tab.removeListener("deactivate", this.logDeactivate);
      tab.removeListener("close", this.logDeactivate);
    }
    tabs.removeListener("open", this.onOpen);
  },

  isActivityStreamsURL: function(URL) {
    return this._trackableURLs.indexOf(URL) !== -1;
  },

  getLastActivation: function(tab) {
    if (!ss.storage.tabData[tab.url] || !ss.storage.tabData[tab.url][tab.id]) {
      return null;
    }
    let activations = ss.storage.tabData[tab.url][tab.id].activations;
    return activations[activations.length - 1];
  },

  navigateAwayFromPage: function(tab) {
    if (!ss.storage.tabData[tab.url][tab.id]) {
      // We're navigating away from an activity streams page that
      // didn't even load yet. Let's say it's been active for 0 seconds.
      ss.storage.tabData[tab.url][tab.id] = {activations: [{startTime: Date.now(), totalTime: 0}]};
      return;
    }
    let lastElement = this.getLastActivation(tab);
    if (lastElement && lastElement.startTime) {
      lastElement.totalTime = (Date.now() - lastElement.startTime) / 1000;
    }
  },

  logReady: function(tab) {
    if (this.isActivityStreamsURL(tab.url)) {
      if (!ss.storage.tabData[tab.url][tab.id]) {
        ss.storage.tabData[tab.url][tab.id] = {activations: []};
      } else if (!this.getLastActivation(tab).totalTime) {
        // The page content has been reloaded but a total time wasn't set.
        // This is due to a page refresh. Let's set the total time now.
        this.navigateAwayFromPage(tab);
      }
      this.logActivate(tab);
      return;
    }
    // We loaded a URL other than activity streams. If the last open URL
    // in this tab was activity streams (totalTime hasn't been set yet),
    // then update its state.
    let lastElement = this.getLastActivation(tab);
    if (lastElement && !lastElement.totalTime) {
      this.navigateAwayFromPage(tab);
    }
  },

  logActivate: function(tab) {
    if (this.isActivityStreamsURL(tab.url)) {
      ss.storage.tabData[tab.url][tab.id].activations.push({startTime: Date.now()});
    }
  },

  logDeactivate: function(tab) {
    if (this.isActivityStreamsURL(tab.url)) {
      this.navigateAwayFromPage(tab);
    }
  },

  onOpen: function(tab) {
    this._openTabs.push(tab);

    this.logReady = this.logReady.bind(this);
    this.logActivate = this.logActivate.bind(this);
    this.logDeactivate = this.logDeactivate.bind(this);

    tab.on("ready", this.logReady);
    tab.on("activate", this.logActivate);
    tab.on("deactivate", this.logDeactivate);
    tab.on("close", this.logDeactivate);
  },
};

exports.TabTracker = TabTracker;

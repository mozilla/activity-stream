/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;

// NB: Eagerly load modules that will be loaded/constructed/initialized in the
// common case to avoid the overhead of wrapping and detecting lazy loading.
const {actionTypes: at} = Cu.import("resource://activity-stream/common/Actions.jsm", {});
const {DefaultPrefs} = Cu.import("resource://activity-stream/lib/ActivityStreamPrefs.jsm", {});
const {LocalizationFeed} = Cu.import("resource://activity-stream/lib/LocalizationFeed.jsm", {});
const {NewTabInit} = Cu.import("resource://activity-stream/lib/NewTabInit.jsm", {});
const {PlacesFeed} = Cu.import("resource://activity-stream/lib/PlacesFeed.jsm", {});
const {PrefsFeed} = Cu.import("resource://activity-stream/lib/PrefsFeed.jsm", {});
const {Store} = Cu.import("resource://activity-stream/lib/Store.jsm", {});
const {TelemetryFeed} = Cu.import("resource://activity-stream/lib/TelemetryFeed.jsm", {});
const {TopSitesFeed} = Cu.import("resource://activity-stream/lib/TopSitesFeed.jsm", {});

const REASON_ADDON_UNINSTALL = 6;

const PREFS_CONFIG = [
  {
    name: "default.sites",
    title: "Comma-separated list of default top sites to fill in behind visited sites",
    value: "https://www.facebook.com/,https://www.youtube.com/,https://www.amazon.com/,https://www.yahoo.com/,https://www.ebay.com/,https://twitter.com/"
  },
  // When you add a feed pref here:
  // 1. The pref should be prefixed with "feeds."
  // 2. The init property should be a function that instantiates your Feed
  {
    name: "feeds.localization",
    title: "Initialize strings and detect locale for Activity Stream",
    value: true,
    init: () => new LocalizationFeed()
  },
  {
    name: "feeds.newtabinit",
    title: "Sends a copy of the state to each new tab that is opened",
    value: true,
    init: () => new NewTabInit()
  },
  {
    name: "feeds.places",
    title: "Listens for and relays various Places-related events",
    value: true,
    init: () => new PlacesFeed()
  },
  {
    name: "feeds.prefs",
    title: "Preferences",
    value: true,
    init: () => new PrefsFeed(PREFS_CONFIG.map(pref => pref.name))
  },
  {
    name: "feeds.telemetry",
    title: "Relays telemetry-related actions to TelemetrySender",
    value: true,
    init: () => new TelemetryFeed()
  },
  {
    name: "feeds.topsites",
    title: "Queries places and gets metadata for Top Sites section",
    value: true,
    init: () => new TopSitesFeed()
  },
  {
    name: "showSearch",
    title: "Show the Search bar on the New Tab page",
    value: true
  },
  {
    name: "showTopSites",
    title: "Show the Top Sites section on the New Tab page",
    value: true
  },
  {
    name: "telemetry",
    title: "Enable system error and usage data collection",
    value: false
  },
  {
    name: "telemetry.log",
    title: "Log telemetry events in the console",
    value: false
  },
  {
    name: "telemetry.ping.endpoint",
    title: "Telemetry server endpoint",
    value: "https://tiles.services.mozilla.com/v3/links/activity-stream"
  }
];

const feeds = {};
for (const pref of PREFS_CONFIG) {
  if (pref.name.startsWith("feeds.")) {
    feeds[pref.name] = pref.init;
  }
}

this.ActivityStream = class ActivityStream {

  /**
   * constructor - Initializes an instance of ActivityStream
   *
   * @param  {object} options Options for the ActivityStream instance
   * @param  {string} options.id Add-on ID. e.g. "activity-stream@mozilla.org".
   * @param  {string} options.version Version of the add-on. e.g. "0.1.0"
   * @param  {string} options.newTabURL URL of New Tab page on which A.S. is displayed. e.g. "about:newtab"
   */
  constructor(options = {}) {
    this.initialized = false;
    this.options = options;
    this.store = new Store();
    this.feeds = feeds;
    this._defaultPrefs = new DefaultPrefs(PREFS_CONFIG);
  }
  init() {
    this.initialized = true;
    this._defaultPrefs.init();
    this.store.init(this.feeds);
    this.store.dispatch({
      type: at.INIT,
      data: {version: this.options.version}
    });
  }
  uninit() {
    this.store.dispatch({type: at.UNINIT});
    this.store.uninit();

    this.initialized = false;
  }
  uninstall(reason) {
    if (reason === REASON_ADDON_UNINSTALL) {
      // This resets all prefs in the config to their default values,
      // so we DON'T want to do this on an upgrade/downgrade, only on a
      // real uninstall
      this._defaultPrefs.reset();
    }
  }
};

this.PREFS_CONFIG = PREFS_CONFIG;
this.EXPORTED_SYMBOLS = ["ActivityStream"];

/* globals require, exports, Locale, Task, ClientID */
"use strict";
const {Cu} = require("chrome");
const {PlacesProvider} = require("addon/PlacesProvider");
const {MetadataStore, METASTORE_NAME} = require("addon/MetadataStore");
const {TelemetrySender} = require("addon/TelemetrySender");
const {TabTracker} = require("addon/TabTracker");
const {ActivityStreams} = require("addon/ActivityStreams");
const {setTimeout, clearTimeout} = require("sdk/timers");
const prefs = require("sdk/preferences/service");
const {getAddonByID} = require("sdk/addon/manager");
const {PageMod} = require("sdk/page-mod");

Cu.import("resource://gre/modules/ClientID.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/Locale.jsm");

const {OS} = Cu.import("resource://gre/modules/osfile.jsm", {});

// The constant to set the limit of MetadataStore reconnection
// The addon will try reconnecting to the database in the next minute periodically,
// if it fails to establish the connection in the addon initialization
const kMaxConnectRetry = 120;

function Feature() {}

Feature.prototype = {
  _options: {},
  _variant: null,
  _dlp: null,
  _tilesPageMod: null,
  _activityStreamApp: null,
  _metadataStore: null,
  _tabTracker: null,
  _telemetrySender: null,
  _connectRetried: 0,
  _reconnectTimeoutID: null,
  _initializedTiles: false,
  _doesHaveTestPilot: false,
  _eligibilityFilters: [],
  _placesQueries: null,
  _originalPreloadPref: null,

  setVariant(variant) {
    this._variant = `shield-study-01-${variant}`;
  },

  setUp: Task.async(function*() {
    this._originalPreloadPref = prefs.get("browser.newtab.preload");
    prefs.set("browser.newtab.preload", false);
    PlacesProvider.links.init();
    const clientID = yield ClientID.getClientID();
    this._options.clientID = clientID;
    this._options.shield_variant = this._variant;
    this._options.telemetry = false;
    this._options.tp_version = "1.1.7";
    this._tabTracker = new TabTracker(this._options);
    this._telemetrySender = new TelemetrySender();
  }),

  _setUpEligibilityFilters() {
    this._eligibilityFilters.push(Locale.getLocale() === "en-US");
    this._eligibilityFilters.push(prefs.get("browser.newtabpage.enabled") === true);
  },

  migrateMetadataStore: Task.async(function*() {
    const sourcePath = OS.Path.join(OS.Constants.Path.localProfileDir, METASTORE_NAME);
    const destPath = OS.Path.join(OS.Constants.Path.profileDir, METASTORE_NAME);

    const exists = yield OS.File.exists(sourcePath);
    if (exists) {
      try {
        yield OS.File.move(sourcePath, destPath);
      } catch (e) {
        Cu.reportError(`Failed to move metadata store: ${e.message}. Removing the database file`);
        yield OS.File.remove(sourcePath);
      }
    }
  }),

  reconnectMetadataStore() {
    if (this._connectRetried > kMaxConnectRetry) {
      throw new Error("Metadata store reconnecting has reached the maximum limit");
    }

    this._reconnectTimeoutID = setTimeout(() => {
      this._metadataStore.asyncConnect().then(() => {this._connectRetried = 0;})
        .catch(error => {
          // increment the connect counter to avoid the endless retry
          this._connectRetried++;
          this.reconnectMetadataStore();
          Cu.reportError(error);
        });
    }, 500);
  },

  loadActivityStream: Task.async(function*() {
    yield this.setUp();
    if (this._options.loadReason === "upgrade") {
      yield this.migrateMetadataStore();
    }
    this._metadataStore = new MetadataStore();
    try {
      yield this._metadataStore.asyncConnect();
    } catch (e) {
      this.reconnectMetadataStore();
    }
    this._activityStreamApp = new ActivityStreams(this._metadataStore, this._tabTracker, this._telemetrySender, this._options);
    // don't override the homepage to have activity stream
    this._activityStreamApp._setHomePage = () => {};
    try {
      this._activityStreamApp.init();
    } catch (e) {
      Cu.reportError(e);
    }
  }),

  loadTiles: Task.async(function*() {
    yield this.setUp();
    this.initializeNewTab();
    if (!this._placesQueries) {
      this._placesQueries = {
        getHistorySize() {return PlacesProvider.links.getHistorySize();},
        getBookmarksSize() {return PlacesProvider.links.getBookmarksSize();}
      };
    }
    this._tabTracker.init(["about:newtab"], this._placesQueries);
    this._initializedTiles = true;
  }),

  initializeNewTab() {
    let reportEvent = (event, data = {}) => {
      let payload = Object.assign({event}, data);
      this._tabTracker.handleUserEvent(payload);
    };

    // Instrument tile actions, e.g., click
    this._dlp = Cu.import("resource:///modules/DirectoryLinksProvider.jsm", {}).DirectoryLinksProvider;
    this._dlp._reportSitesAction = this._dlp.reportSitesAction;
    this._dlp.reportSitesAction = function(sites, action, action_position) {
      if (action.search(/^(click|block)$/) === 0) {
        reportEvent(action.toUpperCase(), {
          action_position,
          source: sites[action_position].link.type.toUpperCase()
        });
      }
      return this._reportSitesAction(sites, action, action_position);
    };

    // Instrument search actions
    this._tilesPageMod = new PageMod({
      attachTo: ["existing", "top"],
      contentScript: `addEventListener("ContentSearchClient", ({detail}) => {
        if (detail.type === "Search") self.port.emit("search", detail.data)
      });`,
      include: "about:newtab",
      onAttach(worker) {
        worker.port.on("search", () => reportEvent("SEARCH"));
      }
    });
  },

  isEligible() {
    this._setUpEligibilityFilters();
    return this._eligibilityFilters.every(item => item) && !this._doesHaveTestPilot;
  },

  doesHaveTestPilot() {
    const testPilotID = "@testpilot-addon";
    return getAddonByID(testPilotID).then(addon => {
      this._doesHaveTestPilot = !!addon;
    });
  },

  shutdown(reason, variant) {
    if (this._activityStreamApp && variant === "ActivityStream") {
      this._activityStreamApp.unload(reason);
      this._activityStreamApp = null;

      if (this._reconnectTimeoutID) {
        clearTimeout(this._reconnectTimeoutID);
        this._reconnectTimeoutID = null;
      }

      if (this._metadataStore) {
        if (reason === "uninstall" || reason === "disable") {
          this._metadataStore.asyncTearDown();
        } else {
          this._metadataStore.asyncClose();
        }
      }
      PlacesProvider.links.uninit();
      this._tabTracker = null;
      this._telemetrySender = null;
      prefs.set("browser.newtab.preload", this._originalPreloadPref);
    } else if (this._initializedTiles && variant === "Tiles") {
      this._dlp.reportSitesAction = this._dlp._reportSitesAction;
      this._tilesPageMod.destroy();
      this._tabTracker.uninit();
      this._telemetrySender.uninit();
      this._initializedTiles = false;
      PlacesProvider.links.uninit();
      this._tabTracker = null;
      this._telemetrySender = null;
      prefs.set("browser.newtab.preload", this._originalPreloadPref);
    }
  }
};

exports.Feature = Feature;

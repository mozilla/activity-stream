/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {ActivityStreamStorage} = ChromeUtils.import("resource://activity-stream/lib/ActivityStreamStorage.jsm", {});
const {actionCreators: ac, actionTypes: at} = ChromeUtils.import("resource://activity-stream/common/Actions.jsm", {});
const {Prefs} = ChromeUtils.import("resource://activity-stream/lib/ActivityStreamPrefs.jsm", {});
const {PrerenderData} = ChromeUtils.import("resource://activity-stream/common/PrerenderData.jsm", {});
const {INITIAL_STATE} = ChromeUtils.import("resource://activity-stream/common/Reducers.jsm", {});
ChromeUtils.import("resource://gre/modules/Services.jsm");

ChromeUtils.defineModuleGetter(this, "PrivateBrowsingUtils",
  "resource://gre/modules/PrivateBrowsingUtils.jsm");

const ONBOARDING_FINISHED_PREF = "browser.onboarding.notification.finished";
const TELEMETRY_PREF_BRANCH = "datareporting.healthreport.";
const TELEMETRY_PREF_NAME = "uploadEnabled";

// List of prefs that require migration to indexedDB.
// Object key is the name of the pref in indexedDB, each will contain a
// map (key: name of preference to migrate, value: name of component).
const PREF_MIGRATION = {
  collapsed: new Map([
    ["collapseTopSites", "topsites"],
    ["section.highlights.collapsed", "highlights"],
    ["section.topstories.collapsed", "topstories"]
  ])
};

this.PrefsFeed = class PrefsFeed {
  constructor(prefMap) {
    this._prefMap = prefMap;
    this._prefs = new Prefs();
    this._storage = new ActivityStreamStorage("sectionPrefs");
    this._dataReportingBranch = Services.prefs.getBranch(TELEMETRY_PREF_BRANCH);
  }

  // If any prefs or the theme are set to something other than what the
  // prerendered version of AS expects, we can't use it.
  async _setPrerenderPref(theme) {
    const indexedDBPrefs = await this._storage.getAll();
    const prefsAreValid = PrerenderData.arePrefsValid(pref => this._prefs.get(pref), indexedDBPrefs);
    const themeIsDefault = (theme || this.store.getState().Theme).className === INITIAL_STATE.Theme.className;
    this._prefs.set("prerender", prefsAreValid && themeIsDefault);
  }

  _checkPrerender(name) {
    if (PrerenderData.invalidatingPrefs.includes(name)) {
      this._setPrerenderPref();
    }
  }

  _initOnboardingPref() {
    const snippetsEnabled = this._prefs.get("feeds.snippets");
    if (!snippetsEnabled) {
      this.setOnboardingDisabledDefault(true);
    }
  }

  setOnboardingDisabledDefault(value) {
    const branch = Services.prefs.getDefaultBranch("");
    branch.setBoolPref(ONBOARDING_FINISHED_PREF, value);
  }

  /**
   * nsIObserver.observe, used as a callback mechanism for seeing when
   * the global data reporting pref has changed.
   */
  observe(subject, topic, data) {
    if (subject !== this._dataReportingBranch || topic !== "nsPref:changed" ||
      data !== TELEMETRY_PREF_NAME) {
      return;
    }

    let newValue = subject.getBoolPref(data);
    this.store.dispatch(ac.BroadcastToContent({
      type: at.PREF_CHANGED,
      data: {name: "dataReportingUploadEnabled", value: newValue}
    }));
  }

  onPrefChanged(name, value) {
    if (this._prefMap.has(name)) {
      this.store.dispatch(ac.BroadcastToContent({type: at.PREF_CHANGED, data: {name, value}}));
    }

    this._checkPrerender(name);

    if (name === "feeds.snippets") {
      // If snippets are disabled, onboarding notifications should also be
      // disabled because they look like snippets.
      this.setOnboardingDisabledDefault(!value);
    }
  }

  _migratePrefs() {
    for (const indexedDBPref of Object.keys(PREF_MIGRATION)) {
      for (const migratePref of PREF_MIGRATION[indexedDBPref].keys()) {
        // Check if pref exists (if the user changed the default)
        if (this._prefs.get(migratePref, null) === true) {
          const data = {id: PREF_MIGRATION[indexedDBPref].get(migratePref), value: {}};
          data.value[indexedDBPref] = true;
          this.store.dispatch(ac.OnlyToMain({type: at.UPDATE_SECTION_PREFS, data}));
          this._prefs.reset(migratePref);
        }
      }
    }
  }

  init() {
    this._prefs.observeBranch(this);

    // Get the initial value of each activity stream pref
    const values = {};
    for (const name of this._prefMap.keys()) {
      values[name] = this._prefs.get(name);
    }

    // XXX add a comment with pointer to bug (from blame) explaining that this won't change
    // Not a pref, but we need this to determine whether to showprivate-browsing-related stuff
    values.isPrivateBrowsingEnabled = PrivateBrowsingUtils.enabled;

    // XXX test/impl consumer
    // Graft a copy of a top-level pref onto the prefs chunk of the store.

    // XXX this is pretty gross.  If we have to do much more of this, we should
    // consider making ActivityStreamPrefs able to handle more than
    // just the local AS pref branch.
    this._dataReportingBranch.addObserver(TELEMETRY_PREF_NAME, this);
    values.dataReportingUploadEnabled =
      this._dataReportingBranch.getBoolPref(TELEMETRY_PREF_NAME);

    // Set the initial state of all prefs in redux
    this.store.dispatch(ac.BroadcastToContent({type: at.PREFS_INITIAL_VALUES, data: values}));

    this._migratePrefs();
    this._setPrerenderPref();
    this._initOnboardingPref();
  }

  removeListeners() {
    this._prefs.ignoreBranch(this);
    this._dataReportingBranch.removeObserver(TELEMETRY_PREF_NAME, this);
  }

  async _setIndexedDBPref(id, value) {
    const name = id === "topsites" ? id : `feeds.section.${id}`;
    await this._storage.set(name, value);
    this._setPrerenderPref();
  }

  onAction(action) {
    switch (action.type) {
      case at.INIT:
        this.init();
        break;
      case at.UNINIT:
        this.removeListeners();
        this.setOnboardingDisabledDefault(false);
        break;
      case at.SET_PREF:
        this._prefs.set(action.data.name, action.data.value);
        break;
      case at.THEME_UPDATE:
        this._setPrerenderPref(action.data);
        break;
      case at.DISABLE_ONBOARDING:
        this.setOnboardingDisabledDefault(true);
        break;
      case at.UPDATE_SECTION_PREFS:
        this._setIndexedDBPref(action.data.id, action.data.value);
        break;
    }
  }
};

const EXPORTED_SYMBOLS = ["PrefsFeed"];

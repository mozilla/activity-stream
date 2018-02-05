/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;

const {actionCreators: ac, actionTypes: at} = ChromeUtils.import("resource://activity-stream/common/Actions.jsm", {});
const {Prefs} = ChromeUtils.import("resource://activity-stream/lib/ActivityStreamPrefs.jsm", {});
const {PrerenderData} = ChromeUtils.import("resource://activity-stream/common/PrerenderData.jsm", {});
ChromeUtils.import("resource://gre/modules/Services.jsm");

const ONBOARDING_FINISHED_PREF = "browser.onboarding.notification.finished";

this.PrefsFeed = class PrefsFeed {
  constructor(prefMap) {
    this._prefMap = prefMap;
    this._prefs = new Prefs();
  }

  // If the any prefs are set to something other than what the prerendered version
  // of AS expects, we can't use it.
  _setPrerenderPref(name) {
    this._prefs.set("prerender", PrerenderData.arePrefsValid(pref => this._prefs.get(pref)));
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

  init() {
    this._prefs.observeBranch(this);

    // Get the initial value of each activity stream pref
    const values = {};
    for (const name of this._prefMap.keys()) {
      values[name] = this._prefs.get(name);
    }

    // Set the initial state of all prefs in redux
    this.store.dispatch(ac.BroadcastToContent({type: at.PREFS_INITIAL_VALUES, data: values}));

    this._setPrerenderPref();
    this._initOnboardingPref();
  }

  removeListeners() {
    this._prefs.ignoreBranch(this);
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
      case at.DISABLE_ONBOARDING:
        this.setOnboardingDisabledDefault(true);
        break;
    }
  }
};

this.EXPORTED_SYMBOLS = ["PrefsFeed"];

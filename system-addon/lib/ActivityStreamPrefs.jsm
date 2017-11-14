/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {utils: Cu} = Components;
Cu.import("resource://gre/modules/AppConstants.jsm");
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/Services.jsm");

const ACTIVITY_STREAM_PREF_BRANCH = "browser.newtabpage.activity-stream.";

this.Prefs = class Prefs extends Preferences {
  /**
   * Prefs - A wrapper around Preferences that always sets the branch to
   *         ACTIVITY_STREAM_PREF_BRANCH
   */
  constructor(branch = ACTIVITY_STREAM_PREF_BRANCH) {
    super({branch});
    this._branchName = branch;
    this._branchObservers = new Map();
  }
  get branchName() {
    return this._branchName;
  }
  ignoreBranch(listener) {
    const observer = this._branchObservers.get(listener);
    this._prefBranch.removeObserver("", observer);
    this._branchObservers.delete(listener);
  }
  observeBranch(listener) {
    const observer = (subject, topic, pref) => {
      listener.onPrefChanged(pref, this.get(pref));
    };
    this._prefBranch.addObserver("", observer);
    this._branchObservers.set(listener, observer);
  }
};

this.DefaultPrefs = class DefaultPrefs {
  /**
   * DefaultPrefs - A helper for setting and resetting default prefs for the add-on
   *
   * @param  {Map} config A Map with {string} key of the pref name and {object}
   *                      value with the following pref properties:
   *         {string} .title (optional) A description of the pref
   *         {bool|string|number} .value The default value for the pref
   * @param  {string} branch (optional) The pref branch (defaults to ACTIVITY_STREAM_PREF_BRANCH)
   */
  constructor(config, branch = ACTIVITY_STREAM_PREF_BRANCH) {
    this._config = config;
    this.branch = Services.prefs.getDefaultBranch(branch);
  }

  /**
   * setDefaultPref - Sets the default value (not user-defined) for a given pref
   *
   * @param  {string} key The name of the pref
   * @param  {type} val The default value of the pref
   */
  setDefaultPref(key, val) {
    switch (typeof val) {
      case "boolean":
        this.branch.setBoolPref(key, val);
        break;
      case "number":
        this.branch.setIntPref(key, val);
        break;
      case "string":
        this.branch.setStringPref(key, val);
        break;
    }
  }

  /**
   * init - Set default prefs for all prefs in the config
   */
  init() {
    // Local developer builds (with the default mozconfig) aren't OFFICIAL
    const IS_UNOFFICIAL_BUILD = !AppConstants.MOZILLA_OFFICIAL;

    for (const pref of this._config.keys()) {
      const prefConfig = this._config.get(pref);
      let value;
      if (IS_UNOFFICIAL_BUILD && "value_local_dev" in prefConfig) {
        value = prefConfig.value_local_dev;
      } else {
        value = prefConfig.value;
      }
      this.setDefaultPref(pref, value);
    }
  }

  /**
   * reset - Resets all user-defined prefs for prefs in ._config to their defaults
   */
  reset() {
    for (const name of this._config.keys()) {
      this.branch.clearUserPref(name);
    }
  }
};

this.EXPORTED_SYMBOLS = ["DefaultPrefs", "Prefs"];

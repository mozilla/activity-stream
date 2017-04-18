/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* globals Preferences, Services, XPCOMUtils */

const {interfaces: Ci, utils: Cu} = Components;

Cu.import("resource://gre/modules/Preferences.jsm");
Cu.importGlobalProperties(["fetch"]);
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/Console.jsm"); // eslint-disable-line no-console

const ENDPOINT_PREF = "telemetry.ping.endpoint";
const TELEMETRY_PREF = "telemetry";
const LOGGING_PREF = "performance.log";

const ACTION_NOTIF = "user-action-event";
const PERFORMANCE_NOTIF = "performance-event";
const COMPLETE_NOTIF = "tab-session-complete";
const UNDESIRED_NOTIF = "undesired-event";

// This is intentionally a different pref-branch than the SDK-based add-on
// used, to avoid extra weirdness for people who happen to have the SDK-based
// installed.  Though maybe we should just forcibly disable the old add-on?
const PREF_BRANCH = "browser.newtabpage.activity-stream";

/**
 * Observe various notifications and send them to a telemetry endpoint.
 *
 * @param {Object} args - optional arguments
 * @param {Function} args.prefInitHook - if present, will be called back
 *                   inside the Prefs constructor. Typically used from tests
 *                   to save off a pointer to a fake Prefs instance so that
 *                   stubs and spies can be inspected by the test code.
 *
 */
function TelemetrySender(args) {
  let prefArgs = {branch: PREF_BRANCH};
  if (args) {
    if ("prefInitHook" in args) {
      prefArgs.initHook = args.prefInitHook;
    }
  }

  this._prefs = new Preferences(prefArgs);

  this.enabled = this._prefs.get(TELEMETRY_PREF);
  this._onTelemetryPrefChange = this._onTelemetryPrefChange.bind(this);
  this._prefs.observe(TELEMETRY_PREF, this._onTelemetryPrefChange);

  this.logging = this._prefs.get(LOGGING_PREF);
  this._onLoggingPrefChange = this._onLoggingPrefChange.bind(this);
  this._prefs.observe(LOGGING_PREF, this._onLoggingPrefChange);

  this._pingEndpoint = this._prefs.get(ENDPOINT_PREF);

  if (this.enabled) {
    this._addObservers();
  }
}

TelemetrySender.prototype = {
  /* We need this to be multi-process safe while using the observer service
   * (though it's not obvious to me how the weak reference helps that). */
  QueryInterface: XPCOMUtils.generateQI([
    Ci.nsIObserver,
    Ci.nsISupportsWeakReference
  ]),

  observe(subject, topic, data) {
    switch (topic) {
      case COMPLETE_NOTIF:
      case ACTION_NOTIF:
      case PERFORMANCE_NOTIF:
      case UNDESIRED_NOTIF:
        this._sendPing(data);
        break;
    }
  },

  _onLoggingPrefChange(prefVal) {
    this.logging = prefVal;
  },

  _onTelemetryPrefChange(prefVal) {
    if (this.enabled && !prefVal) {
      this._removeObservers();
    } else if (!this.enabled && prefVal) {
      this._addObservers();
    }

    this.enabled = prefVal;
  },

  _addObservers() {
    Services.obs.addObserver(this, COMPLETE_NOTIF, true);
    Services.obs.addObserver(this, ACTION_NOTIF, true);
    Services.obs.addObserver(this, PERFORMANCE_NOTIF, true);
    Services.obs.addObserver(this, UNDESIRED_NOTIF, true);
  },

  _removeObservers() {
    Services.obs.removeObserver(this, COMPLETE_NOTIF);
    Services.obs.removeObserver(this, ACTION_NOTIF);
    Services.obs.removeObserver(this, PERFORMANCE_NOTIF);
    Services.obs.removeObserver(this, UNDESIRED_NOTIF);
  },

  async _sendPing(data) {
    if (this.logging) {
      // performance related pings cause a lot of logging, so we mute them
      if (JSON.parse(data).action !== "activity_stream_performance") {
        console.log(`TELEMETRY PING: ${data}`); // eslint-disable-line no-console
      }
    }

    return fetch(this._pingEndpoint, {method: "POST", body: data}).then(response => {
      if (!response.ok) {
        Cu.reportError(`Ping failure with HTTP response code: ${response.status}`);
      }
    }).catch(e => {
      Cu.reportError(`Ping failure with error: ${e}`);
    });
  },

  uninit() {
    try {
      if (this.enabled) {
        this._removeObservers();
      }
      this._prefs.ignore(TELEMETRY_PREF, this._onTelemetryPrefChange);
    } catch (e) {
      Cu.reportError(e);
    }
  }
};

this.TelemetrySender = TelemetrySender;
this.EXPORTED_SYMBOLS = ["TelemetrySender"];

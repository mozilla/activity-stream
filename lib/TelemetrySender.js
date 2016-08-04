/* globals Services */

const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
Cu.import("resource://gre/modules/Services.jsm");
Cu.importGlobalProperties(["fetch"]);

const ENDPOINT_PREF = "telemetry.ping.endpoint";
const TELEMETRY_PREF = "telemetry";
const ACTION_NOTIF = "user-action-event";
const PERFORMANCE_NOTIF = "performance-event";
const COMPLETE_NOTIF = "tab-session-complete";
const LOGGING_PREF = "performance.log";

function TelemetrySender() {
  this.enabled = simplePrefs.prefs[TELEMETRY_PREF];
  this._pingEndpoint = simplePrefs.prefs[ENDPOINT_PREF];
  this.logging = simplePrefs.prefs[LOGGING_PREF];
  this._onPrefChange = this._onPrefChange.bind(this);
  simplePrefs.on(ENDPOINT_PREF, this._onPrefChange);
  simplePrefs.on(TELEMETRY_PREF, this._onPrefChange);
  simplePrefs.on(LOGGING_PREF, this._onPrefChange);
  if (this.enabled) {
    Services.obs.addObserver(this, COMPLETE_NOTIF);
    Services.obs.addObserver(this, ACTION_NOTIF);
    Services.obs.addObserver(this, PERFORMANCE_NOTIF);
  }
}

TelemetrySender.prototype = {
  observe(subject, topic, data) {
    if (topic === COMPLETE_NOTIF || topic === ACTION_NOTIF || topic === PERFORMANCE_NOTIF) {
      this._sendPing(data);
    }
  },

  _onPrefChange(prefName) {
    if (prefName === ENDPOINT_PREF) {
      this._pingEndpoint = simplePrefs.prefs[ENDPOINT_PREF];
    } else if (prefName === TELEMETRY_PREF) {
      let newValue = simplePrefs.prefs[TELEMETRY_PREF];

      if (this.enabled && !newValue) {
        Services.obs.removeObserver(this, COMPLETE_NOTIF);
        Services.obs.removeObserver(this, ACTION_NOTIF);
        Services.obs.removeObserver(this, PERFORMANCE_NOTIF);
      } else if (!this.enabled && newValue) {
        Services.obs.addObserver(this, COMPLETE_NOTIF);
        Services.obs.addObserver(this, ACTION_NOTIF);
        Services.obs.addObserver(this, PERFORMANCE_NOTIF);
      }

      this.enabled = newValue;
    } else if (prefName === LOGGING_PREF) {
      this.logging = simplePrefs.prefs[LOGGING_PREF];
    }
  },

  _sendPing(data) {
    if (this.logging) {
      // performance related pings cause a lot of logging, so we mute them
      if (JSON.parse(data).action !== "activity_stream_performance") {
        console.log(`TELEMETRY PING: ${data}`); // eslint-disable-line no-console
      }
    }
    fetch(this._pingEndpoint, {method: "POST", body: data}).then(response => {
      if (!response.ok) {
        Cu.reportError(`Ping failure with response code: ${response.status}`);
      }
    })
    .catch(e => {
      Cu.reportError(`Ping failure with error code: ${e.message}`);
    });
  },

  uninit() {
    try {
      if (this.enabled) {
        Services.obs.removeObserver(this, COMPLETE_NOTIF);
      }
      simplePrefs.removeListener(TELEMETRY_PREF, this._onPrefChange);
      simplePrefs.removeListener(ENDPOINT_PREF, this._onPrefChange);
    } catch (e) {
      Cu.reportError(e);
    }
  }
};

exports.TelemetrySender = TelemetrySender;

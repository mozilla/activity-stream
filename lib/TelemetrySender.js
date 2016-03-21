/* globals Services */

const {Cu} = require("chrome");
const simplePrefs = require("sdk/simple-prefs");
Cu.import("resource://gre/modules/Services.jsm");
Cu.importGlobalProperties(["fetch"]);

const ENDPOINT_PREF = "telemetry.ping.endpoint";
const TELEMETRY_PREF = "telemetry";

function TelemetrySender() {
  this.enabled = simplePrefs.prefs[TELEMETRY_PREF];
  this._pingEndpoint = simplePrefs.prefs[ENDPOINT_PREF];
  this._onPrefChange = this._onPrefChange.bind(this);
  simplePrefs.on(ENDPOINT_PREF, this._onPrefChange);
  simplePrefs.on(TELEMETRY_PREF, this._onPrefChange);
  if (this.enabled) {
    this.init();
  }
}

TelemetrySender.prototype = {
  observe(subject, topic, data) {
    if (topic === "tab-session-complete") {
      this._sendPing(data);
    }
  },

  _onPrefChange(subject, topic, data) {
    if (topic === ENDPOINT_PREF) {

      this._pingEndpoint = simplePrefs.prefs[ENDPOINT_PREF];

    } else if (topic === TELEMETRY_PREF) {

      let newValue = simplePrefs.prefs[TELEMETRY_PREF];

      if (this.enabled && !newValue) {
        this.uninit();
      } else if (!this.enabled && newValue) {
        this.init();
      }

      this.enabled = newValue;
    }
  },

  _sendPing(data) {
    fetch(this._pingEndpoint, {method: "POST", body: data}).then(response => {
      if (!response.ok) {
        Cu.reportError(`Ping failure with response code: ${response.status}`);
      }
    })
    .catch(e => {
      Cu.reportError(`Ping failure with error code: ${e.message}`);
    });
  },

  init() {
    Services.obs.addObserver(this, "tab-session-complete");
  },

  uninit() {
    Services.obs.removeObserver(this, "tab-session-complete");
    simplePrefs.removeListener(ENDPOINT_PREF, this._onPrefChange);
  }
};

exports.TelemetrySender = TelemetrySender;

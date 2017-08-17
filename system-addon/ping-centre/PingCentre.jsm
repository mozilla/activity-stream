/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const {interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Preferences.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.importGlobalProperties(["fetch"]);

XPCOMUtils.defineLazyModuleGetter(this, "AppConstants",
  "resource://gre/modules/AppConstants.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "ClientID",
  "resource://gre/modules/ClientID.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "console",
  "resource://gre/modules/Console.jsm");

const PREF_BRANCH = "browser.ping-centre.";

const TELEMETRY_PREF = `${PREF_BRANCH}telemetry`;
const LOGGING_PREF = `${PREF_BRANCH}log`;
const STAGING_ENDPOINT_PREF = `${PREF_BRANCH}staging.endpoint`;
const PRODUCTION_ENDPOINT_PREF = `${PREF_BRANCH}production.endpoint`;

const FHR_UPLOAD_ENABLED_PREF = "datareporting.healthreport.uploadEnabled";

/**
 * Observe various notifications and send them to a telemetry endpoint.
 *
 * @param {Object} options
 * @param {string} options.topic - a unique ID for users of PingCentre to distinguish
 *                  their data on the server side.
 * @param {string} options.overrideEndpointPref - optional pref for URL where the POST is sent.
 * @param {Object} args - optional arguments
 * @param {Function} args.prefInitHook - if present, will be called back
 *                   inside the Prefs constructor. Typically used from tests
 *                   to save off a pointer to a fake Prefs instance so that
 *                   stubs and spies can be inspected by the test code.
 */
class PingCentre {
  constructor(options, args) {
    let prefArgs = {};
    if (args) {
      if ("prefInitHook" in args) {
        prefArgs.initHook = args.prefInitHook;
      }
    }

    if (!options.topic) {
      throw new Error("Must specify topic.");
    }

    this._topic = options.topic;
    this._prefs = new Preferences(prefArgs);

    this._setPingEndpoint(options.topic, options.overrideEndpointPref);

    this._enabled = this._prefs.get(TELEMETRY_PREF);
    this._onTelemetryPrefChange = this._onTelemetryPrefChange.bind(this);
    this._prefs.observe(TELEMETRY_PREF, this._onTelemetryPrefChange);

    this._fhrEnabled = this._prefs.get(FHR_UPLOAD_ENABLED_PREF);
    this._onFhrPrefChange = this._onFhrPrefChange.bind(this);
    this._prefs.observe(FHR_UPLOAD_ENABLED_PREF, this._onFhrPrefChange);

    this.logging = this._prefs.get(LOGGING_PREF);
    this._onLoggingPrefChange = this._onLoggingPrefChange.bind(this);
    this._prefs.observe(LOGGING_PREF, this._onLoggingPrefChange);
  }

  /**
   * Lazily get the Telemetry id promise
   */
  get telemetryClientId() {
    Object.defineProperty(this, "telemetryClientId", {value: ClientID.getClientID()});
    return this.telemetryClientId;
  }

  get enabled() {
    return this._enabled && this._fhrEnabled;
  }

  _setPingEndpoint(topic, overrideEndpointPref) {
    const overrideValue = overrideEndpointPref && this._prefs.get(overrideEndpointPref);
    if (overrideValue) {
      this._pingEndpoint = overrideValue;
    } else if (AppConstants.MOZ_UPDATE_CHANNEL === "release") {
      this._pingEndpoint = this._prefs.get(PRODUCTION_ENDPOINT_PREF);
    } else {
      this._pingEndpoint = this._prefs.get(STAGING_ENDPOINT_PREF);
    }
  }

  _onLoggingPrefChange(prefVal) {
    this.logging = prefVal;
  }

  _onTelemetryPrefChange(prefVal) {
    this._enabled = prefVal;
  }

  _onFhrPrefChange(prefVal) {
    this._fhrEnabled = prefVal;
  }

  async sendPing(data) {
    if (!this.enabled) {
      return Promise.resolve();
    }

    let clientID = data.client_id || await this.telemetryClientId;
    const payload = Object.assign({
      topic: this._topic,
      client_id: clientID
    }, data);

    if (this.logging) {
      // performance related pings cause a lot of logging, so we mute them
      if (data.action !== "activity_stream_performance") {
        console.log(`TELEMETRY PING: ${JSON.stringify(payload)}\n`); // eslint-disable-line no-console
      }
    }

    return fetch(this._pingEndpoint, {method: "POST", body: JSON.stringify(payload)}).then(response => {
      if (!response.ok) {
        Cu.reportError(`Ping failure with HTTP response code: ${response.status}`);
      }
    }).catch(e => {
      Cu.reportError(`Ping failure with error: ${e}`);
    });
  }

  uninit() {
    try {
      this._prefs.ignore(TELEMETRY_PREF, this._onTelemetryPrefChange);
      this._prefs.ignore(LOGGING_PREF, this._onLoggingPrefChange);
      this._prefs.ignore(FHR_UPLOAD_ENABLED_PREF, this._onFhrPrefChange);
    } catch (e) {
      Cu.reportError(e);
    }
  }
}

this.PingCentre = PingCentre;
this.PingCentreConstants = {
  PRODUCTION_ENDPOINT_PREF,
  FHR_UPLOAD_ENABLED_PREF,
  TELEMETRY_PREF,
  LOGGING_PREF
};
this.EXPORTED_SYMBOLS = ["PingCentre", "PingCentreConstants"];

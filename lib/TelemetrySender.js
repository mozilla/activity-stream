/* globals Services */

const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");
Cu.importGlobalProperties(["fetch"]);

function TelemetrySender(pingEndpoint) {
  Services.obs.addObserver(this, "tab-session-complete");
  this._pingEndpoint = pingEndpoint;
}

TelemetrySender.prototype = {
  observe: function(subject, topic, data) {
    if (topic === "tab-session-complete") {
      this._sendPing(data);
    }
  },

  _sendPing: function(data) {
    fetch(this._pingEndpoint, {method: "POST", body: data}).then(function(response) {
      if (!response.ok) {
        Cu.reportError(`Ping failure with response code: ${response.status}`);
      }
    })
    .catch(function(e) {
      Cu.reportError(`Ping failure with error code: ${e.message}`);
    });
  },

  uninit: function() {
    Services.obs.removeObserver(this, "tab-session-complete");
  }
};

exports.TelemetrySender = TelemetrySender;

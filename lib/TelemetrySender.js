/* globals Services */

const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

function TelemetrySender() {
  Services.obs.addObserver(this, "tab-session-complete");
}

TelemetrySender.prototype = {
  observe: function(subject, topic) {
    if (topic === "tab-session-complete") {
      // TODO: send ping to server.
    }
  },

  uninit: function() {
    Services.obs.removeObserver(this, "tab-session-complete");
  }
};

exports.TelemetrySender = TelemetrySender;

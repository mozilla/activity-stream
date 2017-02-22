/* globals Services */
"use strict";

const {Cu} = require("chrome");
const {before, after} = require("sdk/test/utils");
const {getTestActivityStream} = require("./lib/utils");
const simplePrefs = require("sdk/simple-prefs");

Cu.import("resource://gre/modules/Services.jsm");

let app;

exports.test_ActivityStream_respond_to_pref_change = function*(assert) {
  let userEventPromise = new Promise(resolve => {
    function observe(subject, topic, data) {
      if (topic === "user-action-event") {
        Services.obs.removeObserver(observe, "user-action-event");
        resolve(JSON.parse(data));
      }
    }
    Services.obs.addObserver(observe, "user-action-event", false);
  });

  // Pref should be true by default
  assert.equal(true, simplePrefs.prefs.showSearch);

  let eventData = {
    msg: {
      type: "NOTIFY_PREF_CHANGE",
      data: {
        name: "showSearch",
        value: false
      }
    }
  };
  app._respondToPrefChange(eventData);
  yield userEventPromise;
  // now it should be false
  assert.equal(false, simplePrefs.prefs.showSearch);

  eventData.msg.data.value = true;
  app._respondToPrefChange(eventData);
  yield userEventPromise;
  // and now back to true
  assert.equal(true, simplePrefs.prefs.showSearch);
};

before(exports, () => {
  app = getTestActivityStream();
});

after(exports, () => {
  app.unload();
});

require("sdk/test").run(exports);

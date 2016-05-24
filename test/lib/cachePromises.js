/* globals Services */

"use strict";
const {Cu} = require("chrome");
Cu.import("resource://gre/modules/Services.jsm");

let makeCachePromise = (name) => {
  return new Promise(resolve => {
    let precacheNotif = `activity-streams-${name}-cache-complete`;
    let waitForCache = (subject, topic, data) => {
      if (topic === precacheNotif) {
        Services.obs.removeObserver(waitForCache, precacheNotif);
        resolve();
      }
    };
    Services.obs.addObserver(waitForCache, precacheNotif);
  });
};

let makeCountingCachePromise = (name, target) => {
  return new Promise(resolve => {
    let count = 0;
    let precacheNotif = `activity-streams-${name}-cache-complete`;
    let waitForCache = (subject, topic, data) => {
      if (topic === precacheNotif) {
        count++;
        if (count === target) {
          Services.obs.removeObserver(waitForCache, precacheNotif);
          resolve(count);
        }
      }
    };
    Services.obs.addObserver(waitForCache, precacheNotif);
  });
};

exports.makeCachePromise = makeCachePromise;
exports.makeCountingCachePromise = makeCountingCachePromise;

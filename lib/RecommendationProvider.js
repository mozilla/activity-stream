/* globals exports, require, Task */
"use strict";
const {Cu} = require("chrome");
const {setTimeout, clearTimeout} = require("sdk/timers");
const simplePrefs = require("sdk/simple-prefs");

const MILLISECONDS_IN_A_MINUTE = 1000 * 60;
const MILLISECONDS_IN_TEN_MINUTES = MILLISECONDS_IN_A_MINUTE * 10;
const MILLISECONDS_IN_AN_HOUR = MILLISECONDS_IN_A_MINUTE * 60;
const MILLISECONDS_IN_A_DAY = MILLISECONDS_IN_AN_HOUR * 24;
const MILLISECONDS_IN_A_WEEK = MILLISECONDS_IN_A_DAY * 7;
const POCKET_API_URL = "pocket.endpoint";

const DEFAULT_TIMEOUTS = {
  pocketTimeout: MILLISECONDS_IN_TEN_MINUTES, // every 10 minutes, refresh the Pocket recommendations
};

Cu.import("resource://gre/modules/Task.jsm");
Cu.importGlobalProperties(["fetch"]);

function RecommendationProvider(previewProvider, options = {}) {
  this.options = Object.assign({}, DEFAULT_TIMEOUTS, options);
  this._recommendedContent = [];
  this._blockedRecommendedContent = new Set();
  this._currentRecommendation = null;
  this._pocketEndpoint = simplePrefs.prefs[POCKET_API_URL];
  this._previewProvider = previewProvider;
  this._asyncUpdateRecommendations(this.options.pocketTimeout);
}

RecommendationProvider.prototype = {
  _pocketTimeoutID: null,

  /**
    * If we need a recommendation, go get one
    */
  getRecommendation(refresh = false) {
    // if we need a new recommendation purge the current recommendation and get a new one
    if (refresh) {
      this._currentRecommendation = null;
    }
    // if we are already displaying a recommendation, just show that one and don't get a new one
    if (this._currentRecommendation) {
      return this._currentRecommendation;
    }
    return this._getRandomRecommendation();
  },

  /**
    * Randomly pick a recommendation from the allowed set of recommendations (i.e ones that are not blocked)
    */
  _getRandomRecommendation() {
    const allowedRecommendations = this._recommendedContent.filter(item => !this._blockedRecommendedContent.has(item.url));
    if (allowedRecommendations.length > 0) {
      let index = Math.floor(Math.random() * (allowedRecommendations.length));
      this._currentRecommendation = Object.assign({}, {
        url: allowedRecommendations[index].url,
        timestamp: allowedRecommendations[index].timestamp,
        recommended: true});
      return this._currentRecommendation;
    }
    this._currentRecommendation = null;
    return this._currentRecommendation;
  },

  /**
    * Fetches Pocket recommendations and saves them to a global list of recommended content
    */
  asyncSetRecommendedContent: Task.async(function*() {
    try {
      let response = yield this._asyncGetRecommendationsFromPocket();
      if (response.ok) {
        let responseJson = yield response.json();
        if (responseJson.urls.length > 0) {
          // wait for the recommendation's metadata to come back (we don't want to show ugly recommendations)
          let richRecommendations = yield this._previewProvider.getLinkMetadata(responseJson.urls);
          this._recommendedContent = richRecommendations;
          this._recommendedContent.forEach(item => item.timestamp = this._convertTime(item.timestamp));
        }
      } else {
        Cu.reportError(`Response failed with status ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      Cu.reportError(err);
      throw err;
    }
  }),

  /**
    * Update the list of recommendations the user has blocked (they do not want to see these again)
    */
  setBlockedRecommendation(link) {
    this._blockedRecommendedContent.add(link);
    this._currentRecommendation = null;
  },

  /**
    * Convert milliseconds into human readable form and style it accordingly
    */
  _convertTime(timestamp) {
    let publishedTime = Date.now() - timestamp;
    if (timestamp === 0 || publishedTime < MILLISECONDS_IN_TEN_MINUTES) {
      return "Now";
    } else if (publishedTime >= MILLISECONDS_IN_TEN_MINUTES && publishedTime < MILLISECONDS_IN_AN_HOUR) {
      return Math.floor(((publishedTime / (MILLISECONDS_IN_A_MINUTE)) % 60)) + "m";
    } else if (publishedTime >= MILLISECONDS_IN_AN_HOUR && publishedTime < MILLISECONDS_IN_A_DAY) {
      return Math.floor(((publishedTime / (MILLISECONDS_IN_AN_HOUR)) % 24)) + "h";
    } else if (publishedTime >= MILLISECONDS_IN_A_DAY && publishedTime < MILLISECONDS_IN_A_WEEK) {
      return Math.floor(((publishedTime / (MILLISECONDS_IN_A_DAY)) % 7)) + "d";
    } else {
      return Math.floor((publishedTime / (MILLISECONDS_IN_A_WEEK))) + "w";
    }
  },

  _asyncGetRecommendationsFromPocket: Task.async(function*() {
    try {
      let response = yield fetch(this._pocketEndpoint, {
        method: "GET",
        headers: {"Content-Type": "application/json"}
      });
      return response;
    } catch (err) {
      Cu.reportError(err);
      throw err;
    }
  }),

  /**
    * Update the list of recommendations from Pocket
    */
  _asyncUpdateRecommendations: Task.async(function*(pocketTimeout = 5000) {
    if (pocketTimeout) {
      this._pocketTimeoutID = setTimeout(() => {
        this.asyncSetRecommendedContent();
        this._asyncUpdateRecommendations(pocketTimeout);
      }, pocketTimeout);
    }
  }),

  /**
    * Uninitialize the recommendation provider
    */
  uninit() {
    clearTimeout(this._pocketTimeoutID);
    this._recommendedContent = new Set();
    this._blockedRecommendedContent = [];
    this._currentRecommendation = null;
  }
};

exports.RecommendationProvider = RecommendationProvider;

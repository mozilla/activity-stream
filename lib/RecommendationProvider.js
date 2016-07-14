/* globals exports, require, Task */
"use strict";
const {Cu} = require("chrome");
const {setTimeout, clearTimeout} = require("sdk/timers");
const simplePrefs = require("sdk/simple-prefs");

const MILLISECONDS_IN_TEN_MINUTES = 600000;
const MILLISECONDS_IN_AN_HOUR = 3600000;
const MILLISECONDS_IN_A_DAY = 86400000;
const MILLISECONDS_IN_A_WEEK = 604800000;
const POCKET_PREF = "pocket.endpoint";

const DEFAULT_TIMEOUTS = {
  pocketTimeout: 600000, // every 10 minutes, refresh the Pocket recommendations
};

Cu.import("resource://gre/modules/Task.jsm");
Cu.importGlobalProperties(["fetch"]);

function RecommendationProvider(previewProvider, options = {}) {
  this.options = Object.assign({}, DEFAULT_TIMEOUTS, options);
  this._recommendedContent = [];
  this._blockedRecommendedContent = [];
  this._currentRecommendation = null;
  this._pocketEndpoint = simplePrefs.prefs[POCKET_PREF];
  this._previewProvider = previewProvider;
  this._asyncExpireRecommendations(this.options.pocketTimeout);
}

RecommendationProvider.prototype = {
  _pocketTimeoutID: null,

  /**
    * If we need a recommendation, go get one
    */
  getARecommendation(getRecommendation) {
    if (getRecommendation) {
      // if we are already displaying a recommendation, just show that one and don't get a new one
      if (this._currentRecommendation) {
        return this._currentRecommendation;
      }
      return this._getRandomRecommendation();
    }
    // if we don't need a recommendation, don't return one
    return null;
  },

  /**
    * Get a new recommendation from Pocket
    */
  getANewRecommendation(getRecommendation) {
    this._currentRecommendation = null;
    this.getARecommendation(getRecommendation);
  },

  /**
    * Randomly pick a recommendation from the allowed set of recommendations (i.e ones that are not blocked)
    */
  _getRandomRecommendation() {
    const allowedRecommendations = this._recommendedContent.filter(item => !this._blockedRecommendedContent.includes(item.url));
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
    this._blockedRecommendedContent.push(link);
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
      return Math.floor(((publishedTime / (1000 * 60)) % 60)) + "m";
    } else if (publishedTime >= MILLISECONDS_IN_AN_HOUR && publishedTime < MILLISECONDS_IN_A_DAY) {
      return Math.floor(((publishedTime / (1000 * 60 * 60)) % 24)) + "h";
    } else if (publishedTime >= MILLISECONDS_IN_A_DAY && publishedTime < MILLISECONDS_IN_A_WEEK) {
      return Math.floor(((publishedTime / (1000 * 60 * 60 * 24)) % 7)) + "d";
    } else {
      return Math.floor((publishedTime / (1000 * 60 * 60 * 24 * 7))) + "w";
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
  _asyncExpireRecommendations: Task.async(function*(pocketTimeout) {
    if (pocketTimeout) {
      this._pocketTimeoutID = setTimeout(() => {
        this.asyncSetRecommendedContent();
        this._asyncExpireRecommendations(pocketTimeout);
      }, pocketTimeout);
    }
  }),

  /**
    * Uninitialize the recommendation provider
    */
  uninit() {
    clearTimeout(this._pocketTimeoutID);
    this._recommendedContent = [];
    this._blockedRecommendedContent = [];
    this._currentRecommendation = null;
  }
};

exports.RecommendationProvider = RecommendationProvider;

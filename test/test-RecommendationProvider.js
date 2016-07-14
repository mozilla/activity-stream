/* globals require, exports */

"use strict";

const {before, after, waitUntil} = require("sdk/test/utils");
const {RecommendationProvider} = require("lib/RecommendationProvider");
const simplePrefs = require("sdk/simple-prefs");
const {Loader} = require("sdk/test/loader");
const loader = Loader(module);
const httpd = loader.require("./lib/httpd");
const gPort = 8079;

let gRecommendationProvider;
let gPrefPocket = simplePrefs.prefs["pocket.endpoint"];
let fakeResponse = {"urls": [
  {url: "http://example.com/1", timestamp: 1467781200000},
  {url: "http://example.com/2", timestamp: 1467694800000},
  {url: "http://example.com/3", timestamp: 0},
  {url: "http://example.com/4", timestamp: 1467383640000},
  {url: "http://example.com/5", timestamp: 1467262800000},
]};

exports.test_get_recommended_content = function*(assert) {
  assert.ok(gRecommendationProvider._pocketEndpoint, "The pocket endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  srv.registerPathHandler("/pocketRecommendations", function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  // set the recommendations and check that it got some metadata and converted the timestamp
  yield gRecommendationProvider.asyncSetRecommendedContent();

  assert.equal(gRecommendationProvider._recommendedContent.length, 5, "set the recommended content");
  gRecommendationProvider._recommendedContent.forEach((recommendation, i) => {
    assert.ok(recommendation.metadata, "recommendation got some metadata from PreviewProvider");
    assert.notEqual(recommendation.timestamp, fakeResponse.urls[i].timestamp, "timestamp has been converted from it's original form");
  });

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_convert_timestamp = function*(assert) {
  // create some timestamps to convert
  const fiveMinutesAgo = Date.now() - 300000;
  const thirtyMinutesAgo = Date.now() - 1800000;
  const tenHoursAgo = Date.now() - 36000000;
  const threeDaysAgo = Date.now() - 259200000;
  const twoWeeksAgo = Date.now() - 1209600000;

  assert.equal(gRecommendationProvider._convertTime(fiveMinutesAgo), "Now", "correctly converted 5 minutes ago timestamp");
  assert.equal(gRecommendationProvider._convertTime(thirtyMinutesAgo), "30m", "correctly converted 30 minutes ago timestamp");
  assert.equal(gRecommendationProvider._convertTime(tenHoursAgo), "10h", "correctly converted 10 hours ago timestamp");
  assert.equal(gRecommendationProvider._convertTime(threeDaysAgo), "3d", "correctly converted 3 days ago timestamp");
  assert.equal(gRecommendationProvider._convertTime(twoWeeksAgo), "2w", "correctly converted 2 weeks ago timestamp");
};

exports.test_expire_recommendations = function*(assert) {
  // set the recommendations
  gRecommendationProvider._recommendedContent = fakeResponse.urls;
  assert.equal(gRecommendationProvider._recommendedContent.length, 5, "currently we have 5 recommendations");
  assert.ok(gRecommendationProvider._pocketEndpoint, "The pocket endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  // update the recommendations response
  let newFakeResponse = {"urls": fakeResponse.urls.slice(0, 4)};
  srv.registerPathHandler("/pocketRecommendations", function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(newFakeResponse));
  });

  // start the timer to expire the data and wait for it to trigger
  gRecommendationProvider._asyncExpireRecommendations(100);
  yield waitUntil(() => {return true;}, 1000);

  // check that the recommendations got updated
  assert.equal(gRecommendationProvider._recommendedContent.length, 4, "updated the recommended content to 4 recommendations");
  gRecommendationProvider._recommendedContent.forEach((recommendation, i) => {
    assert.ok(recommendation.metadata, "recommendation got some metadata from PreviewProvider");
    assert.notEqual(recommendation.timestamp, fakeResponse.urls[i].timestamp, "timestamp has been converted from it's original form");
  });
  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_get_a_recommendation = function*(assert) {
  // create a fake recommendation and get it
  const fakeRecommendedContent = [{url: "http://example1.com", timestamp: 1467999273}, {url: "http://example2.com", timestamp: 1467999273}];
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  const recommendation = gRecommendationProvider.getARecommendation(true);
  const getRecommendationAgain = gRecommendationProvider.getARecommendation(true);

  // making a call to get a recommendation a second time should return the current recommendation - not get a new one
  assert.equal(recommendation.url, getRecommendationAgain.url, "don't get a new recommendation");
  assert.equal(getRecommendationAgain.url, gRecommendationProvider._currentRecommendation.url, "just return the current recommendation");
};

exports.test_get_a_new_recommendation = function*(assert) {
  // create a fake recommendation and get it
  const fakeRecommendedContent = [{url: "http://example1.com", timestamp: 1467999273}];
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  const recommendation = gRecommendationProvider.getARecommendation(true);
  assert.equal(recommendation.url, gRecommendationProvider._currentRecommendation.url, "correctly set the current recommendation");

  // we want to get a new recommendation - but we want to test that we set the current recommendation to null before getting a new one
  // so pass in "false" to bypass actually getting a new recommendation
  gRecommendationProvider.getANewRecommendation(false);
  assert.equal(gRecommendationProvider._currentRecommendation, null, "current recommendation is null, we requested a new one");
};

exports.test_set_blocked_recommendation = function*(assert) {
  // create a fake recommendation and a fake blocked recommendation
  const fakeRecommendedContent = [{url: "http://pickme.com", timestamp: 1467999273}];
  const fakeBlockedRecommendedContent = ["http://blockme.com"];
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  gRecommendationProvider._blockedRecommendedContent = fakeBlockedRecommendedContent;
  const recommendation = gRecommendationProvider.getARecommendation(true);
  assert.equal(recommendation.url, gRecommendationProvider._currentRecommendation.url, "set a current recommendation");

  // block the recommendation we just had
  gRecommendationProvider._recommendedContent.push({url: "http://pickmesecond.com", timestamp: 1467999273});
  gRecommendationProvider.setBlockedRecommendation(recommendation.url);
  assert.equal(gRecommendationProvider._blockedRecommendedContent.length, 2, "added one to the block list");
  assert.equal(gRecommendationProvider._blockedRecommendedContent[1], recommendation.url, "blocked the original recommendation");
  assert.equal(gRecommendationProvider._currentRecommendation, null, "set the current recommendation to null");

  // pick a new recommendation
  const newRecommendation = gRecommendationProvider.getARecommendation(true);
  assert.equal(gRecommendationProvider._currentRecommendation.url, newRecommendation.url, "picked a new recommendation");
};

exports.test_random_recommendation = function*(assert) {
  // create a fake recommendation and a fake blocked recommendation
  let fakeRecommendedContent = [{url: "http://pickme.com", timestamp: 1467999273}];
  const fakeBlockedRecommendedContent = ["http://blockme.com"];
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  gRecommendationProvider._blockedRecommendedContent = fakeBlockedRecommendedContent;
  let recommendation = gRecommendationProvider._getRandomRecommendation();

  // we should filter out the blocked one and set the current recommendation to the fake recommended content
  assert.equal(recommendation.url, fakeRecommendedContent[0].url, "we picked the correct url");
  assert.equal(recommendation.timestamp, fakeRecommendedContent[0].timestamp, "it has the correct timestamp");
  assert.ok(recommendation.recommended, "it's been stamped as a recommended url");
  assert.equal(recommendation.url, gRecommendationProvider._currentRecommendation.url, "it correctly set the current recommendation");
  assert.equal(recommendation.timestamp, gRecommendationProvider._currentRecommendation.timestamp, "current recommendation has the right timestamp");

  // test that if there are no allowed recommendations, we shouldn't show one
  fakeRecommendedContent = [];
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  gRecommendationProvider._currentRecommendation = null;
  recommendation = gRecommendationProvider._getRandomRecommendation();

  // don't show them
  assert.equal(recommendation, null, "there are no allowed recommendations so we don't have a recommendation to show");
  assert.equal(gRecommendationProvider._currentRecommendation, null, "the current recommendation stays null");
};

exports.test_skip_recommendations_altogether = function*(assert) {
  // if we don't want to show a recommendation, the recommendation should be null
  const recommendation = gRecommendationProvider.getARecommendation(false);
  assert.equal(recommendation, null, "the recommendation we got back was null");
  assert.equal(gRecommendationProvider._currentRecommendation, null, "we did not set a current recommendation");
};

exports.test_experiments_dont_show_recommendations = function*(assert) {
  // even if the pref is on, and we got the flag to get a recommendation, if we are not in an experiment
  // do not get a recommendation
  const inExperiment = false;
  const recommendationPref = true;
  const getRecommendationMeta = true;
  const recommendation = gRecommendationProvider.getARecommendation(getRecommendationMeta && recommendationPref && inExperiment);
  assert.equal(recommendation, null, "the recommendation we got back was null because we are not part of the experiment");
  assert.equal(gRecommendationProvider._currentRecommendation, null, "we did not set a current recommendation because we are not part of the experiment");
};

before(exports, function*() {
  simplePrefs.prefs["pocket.endpoint"] = `http://localhost:${gPort}/pocketRecommendations`;
  // PreviewProvider needs to attach some metadata to these recommendations
  const mockPreviewProvider = {
    getLinkMetadata: function(links) {
      let a = [];
      links.forEach(item => a.push(Object.assign({}, item, {metadata: "some metadata"})));
      return a;
    }
  };
  gRecommendationProvider = new RecommendationProvider(mockPreviewProvider);
});

after(exports, function*() {
  simplePrefs.prefs["pocket.endpoint"] = gPrefPocket;
  gRecommendationProvider.uninit();
});

require("sdk/test").run(exports);

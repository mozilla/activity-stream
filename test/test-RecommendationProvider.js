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
let fakeResponse = {
  "urls": [
  {url: "http://example.com/1"},
  {url: "http://example.com/2"},
  {url: "http://example.com/3"},
  {url: "http://example.com/4"},
  {url: "http://example.com/5"}
  ]
};

exports.test_get_recommended_content = function*(assert) {
  assert.ok(gRecommendationProvider._pocketEndpoint, "The pocket endpoint is set");
  let srv = httpd.startServerAsync(gPort);

  srv.registerPathHandler("/pocketRecommendations", function handle(request, response) {
    response.setHeader("Content-Type", "application/json", false);
    response.write(JSON.stringify(fakeResponse));
  });

  // set the recommendations and check that it got some metadata
  yield gRecommendationProvider.asyncSetRecommendedContent();

  assert.equal(gRecommendationProvider._recommendedContent.length, 5, "set the recommended content");
  gRecommendationProvider._recommendedContent.forEach(recommendation => {
    assert.ok(recommendation.metadata, "recommendation got some metadata from PreviewProvider");
  });

  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_update_recommendations = function*(assert) {
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

  // start the timer to update the data and wait for it to trigger
  gRecommendationProvider._asyncUpdateRecommendations(100);
  yield waitUntil(() => {return true;}, 1000);

  // check that the recommendations got updated
  assert.equal(gRecommendationProvider._recommendedContent.length, 4, "updated the recommended content to 4 recommendations");
  gRecommendationProvider._recommendedContent.forEach(recommendation => {
    assert.ok(recommendation.metadata, "recommendation got some metadata from PreviewProvider");
  });
  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

exports.test_get_a_recommendation = function(assert) {
  // create a fake recommendation and get it
  let fakeRecommendedContent = [{url: "http://example1.com"}, {url: "http://example2.com"}];
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  let recommendation = gRecommendationProvider.getRecommendation();

  assert.equal(recommendation.url, gRecommendationProvider._currentRecommendation.url, "it correctly set the current recommendation");
  const getRecommendationAgain = gRecommendationProvider.getRecommendation();

  // making a call to get a recommendation a second time should return the current recommendation - not get a new one
  assert.equal(recommendation.url, getRecommendationAgain.url, "don't get a new recommendation");
  assert.equal(getRecommendationAgain.url, gRecommendationProvider._currentRecommendation.url, "just return the current recommendation");

  // if we don't have a recommendation to show the current recommendation should be null
  fakeRecommendedContent = [];
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  gRecommendationProvider._currentRecommendation = null;
  recommendation = gRecommendationProvider.getRecommendation();
  assert.equal(gRecommendationProvider._currentRecommendation, null, "the current recommendation stays null");
};

exports.test_get_a_new_recommendation = function(assert) {
  // create a fake recommendation and get it
  const fakeRecommendedContent = [{url: "http://example1.com"}, {url: "http://example2.com"}];
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  const recommendation = gRecommendationProvider.getRecommendation();
  assert.equal(recommendation.url, gRecommendationProvider._currentRecommendation.url, "correctly set the current recommendation");

  const oldCurrentRecommendation = gRecommendationProvider._currentRecommendation.url;
  gRecommendationProvider.setBlockedRecommendation(oldCurrentRecommendation.url);

  // forcefully get a new recommendation
  gRecommendationProvider.getRecommendation(true);
  assert.notEqual(gRecommendationProvider._currentRecommendation.url, oldCurrentRecommendation.url, "got a new recommendation");
};

exports.test_set_blocked_recommendation = function(assert) {
  // create a fake recommendation and a fake blocked recommendation
  const fakeRecommendedContent = [{url: "http://pickme.com"}];
  const fakeBlockedRecommendedContent = new Set();
  fakeBlockedRecommendedContent.add("http://blockme.com");
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  gRecommendationProvider._blockedRecommendedContent = fakeBlockedRecommendedContent;
  const recommendation = gRecommendationProvider.getRecommendation();
  assert.equal(recommendation.url, gRecommendationProvider._currentRecommendation.url, "set a current recommendation");

  // block the recommendation we just had
  gRecommendationProvider._recommendedContent.push({url: "http://pickmesecond.com"});
  gRecommendationProvider.setBlockedRecommendation(recommendation.url);
  assert.equal(gRecommendationProvider._blockedRecommendedContent.size, 2, "added one to the block list");
  assert.ok(gRecommendationProvider._blockedRecommendedContent.has(recommendation.url), "blocked the original recommendation");
  assert.equal(gRecommendationProvider._currentRecommendation, null, "set the current recommendation to null");

  // pick a new recommendation
  const newRecommendation = gRecommendationProvider.getRecommendation();
  assert.equal(gRecommendationProvider._currentRecommendation.url, newRecommendation.url, "picked a new recommendation");
};

exports.test_random_recommendation = function(assert) {
  // create a fake recommendation and a fake blocked recommendation
  let fakeRecommendedContent = [{url: "http://pickme.com"}];
  const fakeBlockedRecommendedContent = new Set();
  fakeBlockedRecommendedContent.add("http://blockme.com");
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  gRecommendationProvider._blockedRecommendedContent = fakeBlockedRecommendedContent;
  let recommendation = gRecommendationProvider._getRandomRecommendation();

  // we should filter out the blocked one and set the current recommendation to the fake recommended content
  assert.equal(recommendation.url, fakeRecommendedContent[0].url, "we picked the correct url");
  assert.ok(recommendation.recommended, "it's been stamped as a recommended url");
  assert.ok(recommendation.recommender_type, "it's been stamped with a recommender type");
  assert.equal(recommendation.type, "recommended", "it's been stamped with a type");

  // getting a random recommendation should return null if there are no recommendations to show
  fakeRecommendedContent = [];
  gRecommendationProvider._recommendedContent = fakeRecommendedContent;
  recommendation = gRecommendationProvider._getRandomRecommendation();
  assert.equal(recommendation, null, "there are no allowed recommendations so we don't have a recommendation to show");
};

before(exports, () => {
  simplePrefs.prefs["pocket.endpoint"] = `http://localhost:${gPort}/pocketRecommendations`;
  // PreviewProvider needs to attach some metadata to these recommendations
  const mockPreviewProvider = {
    getLinkMetadata(links) {
      let a = [];
      links.forEach(item => a.push(Object.assign({}, item, {metadata: "some metadata"})));
      return a;
    }
  };
  const mockTabTracker = {handleUserEvent() {}, generateEvent() {}, handlePerformanceEvent() {}};
  gRecommendationProvider = new RecommendationProvider(mockPreviewProvider, mockTabTracker);
});

after(exports, () => {
  simplePrefs.prefs["pocket.endpoint"] = gPrefPocket;
  gRecommendationProvider.uninit();
});

require("sdk/test").run(exports);

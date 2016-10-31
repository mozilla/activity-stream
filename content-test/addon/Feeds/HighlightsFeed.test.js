const testLinks = [{url: "foo.com"}, {url: "bar.com"}];
const getMetadata = sites => sites.map(site => site.toUpperCase());
const PlacesProvider = {
  links: {
    getAllHistoryItems: sinon.spy(() => Promise.resolve(testLinks)),
    getRecentlyVisited: sinon.spy(() => Promise.resolve(testLinks)),
    getHighlightsLinks: sinon.spy(() => Promise.resolve(testLinks))
  }
};
const {SimplePrefs} = require("sdk/simple-prefs");
const simplePrefs = new SimplePrefs();
class Recommender {
  constructor(...args) {
    this.args = args;
  }
}
const moment = require("moment");
const createStoreWithState = state => ({getState: () => state});
const {TOP_SITES_LENGTH, SPOTLIGHT_DEFAULT_LENGTH, WEIGHTED_HIGHLIGHTS_LENGTH} = require("common/constants");

describe("HighlightsFeed", () => {
  let HighlightsFeed;
  let instance;
  beforeEach(() => {
    HighlightsFeed = require("inject!addon/Feeds/HighlightsFeed")({
      "addon/PlacesProvider": {PlacesProvider},
      "sdk/simple-prefs": simplePrefs,
      "common/recommender/Recommender": {Recommender}
    });
    Object.keys(PlacesProvider.links).forEach(k => PlacesProvider.links[k].reset());
    instance = new HighlightsFeed({getMetadata});
    sinon.spy(instance.options, "getMetadata");
  });
  it("should create a HighlightsFeed", () => {
    assert.instanceOf(instance, HighlightsFeed);
  });
  it("should have an UPDATE_TIME of 15 minutes", () => {
    const time = moment.duration(HighlightsFeed.UPDATE_TIME);
    assert.equal(time.minutes(), 15);
  });
  describe(".inExperiment", () => {
    it("should return true if weightedHighlights is on", () => {
      instance.connectStore(createStoreWithState({Experiments: {values: {weightedHighlights: true}}}));
      assert.isTrue(instance.inExperiment);
    });
    it("should return false if weightedHighlights is off", () => {
      instance.connectStore(createStoreWithState({Experiments: {values: {weightedHighlights: false}}}));
      assert.isFalse(instance.inExperiment);
    });
  });
  describe(".hasEnoughSites", () => {
    describe("weightedHighlights", () => {
      it("should be true if enough WeightedHighlights", () => {
        instance.connectStore(createStoreWithState({
          Experiments: {values: {weightedHighlights: true}},
          WeightedHighlights: {rows: Array(WEIGHTED_HIGHLIGHTS_LENGTH + TOP_SITES_LENGTH).fill("site")}
        }));
        assert.isTrue(instance.hasEnoughSites);
      });
      it("should be false if not enough WeightedHighlights", () => {
        instance.connectStore(createStoreWithState({
          Experiments: {values: {weightedHighlights: true}},
          WeightedHighlights: {rows: Array(WEIGHTED_HIGHLIGHTS_LENGTH + TOP_SITES_LENGTH - 1).fill("site")}
        }));
        assert.isFalse(instance.hasEnoughSites);
      });
    });
    describe("old highlights", () => {
      it("should be true if has enough Highlights", () => {
        instance.connectStore(createStoreWithState({
          Experiments: {values: {weightedHighlights: false}},
          Highlights: {rows: Array(SPOTLIGHT_DEFAULT_LENGTH).fill("site")}
        }));
        assert.isTrue(instance.hasEnoughSites);
      });
      it("should be false if not enough Highlights", () => {
        instance.connectStore(createStoreWithState({
          Experiments: {values: {weightedHighlights: false}},
          Highlights: {rows: Array(SPOTLIGHT_DEFAULT_LENGTH - 1).fill("site")}
        }));
        assert.isFalse(instance.hasEnoughSites);
      });
    });
  });
  describe("#getCoefficientsFromPrefs", () => {
    it("should return coefficients from prefs", () => {
      simplePrefs.prefs.weightedHighlightsCoefficients = "[0, 1, 2]";
      assert.deepEqual(instance.getCoefficientsFromPrefs(), [0, 1, 2]);
    });
    it("should return null if there were parsing errors", () => {
      simplePrefs.prefs.weightedHighlightsCoefficients = "not valid";
      assert.isNull(instance.getCoefficientsFromPrefs());
    });
    it("should return null if the pref does not return an array", () => {
      simplePrefs.prefs.weightedHighlightsCoefficients = "{}";
      assert.isNull(instance.getCoefficientsFromPrefs());
    });
  });
  describe("#initializeRecommender", () => {
    it("should return a promise", () => {
      assert.instanceOf(instance.initializeRecommender(), Promise);
    });
    it("should set .baselineRecommender", () =>
      instance.initializeRecommender().then(() =>
        assert.instanceOf(instance.baselineRecommender, Recommender)
      )
    );
    it("should pass the right args", () => {
      simplePrefs.prefs.weightedHighlightsCoefficients = "[0, 1, 2]";
      return instance.initializeRecommender().then(() => {
        assert.equal(instance.baselineRecommender.args[0], testLinks);
        assert.deepEqual(instance.baselineRecommender.args[1], {highlightsCoefficients: [0, 1, 2]});
      });
    });
  });
  describe("#getWeightedHighlights", () => {
    it("should reject if baselineRecommender is undefined", () => instance.getWeightedHighlights()
        .catch(e => {
          assert.instanceOf(e, Error);
          assert.equal(e.message, "Tried to get weighted highlights but there was no baselineRecommender");
        })
    );
  });
  describe("#getOldHighlights", () => {

  });
  describe("#getData", () => {

  });
  describe("#onAction", () => {

  });
});

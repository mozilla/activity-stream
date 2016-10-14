const testLinks = [{url: "foo.com"}, {url: "bar.com"}];
const oldTestLinks = [{url: "boo.com"}, {url: "far.com"}];
const getMetadata = sites => sites.map(site => site.url.toUpperCase());
const {TOP_SITES_LENGTH, SPOTLIGHT_DEFAULT_LENGTH, WEIGHTED_HIGHLIGHTS_LENGTH} = require("common/constants");
const moment = require("moment");
const {SimplePrefs} = require("sdk/simple-prefs");

const simplePrefs = new SimplePrefs();
const PlacesProvider = {
  links: {
    getAllHistoryItems: sinon.spy(() => Promise.resolve(testLinks)),
    getRecentlyVisited: sinon.spy(() => Promise.resolve(testLinks)),
    getHighlightsLinks: sinon.spy(() => Promise.resolve(oldTestLinks))
  }
};
class Recommender {
  constructor(...args) {
    this.args = args;
  }
}
const createStoreWithState = state => ({
  state,
  getState() {
    return this.state;
  }
});

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
    instance.refresh = sinon.spy();
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
    it("should call refresh with the reason", () => {
      instance.refresh = sinon.spy();
      return instance.initializeRecommender("foo").then(() => {
        assert.calledWith(instance.refresh, "foo");
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
    it("should resolve with an action", () => {
      instance.baselineRecommender = {scoreEntries: links => links};
      return instance.getWeightedHighlights()
        .then(action => {
          assert.isObject(action);
          assert.equal(action.type, "WEIGHTED_HIGHLIGHTS_RESPONSE");
          assert.lengthOf(action.data, 2);
        });
    });
    it("should run sites through getMetadata", () => {
      instance.baselineRecommender = {scoreEntries: links => links};
      return instance.getWeightedHighlights()
        .then(action => {
          assert.calledOnce(instance.options.getMetadata);
          assert.deepEqual(action.data, getMetadata(testLinks));
        });
    });
    it("should run sites through scoreEntries AFTER getMetadata", () => {
      instance.baselineRecommender = {scoreEntries: sinon.spy()};
      return instance.getWeightedHighlights()
        .then(action => (
          assert.calledWithExactly(instance.baselineRecommender.scoreEntries, getMetadata(testLinks))
        ));
    });
  });
  describe("#getOldHighlights", () => {
    it("should resolve with a HIGHLIGHTS action", () => instance.getOldHighlights()
        .then(action => {
          assert.isObject(action);
          assert.equal(action.type, "HIGHLIGHTS_LINKS_RESPONSE");
          assert.lengthOf(action.data, 2);
          assert.deepEqual(action.data, getMetadata(oldTestLinks));
        })
    );
  });
  describe("#getData", () => {
    it("should return .getOldHighlights if .inExperiment is false", () => {
      instance.connectStore(createStoreWithState({Experiments: {values: {weightedHighlights: false}}}));
      sinon.spy(instance, "getOldHighlights");
      assert.instanceOf(instance.getData(), Promise);
      assert.calledOnce(instance.getOldHighlights);
    });
    it("should return .getWeightedHighlights if .inExperiment is true", () => {
      instance.connectStore(createStoreWithState({Experiments: {values: {weightedHighlights: true}}}));
      sinon.spy(instance, "getWeightedHighlights");
      assert.instanceOf(instance.getData(), Promise);
      assert.calledOnce(instance.getWeightedHighlights);
    });
  });
  describe("#onAction", () => {
    let clock;
    let store;
    beforeEach(() => {
      instance.refresh = sinon.spy();
      clock = sinon.useFakeTimers();
      store = createStoreWithState({});
      instance.connectStore(store);
    });
    afterEach(() => {
      clock.restore();
    });
    it("should call refresh on APP_INIT", () => {
      instance.initializeRecommender = sinon.spy();
      instance.onAction(store.getState(), {type: "APP_INIT"});
      assert.calledWith(instance.initializeRecommender, "app was initializing");
    });
    it("should call refresh on APP_INIT (old highlights)", () => {
      store.state.Experiments.values.weightedHighlights = false;
      instance.initializeRecommender = sinon.spy();
      instance.onAction(store.getState(), {type: "APP_INIT"});
      assert.notCalled(instance.initializeRecommender);
      assert.calledOnce(instance.refresh);
    });
    it("should call refresh on RECEIVE_BOOKMARK_ADDED", () => {
      instance.onAction({}, {type: "RECEIVE_BOOKMARK_ADDED"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "a bookmark was added");
    });
    it("should call refresh on RECEIVE_PLACES_CHANGES if there are not enough sites", () => {
      store.state.WeightedHighlights = {rows: Array(WEIGHTED_HIGHLIGHTS_LENGTH + TOP_SITES_LENGTH - 1).fill("site")};
      instance.onAction(store.getState(), {type: "RECEIVE_PLACES_CHANGES"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "there were not enough sites");
    });
    it("should not call refresh on RECEIVE_PLACES_CHANGES if there are enough sites", () => {
      store.state.WeightedHighlights = {rows: Array(WEIGHTED_HIGHLIGHTS_LENGTH + TOP_SITES_LENGTH).fill("site")};
      instance.onAction(store.getState(), {type: "RECEIVE_PLACES_CHANGES"});
      assert.notCalled(instance.refresh);
    });
    it("should call refresh on RECEIVE_PLACES_CHANGES if .lastUpdated is too old", () => {
      store.state.WeightedHighlights = {rows: Array(WEIGHTED_HIGHLIGHTS_LENGTH + TOP_SITES_LENGTH).fill("site")};
      instance.lastUpdated = 0;
      clock.tick(HighlightsFeed.UPDATE_TIME);
      instance.onAction(store.getState(), {type: "RECEIVE_PLACES_CHANGES"});
      assert.calledOnce(instance.refresh);
      assert.calledWith(instance.refresh, "the sites were too old");
    });
    it("should not call refresh on RECEIVE_PLACES_CHANGES if .lastUpdated is less than update time", () => {
      store.state.WeightedHighlights = {rows: Array(WEIGHTED_HIGHLIGHTS_LENGTH + TOP_SITES_LENGTH).fill("site")};
      instance.lastUpdated = 0;
      clock.tick(HighlightsFeed.UPDATE_TIME - 1);
      instance.onAction(store.getState(), {type: "RECEIVE_PLACES_CHANGES"});
      assert.notCalled(instance.refresh);
    });
    it("should call initializeRecommender if the weightedHighlights was turned on", () => {
      instance.baselineRecommender = null;
      instance.initializeRecommender = sinon.spy();
      instance.onAction({}, {type: "EXPERIMENTS_RESPONSE"});
      assert.calledOnce(instance.initializeRecommender);
    });
    it("should remove the baselineRecommender and refresh if weightedHighlights was turned off", () => {
      instance.baselineRecommender = {};
      store.state.Experiments.values.weightedHighlights = false;
      instance.onAction({}, {type: "EXPERIMENTS_RESPONSE"});
      assert.isNull(instance.baselineRecommender);
      assert.calledWith(instance.refresh, "experiment was turned off");
    });
    it("should update the coefficients if the weightedHighlightsCoefficients pref is changed", () => {
      instance.baselineRecommender = {updateOptions: sinon.spy()};
      instance.getCoefficientsFromPrefs = sinon.spy(() => 123);
      instance.onAction(store.getState(), {type: "PREF_CHANGED_RESPONSE", data: {name: "weightedHighlightsCoefficients"}});
      assert.calledWith(instance.baselineRecommender.updateOptions, {highlightsCoefficients: 123});
      assert.calledWith(instance.refresh, "coefficients were changed");
    });
  });
});

import {GlobalOverrider} from "test/unit/utils";
import injector from "inject!lib/PersonalityProvider.jsm";

const TIME_SEGMENTS = [
  {"id": "hour", "startTime": 3600, "endTime": 0, "weightPosition": 1},
  {"id": "day", "startTime": 86400, "endTime": 3600, "weightPosition": 0.75},
  {"id": "week", "startTime": 604800, "endTime": 86400, "weightPosition": 0.5},
  {"id": "weekPlus", "startTime": null, "endTime": 604800, "weightPosition": 0.25},
];

const PARAMETER_SETS = {
  "paramSet1": {
    "recencyFactor": 0.5,
    "frequencyFactor": 0.5,
    "combinedDomainFactor": 0.5,
    "perfectFrequencyVisits": 10,
    "perfectCombinedDomainScore": 2,
    "multiDomainBoost": 0.1,
    "itemScoreFactor": 0,
  },
  "paramSet2": {
    "recencyFactor": 1,
    "frequencyFactor": 0.7,
    "combinedDomainFactor": 0.8,
    "perfectFrequencyVisits": 10,
    "perfectCombinedDomainScore": 2,
    "multiDomainBoost": 0.1,
    "itemScoreFactor": 0,
  },
};

describe("Personality Provider", () => {
  let instance;
  let PersonalityProvider;
  let globals;
  let NaiveBayesTextTaggerStub;
  let NmfTextTaggerStub;
  let RecipeExecutorStub;

  beforeEach(() => {
    globals = new GlobalOverrider();

    const testUrl = "www.somedomain.com";
    globals.sandbox.stub(global.Services.io, "newURI").returns({host: testUrl});

    globals.sandbox.stub(global.PlacesUtils.history, "executeQuery").returns({root: {childCount: 1, getChild: index => ({uri: testUrl, accessCount: 1})}});
    globals.sandbox.stub(global.PlacesUtils.history, "getNewQuery").returns({"TIME_RELATIVE_NOW": 1});
    globals.sandbox.stub(global.PlacesUtils.history, "getNewQueryOptions").returns({});

    NaiveBayesTextTaggerStub = globals.sandbox.stub();
    NmfTextTaggerStub = globals.sandbox.stub();
    RecipeExecutorStub = globals.sandbox.stub();

    ({PersonalityProvider} = injector({
      "lib/NaiveBayesTextTagger.jsm": {NaiveBayesTextTagger: NaiveBayesTextTaggerStub},
      "lib/NmfTextTagger.jsm": {NmfTextTagger: NmfTextTaggerStub},
      "lib/RecipeExecutor.jsm": {RecipeExecutor: RecipeExecutorStub},
    }));

    instance = new PersonalityProvider(TIME_SEGMENTS, PARAMETER_SETS);

    instance.interestConfig = {
      history_item_builder: "history_item_builder",
      history_required_fields: ["a", "b", "c"],
      interest_finalizer: "interest_finalizer",
      item_to_rank_builder: "item_to_rank_builder",
      item_ranker: "item_ranker",
      interest_combiner: "interest_combiner",
    };

    // mock the RecipeExecutor
    instance.recipeExecutor = {
      executeRecipe: (item, recipe) => {
        if (recipe === "history_item_builder") {
          if (item.title === "fail") {
            return null;
          }
          return {title: item.title, score: item.frecency, type: "history_item"};
        } else if (recipe === "interest_finalizer") {
          return {title: item.title, score: item.score * 100, type: "interest_vector"};
        } else if (recipe === "item_to_rank_builder") {
          if (item.title === "fail") {
            return null;
          }
          return {item_title: item.title, item_score: item.score, type: "item_to_rank"};
        } else if (recipe === "item_ranker") {
          if ((item.title === "fail") || (item.item_title === "fail")) {
            return null;
          }
          return {title: item.title, score: item.item_score * item.score, type: "ranked_item"};
        }
        return null;
      },
      executeCombinerRecipe: (item1, item2, recipe) => {
        if (recipe === "interest_combiner") {
          if ((item1.title === "combiner_fail") || (item2.title === "combiner_fail")) {
            return null;
          }
          if (item1.type === undefined) {
            item1.type = "combined_iv";
          }
          if (item1.score === undefined) {
            item1.score = 0;
          }
          return {type: item1.type, score: item1.score + item2.score};
        }
        return null;
      },
    };
  });
  afterEach(() => {
    globals.restore();
  });
  describe("#init", () => {
    it("should return correct data for getAffinities", () => {
      const affinities = instance.getAffinities();
      assert.isDefined(affinities.timeSegments);
      assert.isDefined(affinities.parameterSets);
    });
    it("should do generic init stuff when calling init with no cache", async () => {
      sinon.stub(instance, "getRecipe").returns(Promise.resolve());
      instance.createInterestVector = async () => ({});
      sinon.stub(instance, "generateRecipeExecutor").returns(Promise.resolve());
      sinon.stub(instance.store, "get").returns(Promise.resolve());
      sinon.stub(instance.store, "set").returns(Promise.resolve());
      await instance.init();
      assert.calledOnce(instance.getRecipe);
      assert.calledOnce(instance.generateRecipeExecutor);
      assert.calledOnce(instance.store.get);
      assert.calledOnce(instance.store.set);
      assert.isDefined(instance.interestVector);
      assert.isDefined(instance.interestVector.lastUpdate);
      assert.isTrue(instance.initialized);
    });
    it("should make new interest vector when called with out dated cache", async () => {
      const startTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
      instance.getRecipe = async () => {};
      instance.createInterestVector = async () => ({});
      instance.store.get = async () => ({lastUpdate: startTime});
      instance.generateRecipeExecutor = async () => {};
      sinon.stub(instance.store, "set").returns(Promise.resolve());
      await instance.init();
      assert.isTrue(instance.interestVector.lastUpdate > startTime);
      assert.calledOnce(instance.store.set);
    });
    it("should use interest vector when called with cache", async () => {
      const startTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      instance.getRecipe = async () => {};
      instance.createInterestVector = async () => ({});
      instance.store.get = async () => ({lastUpdate: startTime});
      instance.generateRecipeExecutor = async () => {};
      sinon.stub(instance.store, "set").returns(Promise.resolve());
      await instance.init();
      assert.isFalse(instance.interestVector.lastUpdate > startTime);
      assert.notCalled(instance.store.set);
    });
  });
  describe("#store", () => {
    it("should have a personality-provider store", () => {
      assert.equal(instance.store.name, "personality-provider");
      // The is to make sure prelaod is set to true.
      assert.equal(!!instance.store._cache, true);
    });
  });
  describe("#remote-settings", () => {
    it("should return a remote setting for getRemoteSettings", () => {
      assert.equal(typeof instance.getRemoteSettings("test"), "object");
    });
  });
  describe("#NewTabUtils", () => {
    it("should return an object for getNewTabUtils", () => {
      assert.equal(typeof instance.getNewTabUtils(), "object");
    });
  });
  describe("#taggers", () => {
    it("should return a NaiveBayesTextTagger on getNaiveBayesTextTagger", () => {
      instance.getNaiveBayesTextTagger({});
      assert.calledOnce(NaiveBayesTextTaggerStub);
    });
    it("should return a NmfTextTagger on getNmfTextTagger", () => {
      instance.getNmfTextTagger({});
      assert.calledOnce(NmfTextTaggerStub);
    });
  });
  describe("#executor", () => {
    it("should return a RecipeExecutor on getRecipeExecutor", () => {
      instance.getRecipeExecutor([], []);
      assert.calledOnce(RecipeExecutorStub);
    });
    it("should pass recipe models to getRecipeExecutor on generateRecipeExecutor", async () => {
      instance.modelKeys = ["nb_model_sports", "nmf_model_sports"];
      sinon.stub(instance, "getRecipeExecutor");

      instance.getRemoteSettings = async name => [
        {key: "nb_model_sports", data: {model_type: "nb"}},
        {key: "nmf_model_sports", data: {model_type: "nmf", parent_tag: "nmf_sports_parent_tag"}},
      ];
      instance.getNaiveBayesTextTagger = model => model;
      instance.getNmfTextTagger = model => model;
      await instance.generateRecipeExecutor();
      assert.calledOnce(instance.getRecipeExecutor);

      const {args} = instance.getRecipeExecutor.firstCall;
      assert.equal(args[0][0].model_type, "nb");
      assert.equal(args[1].nmf_sports_parent_tag.model_type, "nmf");
      assert.equal(args[1].nmf_sports_parent_tag.parent_tag, "nmf_sports_parent_tag");
    });
    it("should skip any models not in modelKeys", async () => {
      instance.modelKeys = ["nb_model_sports"];
      sinon.stub(instance, "getRecipeExecutor");

      instance.getRemoteSettings = async name => [
        {key: "nb_model_sports", data: {model_type: "nb"}},
        {key: "nmf_model_sports", data: {model_type: "nmf", parent_tag: "nmf_sports_parent_tag"}},
      ];
      instance.getNaiveBayesTextTagger = model => model;
      instance.getNmfTextTagger = model => model;
      await instance.generateRecipeExecutor();

      const {args} = instance.getRecipeExecutor.firstCall;
      assert.equal(args[0][0].model_type, "nb");
      assert.equal(Object.keys(args[1]).length, 0);
    });
    it("should skip any models not defined", async () => {
      instance.modelKeys = ["nb_model_sports", "nmf_model_sports"];
      sinon.stub(instance, "getRecipeExecutor");

      instance.getRemoteSettings = async name => [
        {key: "nb_model_sports", data: {model_type: "nb"}},
      ];
      instance.getNaiveBayesTextTagger = model => model;
      instance.getNmfTextTagger = model => model;
      await instance.generateRecipeExecutor();

      const {args} = instance.getRecipeExecutor.firstCall;
      assert.equal(args[0][0].model_type, "nb");
      assert.equal(Object.keys(args[1]).length, 0);
    });
  });
  describe("#recipe", () => {
    it("should get and fetch a new recipe on first getRecipe", () => {
      sinon.stub(instance, "getRemoteSettings");
      instance.getRecipe();
      assert.calledOnce(instance.getRemoteSettings);
      assert.calledWith(instance.getRemoteSettings, "personality-provider-recipe");
    });
    it("should not fetch a recipe on getRecipe if cached", () => {
      sinon.stub(instance, "getRemoteSettings");
      instance.recipe = {};
      instance.getRecipe();
      assert.notCalled(instance.getRemoteSettings);
    });
  });
  describe("#createInterestVector", () => {
    let mockHistory = [];
    beforeEach(() => {
      mockHistory = [
        {
          title: "automotive",
          description: "something about automotive",
          url: "http://example.com/automotive",
          frecency: 10,
        },
        {
          title: "fashion",
          description: "something about fashion",
          url: "http://example.com/fashion",
          frecency: 5,
        },
        {
          title: "tech",
          description: "something about tech",
          url: "http://example.com/tech",
          frecency: 1,
        },
      ];

      instance.fetchHistory = async () => mockHistory;
    });
    afterEach(() => {
      globals.restore();
    });
    it("should gracefully handle history entries that fail", async () => {
      mockHistory.push({title: "fail"});
      assert.isNotNull(await instance.createInterestVector());
    });

    it("should fail if the combiner fails", async () => {
      mockHistory.push({title: "combiner_fail", frecency: 111});
      let actual = await instance.createInterestVector();
      assert.isNull(actual);
    });

    it("should process history, combine, and finalize", async () => {
      let actual = await instance.createInterestVector();
      assert.equal(actual.score, 1600);
    });
  });

  describe("#calculateItemRelevanceScore", () => {
    it("it should return -1 for busted item", () => {
      assert.equal(instance.calculateItemRelevanceScore({title: "fail"}), -1);
    });
    it("it should return -1 for a busted ranking", () => {
      instance.interestVector = {title: "fail", score: 10};
      assert.equal(instance.calculateItemRelevanceScore({title: "some item", score: 6}), -1);
    });
    it("it should return a score, and not change with interestVector", () => {
      instance.interestVector = {score: 10};
      assert.equal(instance.calculateItemRelevanceScore({score: 2}), 20);
      assert.deepEqual(instance.interestVector, {score: 10});
    });
  });
  describe("#fetchHistory", () => {
    it("should return a history object for fetchHistory", async () => {
      instance.getNewTabUtils = () => ({activityStreamProvider: {executePlacesQuery: async (sql, options) => ({sql, options})}});
      const history = await instance.fetchHistory(["requiredColumn"], 1, 1);
      assert.equal(history.sql, `SELECT *\n    FROM moz_places\n    WHERE last_visit_date >= 1000000\n    AND last_visit_date < 1000000 AND requiredColumn <> ""`);
      assert.equal(history.options.columns.length, 1);
      assert.equal(Object.keys(history.options.params).length, 0);
    });
  });
});

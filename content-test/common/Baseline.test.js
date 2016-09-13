/* globals describe, it, beforeEach */

const {Baseline} = require("common/recommender/Baseline");
const {createSite} = require("test/faker");

const fakeHistory = [
  {
    reversedHost: "moc.elgoog.",
    visitCount: 1
  },
  {
    reversedHost: "moc.buhtig.",
    visitCount: 1
  },
  {
    reversedHost: "moc.oof.",
    visitCount: 2
  },
  {
    reversedHost: "moc.rab.",
    visitCount: 2
  },
  {
    reversedHost: "moc.1rab.",
    visitCount: 2
  },
  {
    reversedHost: "moc.2rab.",
    visitCount: 2
  }
];

const fakeUrls = [
  {
    url: "http://google.com/calendar",
    host: "google.com",
    visitCount: 2,
    title: "Activity Stream",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://github.com/mozilla/activity-stream",
    host: "github.com",
    visitCount: 1,
    title: "Activity Stream",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://github.com/mozilla/activity-stream",
    host: "github.com",
    visitCount: 1,
    title: "Activity Stream",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://foo.com/test",
    host: "foo.com",
    visitCount: 1,
    title: "Activity Stream",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://bar.com/test",
    host: "bar.com",
    visitCount: 1,
    title: "Activity Stream",
    bookmarkId: 1,
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://bar1.com/test",
    host: "bar1.com",
    visitCount: 1,
    title: "Old link",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e6
  },
  {
    url: "http://bar2.com/test",
    host: "bar2.com",
    visitCount: 30,
    title: "Very visited",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  }
];

describe("Baseline", () => {
  let baseline;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    baseline = new Baseline(fakeHistory,
                            {highlightsCoefficients: [-0.1, -0.1, -0.1, 0.4, 0.2]});
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should return a score for the urls", () => {
    let items = baseline.score(fakeUrls);
    assert.isNumber(items[0].score);
  });

  it("should return 0 for when no images are present", () => {
    assert.equal(baseline.extractImage({}), 0);
  });

  it("should return 0 when image array is empty", () => {
    assert.equal(baseline.extractImage({images: []}), 0);
  });

  it("should return 0 for when images don't have size", () => {
    assert.equal(baseline.extractImage({images: [{}]}), 0);
  });

  it("should extract image size", () => {
    const images = [{size: 42, width: 300, height: 300, url: "bar"}];
    assert.equal(baseline.extractImage(images), 42);
  });

  it("should return the same number of items after sort", () => {
    let items = baseline.score(fakeUrls);
    assert.equal(items.length, fakeUrls.length);
  });

  it("should sort items", () => {
    let items = baseline.score(fakeUrls);
    let descending = true;

    for (let i = 1; i < items.length; i++) {
      descending &= items[i - 1].score > items[i].score;
    }

    assert.isOk(descending);
  });

  it("should decrease score for consecutive items from the same domain", () => {
    let fakeUrlsWithScore = fakeUrls.map(url => Object.assign({}, url, {score: 1}));
    let items = baseline.dedupe(fakeUrlsWithScore);
    assert.ok(items[1].score > items[2].score);
  });

  it("should decrease by the right amount", () => {
    let fakeUrlsWithScore = fakeUrls.map(url => Object.assign({}, url, {score: 1}));
    let items = baseline.dedupe(fakeUrlsWithScore);
    // Items 1 and 2 are both github links so second one gets a lower score.
    assert.equal(items[1].score, 1);
    assert.equal(items[2].score, 0.8);
    assert.equal(items[3].score, 1);
  });

  it("should rank websites visited a long time ago lower", () => {
    let items = baseline.score(fakeUrls);
    assert.equal(items[items.length - 2].title, "Old link");
  });

  it("should rank websites with a lot of visits lower", () => {
    let items = baseline.score(fakeUrls);
    assert.equal(items[items.length - 1].title, "Very visited");
  });

  describe("feature extraction", () => {
    let entry;
    beforeEach(() => {
      entry = createSite({images: 2});
    });
    describe("assert correct calls", () => {
      let updateFeatureStub;
      beforeEach(() => {
        updateFeatureStub = sandbox.stub(baseline, "updateFeatureMinMax");
      });

      it("should update min max values", () => {
        baseline.extractFeatures(entry);

        sinon.assert.calledOnce(updateFeatureStub);
      });
    });
    it("should extract the correct number of images", () => {
      const result = baseline.extractFeatures(entry);

      assert.equal(result.features.imageCount, entry.images.length);
    });
    it("should extract the description", () => {
      const result = baseline.extractFeatures(entry);

      assert.equal(result.features.description, entry.description.length);
    });
    it("should set description to 0 if it's the same as the url", () => {
      entry.description = entry.url;
      const result = baseline.extractFeatures(entry);

      assert.equal(result.features.description, 0);
    });

    it("should select min", () => {
      assert.equal(baseline.selectMinValue(2, 1), 1);
    });

    it("should select max", () => {
      assert.equal(baseline.selectMaxValue(2, 1), 2);
    });

    it("should not fail if argument is undefined or NaN", () => {
      assert.equal(baseline.selectMaxValue(2, undefined), 2);
      assert.equal(baseline.selectMaxValue(2, NaN), 2);
    });

    it("should not fail if argument is undefined or NaN", () => {
      assert.equal(baseline.selectMinValue(2, undefined), 2);
      assert.equal(baseline.selectMinValue(2, NaN), 2);
    });

    it("should return 0 if description === title", () => {
      const result = baseline.extractDescriptionLength({
        title: "foo",
        description: "foo"
      });

      assert.equal(result, 0);
    });

    it("should return correct length for valid description", () => {
      const result = baseline.extractDescriptionLength({
        title: "foo",
        description: "bar"
      });

      assert.equal(result, 3);
    });

    it("should not extract 0 occurrences", () => {
      const result = baseline.extractFeatures({url: "http://www.neverbeforevisited.com"});

      // If the URL was visited for the first time this session then
      // occurrences in history is 0. Division by zero would result in Infinity.
      // This is a sanity check.
      assert.ok(result.features.idf < 10 && result.features.idf > 0);
    });

    it("should not extract 0 visits", () => {
      const result = baseline.extractFeatures({
        url: "http://www.neverbeforevisited.com",
        visitCount: 0 // Should never happen.
      });

      assert.equal(result.features.tf, 1);
    });
    it("should not fail with feature value Infinity (on new profiles) for new websites", () => {
      const result = baseline.extractFeatures({url: "http://www.neverbeforevisited.com"});

      assert.isNumber(result.features.idf);
      assert.isTrue(Number.isFinite(result.features.idf));
    });
    it("should not fail with feature value Infinity (on new profiles) for no history", () => {
      baseline = new Baseline([], {highlightsCoefficients: [-0.1, -0.1, -0.1, 0.4, 0.2]});
      const result = baseline.extractFeatures({url: "http://www.neverbeforevisited.com"});

      assert.isNumber(result.features.idf);
      assert.isTrue(Number.isFinite(result.features.idf));
    });
  });

  describe("decay", () => {
    it("should throw an error for undefined values", () => {
      assert.throws(() => baseline.decay(10, {foo: 1, bar: undefined}, [2, 3]));
    });
    it("should call filter on the features", () => {
      const result = baseline.decay(10, {foo: 1, isBookmarked: 2}, [1]);

      assert.isNumber(result);
    });
    it("should throw when different number of features and weights", () => {
      assert.throws(() => baseline.decay(10, {foo: 1}, [1, 2]));
    });
  });

  describe("scoring", () => {
    let entry;
    beforeEach(() => {
      entry = {
        features: {
          age: 1,
          tf: 10,
          idf: 10,
          queryLength: 0,
          imageCount: 1,
          pathLength: 1,
          isBookmarked: 0,
          description: 10,
          image: 1
        }
      };
    });

    describe("scoreEntry", () => {
      let normalizeStub;
      let decayStub;
      let adjustScoreStub;
      beforeEach(() => {
        normalizeStub = sandbox.stub(baseline, "normalize").returns(entry.features);
        decayStub = sandbox.stub(baseline, "decay").returns(42);
        adjustScoreStub = sandbox.stub(baseline, "adjustScore").returns(42);
      });
      it("should call normalize", () => {
        baseline.scoreEntry(entry);

        sinon.assert.calledOnce(normalizeStub);
        sinon.assert.calledWith(normalizeStub, entry.features);
      });
      it("should call decay", () => {
        baseline.scoreEntry(entry);
        const score = entry.features.tf * entry.features.idf;

        sinon.assert.calledOnce(decayStub);
        sinon.assert.calledWith(decayStub, score, entry.features, baseline.options.highlightsCoefficients);
      });
      it("should call adjust", () => {
        baseline.scoreEntry(entry);

        sinon.assert.calledOnce(adjustScoreStub);
        sinon.assert.calledWith(adjustScoreStub, 42, entry.features);
      });
      it("should return a score", () => {
        const result = baseline.scoreEntry(entry);

        assert.ok(result.score);
        assert.isNumber(result.score);
      });
    });

    it("should rank bookmarks higher", () => {
      const features = Object.assign({}, entry.features, {isBookmarked: 1});
      const bookmarkScore = baseline.adjustScore(10, features);
      const regularScore = baseline.adjustScore(10, entry.features);

      assert.isNumber(bookmarkScore);
      assert.isNumber(regularScore);
      assert.ok(bookmarkScore > regularScore);
    });

    it("should store min value of features that need normalization", () => {
      baseline.updateFeatureMinMax(entry.features);

      assert.equal(baseline.normalizeFeatures.pathLength.min, entry.features.pathLength);
    });

    it("should store max value of features that need normalization", () => {
      baseline.updateFeatureMinMax(entry.features);

      assert.equal(baseline.normalizeFeatures.description.max, entry.features.description);
    });

    it("should keep old value if an entry is undefined by accident", () => {
      const features = Object.assign({}, entry.features, {image: undefined});
      baseline.updateFeatureMinMax(features);

      assert.equal(baseline.normalizeFeatures.image.min, 1);
      assert.equal(baseline.normalizeFeatures.image.max, 0);
    });

    it("should not divide by 0", () => {
      baseline.normalizeFeatures.tf = [0, 0];
      const result = baseline.normalize(entry.features);

      assert.equal(result.tf, 10);
    });

    it("should normalize features", () => {
      baseline.normalizeFeatures.idf = {min: 1, max: 11};
      const result = baseline.normalize(entry.features);

      assert.isNumber(result.idf);
      assert.ok(result.idf <= 1 && result.idf >= 0);
    });

    it("should simply return features that shouldn't be normalized", () => {
      const features = {foo: 42};
      const result = baseline.normalize(features);

      assert.equal(result.foo, features.foo);
    });
  });

  describe("options", () => {
    const options = {highlightsCoefficients: [1, 2, 3]};
    it("should throw an error if highlightsCoefficients not provided", () => {
      assert.throws(() => new Baseline(fakeHistory));
    });
    it("should instantiate the recommender with the correct settings", () => {
      baseline = new Baseline(fakeHistory, options);
      assert.deepEqual(baseline.options, options);
    });
    it("should update the correct settings", () => {
      baseline.updateOptions(options);
      assert.deepEqual(baseline.options, options);
    });
  });
});

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

  beforeEach(() => {
    baseline = new Baseline(fakeHistory);
  });

  it("should return a score for the urls", () => {
    let items = baseline.score(fakeUrls);
    assert.isNumber(items[0].score);
  });

  it("should return 0 for when no images are present", () => {
    assert.equal(baseline.extractLargestImage({}), 0);
  });

  it("should return 0 when image array is empty", () => {
    assert.equal(baseline.extractLargestImage({images: []}), 0);
  });

  it("should return 0 for when images don't have size", () => {
    assert.equal(baseline.extractLargestImage({images: [{}]}), 0);
  });

  it("should extract max image size", () => {
    const images = [
      {size: 100, url: "foo"},
      {size: 42, width: 300, height: 300, url: "bar"},
      {size: undefined}
    ];
    assert.equal(baseline.extractLargestImage(images), 42);
  });

  it("should sort items", () => {
    let items = baseline.score(fakeUrls);
    assert.isTrue(items[0].score > items[1].score);
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

    it("should not extract 0 occurences", () => {
      const result = baseline.extractFeatures({url: "http://www.neverbeforevisited.com"});

      // If the URL was visited for the first time this session then
      // occurences in history is 0. Division by zero would result in Infinity.
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
  });

  describe("scoring", () => {
    let entry;
    beforeEach(() => {
      entry = {
        features: {
          tf: 10,
          idf: 10,
          queryLength: 0,
          imageCount: 1,
          pathLength: 1,
          isBookmarked: 0,
          description: 1,
          largestImage: 1
        }
      };
    });
    it("should create a new entry with a score based on features", () => {
      const result = baseline.scoreEntry(entry);

      assert.ok(result.score);
    });

    it("should rank bookmarks higher", () => {
      const features = Object.assign({}, entry.features, {isBookmarked: 1});
      const bookmarkScore = baseline.adjustScore(10, features);
      const regularScore = baseline.adjustScore(10, entry.features);

      assert.ok(bookmarkScore > regularScore);
    });

    it("should store min value of features that need normalization", () => {
      baseline.updateFeatureMinMax(entry.features);

      assert.equal(baseline.normalizeFeatures.queryLength[0], entry.features.queryLength);
    });

    it("should store max value of features that need normalization", () => {
      baseline.updateFeatureMinMax(entry.features);

      assert.equal(baseline.normalizeFeatures.idf[1], entry.features.idf);
    });

    it("should keep old value if an entry is undefined by accident", () => {
      const features = Object.assign({}, entry.features, {largestImage: undefined});
      baseline.updateFeatureMinMax(features);

      assert.equal(baseline.normalizeFeatures.largestImage[0], 1);
      assert.equal(baseline.normalizeFeatures.largestImage[1], 0);
    });

    it("should not divide by 0", () => {
      baseline.normalizeFeatures.tf = [0, 0];
      baseline.normalize(entry);

      assert.equal(entry.features.tf, 10);
    });

    it("should normalize features", () => {
      baseline.normalizeFeatures.idf = [1, 11];
      baseline.normalize(entry.features);

      assert.ok(entry.features.idf <= 1 && entry.features.idf >= 0);
    });
  });

  describe("options", () => {
    const options = {highlightsCoefficients: [1, 2, 3]};
    it("should instantiate the recommender with empty object by default", () => {
      baseline = new Baseline(fakeHistory);
      assert.deepEqual(baseline.options, {});
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

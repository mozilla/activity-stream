/* globals describe, it, beforeEach */

const {Baseline} = require("common/recommender/Baseline");

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
    const images = [{size: 100}, {size: 1}, {size: undefined}];
    assert.equal(baseline.extractLargestImage({images}), 100);
  });

  it("should sort items", () => {
    let items = baseline.score(fakeUrls);
    assert.isTrue(items[0].score > items[1].score);
  });

  it("should decrease score for consecutive items from the same domain", () => {
    let fakeUrlsWithScore = fakeUrls.map(url => {
      return Object.assign({}, url, {score: 1});
    })
    let items = baseline.dedupe(fakeUrlsWithScore);
    assert.ok(items[1].score > items[2].score);
  });

  it("should decrease by the right amount", () => {
    let fakeUrlsWithScore = fakeUrls.map(url => {
      return Object.assign({}, url, {score: 1});
    })
    let items = baseline.dedupe(fakeUrlsWithScore);
    // Items 1 and 2 are both github links so second one gets a lower score.
    assert.equal(items[1].score, 1);
    assert.equal(items[2].score, 0.8);
    assert.equal(items[3].score, 1);
  });

  it("should rank bookmarks higher than regular sites", () => {
    let items = baseline.score(fakeUrls.slice(3));
    assert.equal(items[0].bookmarkId, 1);
  });

  it("should rank websites visited a long time ago lower", () => {
    let items = baseline.score(fakeUrls);
    assert.equal(items[items.length - 2].title, "Old link");
  });

  it("should rank websites with a lot of visits lower", () => {
    let items = baseline.score(fakeUrls);
    assert.equal(items[items.length - 1].title, "Very visited");
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

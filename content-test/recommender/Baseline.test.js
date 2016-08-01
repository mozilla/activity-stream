/* globals describe, it, beforeEach */

const {Baseline} = require("common/recommender/Baseline");
const {assert} = require("chai");

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
    visitCount: 2,
    title: "Activity Stream",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://github.com/mozilla/activity-stream",
    visitCount: 1,
    title: "Activity Stream",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://github.com/mozilla/activity-stream",
    visitCount: 1,
    title: "Activity Stream",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://foo.com/test",
    visitCount: 1,
    title: "Activity Stream",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://bar.com/test",
    visitCount: 1,
    title: "Activity Stream",
    bookmarkId: 1,
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e2
  },
  {
    url: "http://bar1.com/test",
    visitCount: 1,
    title: "Old link",
    description: "",
    images: [],
    lastVisitDate: Date.now() - 1e6
  },
  {
    url: "http://bar2.com/test",
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

  it("should sort items", () => {
    let items = baseline.score(fakeUrls);
    assert.isTrue(items[0].score > items[1].score);
  });

  it("should remove consecutive items from the same domain", () => {
    let items = baseline.score(fakeUrls);
    assert.equal(items.length, 6);
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
});

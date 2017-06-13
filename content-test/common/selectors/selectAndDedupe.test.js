const {selectAndDedupe, dedupeOne} = require("common/selectors/selectAndDedupe");

describe("dedupeOne", () => {
  const urlToSite = url => ({url, hostname: url});

  it("should dedupe items by hostname", () => {
    const result = dedupeOne([
      "http://www.mozilla.org",
      "http://www.firefox.org",
      "http://www.mozilla.org"
    ].map(urlToSite));
    assert.lengthOf(result, 2);
    assert.deepEqual(result[0].url, "http://www.mozilla.org");
    assert.deepEqual(result[1].url, "http://www.firefox.org");
  });
});

describe("selectAndDedupe", () => {
  const urlToSite = url => ({url});

  it("should dedupe items", () => {
    const result = selectAndDedupe([
      {sites: [{url: "http://www.mozilla.org"}]},
      {sites: [{url: "http://www.mozilla.org"}, {url: "http://www.firefox.org"}]},
      {sites: [{url: "http://www.mozilla.org"}, {url: "http://www.firefox.org"}, {url: "http://www.blah.org"}]}
    ]);
    assert.lengthOf(result, 3);
    assert.deepEqual(result[0], [{url: "http://www.mozilla.org"}]);
    assert.deepEqual(result[1], [{url: "http://www.firefox.org"}]);
    assert.deepEqual(result[2], [{url: "http://www.blah.org"}]);
  });
  it("should slice the results based on `max` argument (defaults should not be added)", () => {
    const result = selectAndDedupe([
      {
        sites: ["http://www.mozilla.org", "http://www.firefox.com"].map(urlToSite),
        max: 1,
        defaults: ["http://foo.com"].map(urlToSite)
      },
      {sites: []}
    ]);

    assert.equal(result[0].length, 1);
    assert.equal(result[0][0].url, "http://www.mozilla.org");
  });
  it("should append defaults if result length is under the specified limit", () => {
    const defaults = ["http://foo.com", "http://bar.com"].map(urlToSite);
    const result = selectAndDedupe([
      {
        sites: ["http://www.mozilla.org", "http://www.firefox.com"].map(urlToSite),
        max: 5,
        defaults
      },
      {sites: []}
    ]);
    assert.equal(result[0].length, 4);
  });
  it("should remove duplicates between the existing items and the defaults", () => {
    const defaults = ["http://foo.com", "http://bar.com"].map(urlToSite);
    const result = selectAndDedupe([
      {
        sites: ["http://www.mozilla.org", "http://foo.com"].map(urlToSite),
        max: 5,
        defaults
      },
      {sites: []}
    ]);
    assert.equal(result[0].length, 3);
    assert.deepEqual(result[0], ["http://www.mozilla.org", "http://foo.com", "http://bar.com"].map(urlToSite));
  });
  it("should slice the results based on `max` argument (combined with defaults)", () => {
    const defaults = ["http://foo.com", "http://bar.com"].map(urlToSite);
    const result = selectAndDedupe([
      {
        sites: ["http://www.mozilla.org", "http://www.firefox.com"].map(urlToSite),
        max: 3,
        defaults
      },
      {sites: []}
    ]);

    assert.equal(result[0].length, 3);
  });
});

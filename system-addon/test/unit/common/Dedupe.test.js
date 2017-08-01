const {Dedupe} = require("common/Dedupe.jsm");

describe("Dedupe", () => {
  let instance;
  const urlToSite = url => ({url});

  it("should create an instance with default comparators", () => {
    instance = new Dedupe();
    const websites = [
      "http://www.mozilla.org",
      "http://www.firefox.org",
      "http://www.mozilla.org"
    ];

    const result = instance.collection(websites);

    assert.lengthOf(result, 2);
  });

  describe("collection", () => {
    it("should dedupe items by hostname", () => {
      const dedupeKey = url => url.url;
      instance = new Dedupe(dedupeKey);
      const websites = [
        "http://www.mozilla.org",
        "http://www.firefox.org",
        "http://www.mozilla.org"
      ].map(urlToSite);

      const result = instance.collection(websites);

      assert.lengthOf(result, 2);
      assert.deepEqual(result[0].url, "http://www.mozilla.org");
      assert.deepEqual(result[1].url, "http://www.firefox.org");
    });
    it("should keep pinned items", () => {
      const dedupeKey = url => url.hostname;
      const compareFn = (storedSite, newSite) => newSite.isPinned;
      instance = new Dedupe(dedupeKey, compareFn);
      const sites = [{
        url: "http://www.mozilla.org",
        hostname: "mozilla",
        isPinned: true
      }, {
        url: "http://www.mozilla.org/about",
        hostname: "mozilla"
      }];

      const result = instance.collection(sites);

      assert.lengthOf(result, 1);
      assert.deepEqual(result[0], sites[0]);
    });
    it("should keep pinned items", () => {
      const dedupeKey = url => url.hostname;
      const compareFn = (storedSite, newSite) => newSite.isPinned;
      instance = new Dedupe(dedupeKey, compareFn);
      const sites = [{
        url: "http://www.mozilla.org",
        hostname: "mozilla"
      }, {
        url: "http://www.mozilla.org/about",
        hostname: "mozilla",
        isPinned: true
      }];

      const result = instance.collection(sites);

      assert.lengthOf(result, 1);
      assert.deepEqual(result[0], sites[1]);
    });
  });
});

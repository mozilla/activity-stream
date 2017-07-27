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

  describe("one", () => {
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
  });
});

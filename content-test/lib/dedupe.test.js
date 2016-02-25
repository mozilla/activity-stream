const {createDedupeKey, innerDedupe} = require("lib/dedupe");
const {assert} = require("chai");
const urlParse = require("url-parse");

function createSite(url) {
  return {url, parsedUrl: urlParse(url)};
}

describe("createDedupeKey", () => {
  it("should return null if parsedUrl is missing", () => {
    assert.isNull(createDedupeKey({url: ""}));
  });
  it("should create a key for a url", () => {
    const site = createSite("http://facebook.com");
    assert.equal(createDedupeKey(site), "facebook.com");
  });
  it("should ignore www.", () => {
    const site = createSite("http://www.facebook.com");
    assert.equal(createDedupeKey(site), "facebook.com");
  });
  it("should not replace www. if not the subdomain", () => {
    const site = createSite("http://facebook.www.com");
    assert.equal(createDedupeKey(site), "facebook.www.com");
  });
  it("should include the querystring", () => {
    const site = createSite("https://facebook.com?foo=bar");
    assert.equal(createDedupeKey(site), "facebook.com?foo=bar");
  });
  it("should strip a trailing /", () => {
    const site = createSite("https://facebook.com/?foo=bar");
    assert.equal(createDedupeKey(site), "facebook.com?foo=bar");
  });
  it("should include the path", () => {
    const site = createSite("http://facebook.com/foo/bar");
    assert.equal(createDedupeKey(site), "facebook.com/foo/bar");
  });
});

describe("innerDedupe", () => {
  it("should dedupe sites", () => {
    const sites = [
      "http://facebook.com",
      "http://facebook.com",
      "http://www.facebook.com",
      "http://facebook.com/",
      "https://facebook.com"
    ].map(createSite);
    const result = [
      "http://facebook.com"
    ].map(createSite);
    assert.deepEqual(innerDedupe(sites), result);
  });
  it("should not ignore paths and querystrings", () => {
    const sites = [
      "http://facebook.com",
      "http://facebook.com/foo",
      "http://facebook.com?bar=bar"
    ].map(createSite);
    assert.deepEqual(innerDedupe(sites), sites);
  });
});

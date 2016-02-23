const {assert} = require("chai");
const {createFilter, urlFilter, siteFilter} = require("lib/filters");

const fakeData = {
  get validUrls() {
    return [
      {url: "http://foo.com"},
      {url: "https://foo.org"},
      {url: "HttP://blah.com"}
    ];
  },
  get validSite() {
    return {url: "http://foo.com", description: "blah", title: "blah"};
  }
};

describe("createFilter", () => {
  it("should include all items if filters return true", () => {
    const f = createFilter([() => true]);
    const testData = [1, 2, 3];
    assert.deepEqual(testData.filter(f), testData);
  });
  it("should remove all items if one filter returns false", () => {
    const f = createFilter([() => true, () => false, () => true]);
    const testData = [1, 2, 3];
    assert.deepEqual(testData.filter(f), []);
  });
  it("should test individual items", () => {
    const f = createFilter([item => item === 2]);
    const testData = [1, 2, 3];
    assert.deepEqual(testData.filter(f), [2]);
  });
});

describe("urlFilter", () => {
  it("should pass valid urls", () => {
    assert.deepEqual(fakeData.validUrls.filter(urlFilter), fakeData.validUrls);
  });
  it("should require truthly urls", () => {
    const urls = [{url: null}, {}, {url: ""}];
    assert.deepEqual(urls.filter(urlFilter), []);
  });
  it("should remove urls > 100 characters", () => {
    const urls = [{url: "http://" + new Array(100).join("d") + ".com"}];
    assert.deepEqual(urls.filter(urlFilter), []);
  });
  it("should remove urls that do not start with http/https", () => {
    const urls = [
      {url: "places://foo/asdasd"},
      {url: "ftp://asdasdads.com"},
      {url: "garbage://asdasd.com"},
    ];
    assert.deepEqual(urls.filter(urlFilter), []);
  });
  it("should remove localhost urls, but not urls that start with localhost", () => {
    const urls = [
      {url: "http://localhost:4040"},
      {url: "https://localhost:9999"},
      {url: "HTTP://LOCALHOST"},
      {url: "http://127.0.0.1:8000"},
      {url: "http://0.0.0.0"},
      {url: "http://localhost-foo.com"}
    ];
    assert.deepEqual(urls.filter(urlFilter), [{url: "http://localhost-foo.com"}]);
  });
});

describe("siteFilter", () => {
  it("should pass valid sites", () => {
    assert.deepEqual([fakeData.validSite].filter(siteFilter), [fakeData.validSite]);
  });
  it("should remove sites that have errors from embedly", () => {
    const validSite = fakeData.validSite;
    const sites = [
      Object.assign({}, validSite, {error_message: "there was an error"}),
      Object.assign({}, validSite, {error_code: 400}),
      Object.assign({}, validSite, {error_code: 400, type: "error", error_message: "there was an error"})
    ];
    assert.deepEqual(sites.filter(siteFilter), []);
  });
});

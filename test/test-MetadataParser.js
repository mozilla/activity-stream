const test = require("sdk/test");
const {
  getDocumentObject,
  tempFixUrls,
  parseHTMLText,
  parseByURL
} = require("lib/MetadataParser");

const TEST_HTML = `<html>
  <head>
    <title>Test Page</title>
    <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
  </head>
</html>`;

exports["test getDocumentObject"] = assert => {
  const result = getDocumentObject(TEST_HTML);
  assert.ok(result, "creates a document object");
  assert.equal(result.querySelector("title").textContent, "Test Page", "document.querySelector works");
};

exports["test tempFixUrls"] = assert => {
  const result = tempFixUrls({
    image_url: "blah.jpg",
    icon_url: "//blah.com/favicon.png",
    url: "http://foo.com"
  }, "//foo.com");
  assert.ok(result, "returns a metadata object");
  assert.equal(result.image_url, "https://foo.com/blah.jpg", "resolves image_url, relative urls");
  assert.equal(result.icon_url, "https://blah.com/favicon.png", "resolves image_url, protocol relative urls");
  assert.equal(result.url, "http://foo.com/", "resolves url, leaves absolute urls alone");
};

exports["test parseHTMLText"] = function*(assert) {
  const result = yield parseHTMLText(TEST_HTML, "https://foo.com");
  assert.ok(result, "Returns a metadata object");
  assert.equal(result.title, "Test Page", "title is Test Page");
  assert.equal(result.favicon_url, "https://foo.com/favicon.ico", "favicon is https://foo.com/favicon.ico");
};

exports["test parseByURL"] = function*(assert) {
  const result = yield parseByURL("http://example.com");
  assert.ok(result, "Returns a metadata object");
  assert.ok(result.url, "http://example.com");
};

test.run(exports);

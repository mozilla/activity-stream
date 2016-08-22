/* globals assert, require */
"use strict";
const createMetadataParser = require("inject!addon/MetadataParser");
const TEST_HTML = `<html>
  <head>
    <title>Test Page</title>
    <link rel="shortcut icon" type="image/x-icon" href="favicon.ico" />
  </head>
 </html>`;

describe("MetadataParser", () => {
  let metadataParser;
  function setup() {
    const mockPreviewProvider = {processLinks(link) {
      return link.map(link => {return Object.assign({}, link, {cache_key: link.url, places_url: link.url});});
    }};
    const {MetadataParser} = createMetadataParser({
      "addon/vendor.bundle": {
        PageMetadataParser: {getMetadata(doc) { return doc;}},
        url: {resolve(url) {return url;}}
      },
      "chrome": {
        Cc: {"@mozilla.org/xmlextras/domparser;1": {createInstance: function() {return new DOMParser();}}},
        Ci: {nsIDOMParser: {}}
      }
    });
    metadataParser = new MetadataParser(mockPreviewProvider);
  }

  beforeEach(() => setup());

  it("should get the document object", () => {
    const result = metadataParser._getDocumentObject(TEST_HTML);
    assert.ok(result);
    assert.equal(result.querySelector("title").textContent, "Test Page");
  });

  // it("should format the data properly", () => {
  //   let originalUrl = "https://www.foo.com";
  //   let incomingData = {
  //     "description": "Some description",
  //     "icon_url": "//www.foo.com/icon.png",
  //     "image_url": "//www.foo.com/image.png",
  //     "title": "Some title",
  //     "url": "https:///"
  //   };
  //   let formattedData = metadataParser._formatData(incomingData, originalUrl)[0];
  //   // format the data so the MetadataStore can store it properly
  //   assert.equal(formattedData.images[0].url, "https://www.foo.com/image.png");
  //   assert.equal(formattedData.favicon_url, "https://www.foo.com/icon.png");
  //   assert.equal(formattedData.url, originalUrl);
  //
  //   // removed the unusable properties
  //   assert.equal(formattedData.icon_url, undefined);
  //   assert.equal(formattedData.image_url, undefined);
  //
  //   // added the fields from PreviewProvider's processLinks
  //   assert.ok(formattedData.cache_key);
  //   assert.ok(formattedData.places_url);
  // });
  //
  // it("should parse HTML text", () => {
  //   return metadataParser.parseHTMLText(TEST_HTML, "https://foo.com").then(result => {
  //     assert.ok(result);
  //     console.log(result);
  //     assert.equal(result.title, "Test Page");
  //     assert.equal(result.favicon_url, "https://foo.com/favicon.ico");
  //   });
  // });
});

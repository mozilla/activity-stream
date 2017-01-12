/* globals require, exports */

"use strict";

const {before, after} = require("sdk/test/utils");
const {PageScraper} = require("addon/PageScraper");
const DUMMY_PARSED_METADATA = {
  metadata: "Some dummy metadata",
  title: "Some dummy title",
  favicon_url: "Some dummy favicon_url"
};

let gMetadataStore = [];
let gPageScraper;
let parseCallCount;

const mockPreviewProvider = {
  processLinks(link) {
    return link.map(link => Object.assign({}, link, {cache_key: link.url, places_url: link.url}));
  },
  asyncLinkExist(url) {
    let doesExists = false;
    if (gMetadataStore[0]) {
      gMetadataStore.forEach(item => {
        if (item.url === url) {
          doesExists = true;
        }
      });
    }
    return doesExists;
  },
  processAndInsertMetadata(metadata, source) {
    const processedLink = this.processLinks([metadata]);
    this.insertMetadata(processedLink, source);
  },
  insertMetadata(metadata, source) {
    const linkToInsert = Object.assign({}, metadata[0], {metadata_source: source});
    gMetadataStore.push(linkToInsert);
  }
};
const mockTabTracker = {generateEvent() {}, handlePerformanceEvent() {}};

exports.test_parse_and_save_HTML = function*(assert) {
  gPageScraper._asyncSaveMetadata = link => {
    mockPreviewProvider.processAndInsertMetadata(link, "Local");
  };
  let metadataObj = {
    url: "https://www.foo.com",
    metadata: DUMMY_PARSED_METADATA.metadata,
    metadata_source: "Local"
  };
  // attempt to parse and save a page and make sure we parsed once
  yield gPageScraper._parseAndSave(DUMMY_PARSED_METADATA, metadataObj.url);
  assert.equal(parseCallCount, 1, "we parsed the HTML once");
};

exports.test_properly_save_metadata = function*(assert) {
  const metadataObj = {
    url: "https://www.foo.com",
    metadata: DUMMY_PARSED_METADATA.metadata,
    metadata_source: "Local"
  };
  const metadataToInsert = Object.assign({}, metadataObj, DUMMY_PARSED_METADATA);
  // attempt to parse and save a page
  yield gPageScraper._asyncSaveMetadata(metadataToInsert);
  const linksInserted = gMetadataStore[0];

  // make sure we inserted in the DB
  assert.equal(gMetadataStore.length, 1, "successfully inserted item into DB");
  assert.equal(linksInserted.url, metadataObj.url, "parsed the correct url");
  assert.equal(linksInserted.metadata, metadataObj.metadata, "extracted the correct metadata");
  assert.equal(linksInserted.metadata_source, metadataObj.metadata_source, "attached the correct metadata_source");

  // attempt to save the same page as above and be unsuccessful
  yield gPageScraper._asyncSaveMetadata(metadataToInsert);
  assert.equal(gMetadataStore.length, 1, "we did not re-insert the same metadata");
};

exports.test_fetch_links_parses_HTML_once = function*(assert) {
  gPageScraper._asyncSaveMetadata = link => {
    mockPreviewProvider.processAndInsertMetadata(link, "Local");
  };
  let link = [{url: "https://www.foo.com"}];

  // attempt to parse and save a page and make sure we parsed once
  yield gPageScraper.asyncFetchLinks(link);
  assert.equal(parseCallCount, 1, "we parsed the HTML once");

  // attempt to parse ans save the same page as above
  // we should NOT have parsed the page a second time
  yield gPageScraper.asyncFetchLinks(link);
  assert.equal(parseCallCount, 1, "we did not parse the same link again");
};

exports.test_fetch_links_locally_and_save_them = function*(assert) {
  // we don't care about checking if the link should be saved - we want to save it
  gPageScraper._asyncSaveMetadata = link => {
    mockPreviewProvider.processAndInsertMetadata(link, "Local");
  };
  const link = [{"url": "https://www.example.com"}];

  yield gPageScraper.asyncFetchLinks(link);
  let linksInserted = gMetadataStore[0];

  // make sure we inserted in the DB
  assert.equal(gMetadataStore.length, 1, "successfully inserted item into DB");
  assert.equal(linksInserted.url, link[0].url, "parsed the correct url");
  assert.equal(linksInserted.metadata, DUMMY_PARSED_METADATA.metadata, "extracted the correct metadata");
  assert.equal(linksInserted.metadata_source, "Local", "attached the correct metadata_source");
};

exports.test_no_metadata_returned = function*(assert) {
  // the DB should be empty to start
  const noMetadata = {title: null, favicon_url: null, url: "https://www.example.com"};
  assert.equal(gMetadataStore[0], undefined, "sanity check that our store is empty");

  // try to insert some empty metadata and make sure that it didn't get inserted
  yield gPageScraper._asyncSaveMetadata(noMetadata);
  assert.equal(gMetadataStore[0], undefined, "we didn't insert the page with no metadata");

  // insert some proper metadata and check that it correctly inserted
  yield gPageScraper._asyncSaveMetadata(DUMMY_PARSED_METADATA);
  assert.equal(gMetadataStore[0].metadata, DUMMY_PARSED_METADATA.metadata, "we did insert a page with metadata");
};

exports.test_parse_html_rejects = function(assert) {
  const error = new Error("Parsing Error");
  // force the metadata parser to throw an execption
  gPageScraper._metadataParser = {
    parseHTMLText() {
      throw error;
    }
  };
  // the DB should be empty to start
  assert.equal(gMetadataStore[0], undefined, "sanity check that our store is empty");

  // try to insert some empty metadata and make sure that it didn't get inserted
  try {
    gPageScraper._metadataParser.parseHTMLText({});
    assert.ok(false, "only called if the parse was successful");
  } catch (e) {
    assert.equal(error, e, "the parsing exception was caught");
  }

  assert.equal(gMetadataStore[0], undefined, "we didn't insert the page with no metadata");
};

exports.test_blacklist = function(assert) {
  let isAccepted;
  let url = "https://www.accepted.com";
  isAccepted = gPageScraper._blacklistFilter(url);
  assert.equal(isAccepted, true, `${url} does not exist in the blacklist`);

  url = "about:addons";
  isAccepted = gPageScraper._blacklistFilter(url);
  assert.equal(isAccepted, false, `${url} exists in the blacklist`);

  url = "https://localhost:8080";
  isAccepted = gPageScraper._blacklistFilter(url);
  assert.equal(isAccepted, false, `${url} exists in the blacklist`);
};

exports.test_compute_image_sizes = function*(assert) {
  let metadataObj = {
    url: "https://www.hasAnImage.com",
    images: [{url: "data:image;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAA"}] // a 1x1 pixel image
  };
  // compute the image sizes of the metadata
  let newImage = yield gPageScraper._computeImageSize(metadataObj);
  assert.equal(newImage[0].url, metadataObj.images[0].url, "the url was intact");
  assert.equal(newImage[0].width, 1, "computed the correct image width");
  assert.equal(newImage[0].height, 1, "computed the correct image height");

  // force the image to reject by giving it a null src
  metadataObj.images[0].url = null;
  let error = false;
  try {
    newImage = yield gPageScraper._computeImageSize(metadataObj);
  } catch (e) {
    error = true;
  }
  assert.deepEqual(error, true, "we rejected the when the image fails to load");

  // when the metadata has no images, don't compute any sizes for it
  metadataObj.images = [];
  newImage = yield gPageScraper._computeImageSize(metadataObj);
  assert.deepEqual(newImage, [], "we did not compute image size when given no image");
};

before(exports, () => {
  parseCallCount = 0;
  gPageScraper = new PageScraper(mockPreviewProvider, mockTabTracker, {framescriptPath: ""});
  gPageScraper.init();
  gPageScraper._metadataParser = {
    parseHTMLText(raw, url) {
      parseCallCount++;
      return {images: [], title: raw.title, favicon_url: raw.favicon_url, url, metadata: raw.metadata, cache_key: url};
    }
  };
  gPageScraper._fetchContent = function() {return DUMMY_PARSED_METADATA;};
});

after(exports, () => {
  gPageScraper.uninit();
  parseCallCount = 0;
  gMetadataStore = [];
});

require("sdk/test").run(exports);

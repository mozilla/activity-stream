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

exports.test_parse_and_save_HTML_only_once = function*(assert) {
  let metadataObj = {
    url: "https://www.foo.com",
    metadata: DUMMY_PARSED_METADATA.metadata,
    metadata_source: "Local"
  };
  // attempt to parse and save a page
  yield gPageScraper._asyncParseAndSave(DUMMY_PARSED_METADATA, metadataObj.url);
  let linksInserted = gMetadataStore[0];

  // make sure we parsed and saved it in the DB
  assert.equal(parseCallCount, 1, "we parsed the HTML once");
  assert.equal(gMetadataStore.length, 1, "successfully inserted item into DB");
  assert.equal(linksInserted.url, metadataObj.url, "parsed the correct url");
  assert.equal(linksInserted.metadata, metadataObj.metadata, "extracted the correct metadata");
  assert.equal(linksInserted.metadata_source, metadataObj.metadata_source, "attached the correct metadata_source");

  // attempt to parse and save the same page as above
  yield gPageScraper._asyncParseAndSave(DUMMY_PARSED_METADATA, metadataObj.url);

  // we should NOT have parsed the page a second time, and the DB should be untouched
  assert.equal(parseCallCount, 1, "we did not parse the same link again");
  assert.deepEqual(gMetadataStore[0], linksInserted, "we did not insert the same link again");
};

exports.test_no_metadata_returned = function*(assert) {
  // the DB should be empty to start
  const noMetadata = {title: null, favicon_url: null, url: "https://www.example.com"};
  assert.equal(gMetadataStore[0], undefined, "sanity check that our store is empty");

  // try to insert some empty metadata and make sure that it didn't get inserted
  yield gPageScraper._asyncParseAndSave(noMetadata);
  assert.equal(gMetadataStore[0], undefined, "we didn't insert the page with no metadata");

  // insert some proper metadata and check that it correctly inserted
  yield gPageScraper._asyncParseAndSave(DUMMY_PARSED_METADATA);
  assert.equal(gMetadataStore[0].metadata, DUMMY_PARSED_METADATA.metadata, "we did insert a page with metadata");
};

exports.test_parse_html_rejects = function*(assert) {
  // force the metadata parser to throw an execption
  gPageScraper._metadataParser = {
    parseHTMLText() {
      return Promise.reject();
    }
  };
  // the DB should be empty to start
  assert.equal(gMetadataStore[0], undefined, "sanity check that our store is empty");

  // try to insert some empty metadata and make sure that it didn't get inserted
  yield gPageScraper._asyncParseAndSave({});
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
      return Promise.resolve({images: [], title: raw.title, favicon_url: raw.favicon_url, url, metadata: raw.metadata, cache_key: url});
    }
  };
});

after(exports, () => {
  gPageScraper.uninit();
  parseCallCount = 0;
  gMetadataStore = [];
});

require("sdk/test").run(exports);

/* globals assert, require */
"use strict";
const createPageScraper= require("inject!addon/PageScraper");

describe("MetadataParser", () => {
  let pageScraper;
  function setup() {
    let mockPreviewProvider = {processLinks(link) {return [link];}, asyncFindItemsInDB(link) {return [link];}};
    let mockMetadataStore = {
      asyncConnect() {return Promise.resolve();},
      asyncReset() {return Promise.resolve();},
      asyncClose() {return Promise.resolve();},
      asyncInsert() {return Promise.resolve();},
      asyncGetMetadataByCacheKey() {return Promise.resolve([]);}
    };
    const {PageScraper} = createPageScraper();
    pageScraper = new PageScraper(mockPreviewProvider, mockMetadataStore);
  }

  beforeEach(() => setup());

  it("should only parse HTML and get metadata if it's not in the DB already", () => {

  });

  it("should send a 'page-scraper-page-parsed' notification once complete", () => {

  });

  it("should check if the link exists in the DB", () => {

  });

  it("should load a framescript", () => {

  });

  it("should listen for the correct 'page-scraper-message' message", () => {

  });
});

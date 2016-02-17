const assert = require("chai").assert;
const TestUtils = require("react-addons-test-utils");
const React = require("react");
const ReactDOM = require("react-dom");

const TopSites = require("components/TopSites/TopSites");
const SiteIcon = require("components/SiteIcon/SiteIcon");

const fakeProps = {
  sites: require("test/test-utils").mockData.TopSites.rows.slice(0, 2)
};

describe("TopSites", () => {

  let node;
  let topSites;
  let el;

  beforeEach(() => {
    node = document.createElement("div");
    topSites = ReactDOM.render(<TopSites {...fakeProps} />, node);
    el = ReactDOM.findDOMNode(topSites);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("valid sites", () => {
    it("should create TopSites", () => {
      assert.instanceOf(topSites, TopSites);
    });

    it("should have 2 SiteIcons", () => {
      const siteIcons = TestUtils.scryRenderedComponentsWithType(topSites, SiteIcon);
      assert.equal(siteIcons.length, fakeProps.sites.length);
      assert.include(siteIcons[0].props.site, fakeProps.sites[0]);
      assert.include(siteIcons[1].props.site, fakeProps.sites[1]);
    });

    it("should have title elements with provider_name", () => {
      const titleEls = el.querySelectorAll(".tile-title");
      assert.equal(titleEls.length, fakeProps.sites.length);
      assert.equal(titleEls[0].innerHTML, fakeProps.sites[0].provider_name);
      assert.equal(titleEls[1].innerHTML, fakeProps.sites[1].provider_name);
    });

    it("should have the right links", () => {
      const linkEls = el.querySelectorAll(".tile:not(.tile-placeholder)");
      assert.equal(linkEls.length, fakeProps.sites.length);
      assert.include(linkEls[0].href, fakeProps.sites[0].url);
      assert.include(linkEls[1].href, fakeProps.sites[1].url);
    });
  });

});

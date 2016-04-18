const assert = require("chai").assert;
const TestUtils = require("react-addons-test-utils");
const React = require("react");
const ReactDOM = require("react-dom");
const {overrideConsoleError, renderWithProvider} = require("test/test-utils");

const ConnectedTopSites = require("components/TopSites/TopSites");
const {TopSites} = ConnectedTopSites;
const DeleteMenu = require("components/DeleteMenu/DeleteMenu");
const SiteIcon = require("components/SiteIcon/SiteIcon");

const fakeProps = {
  sites: [
    {
      url: "http://foo.com",
      favicon_url: "http://foo.com/favicon.ico"
    },
    {
      url: "http://bar.com",
    }
  ]
};

describe("TopSites", () => {

  let topSites;
  let el;

  beforeEach(() => {
    topSites = renderWithProvider(<TopSites {...fakeProps} />);
    el = ReactDOM.findDOMNode(topSites);
  });

  it("should not throw if missing props", () => {
    assert.doesNotThrow(() => {
      const restore = overrideConsoleError();
      renderWithProvider(<TopSites sites={[{}]} />);
      restore();
    });
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

    it("should have the right links", () => {
      const linkEls = el.querySelectorAll(".tile:not(.tile-placeholder)");
      assert.equal(linkEls.length, fakeProps.sites.length);
      assert.include(linkEls[0].href, fakeProps.sites[0].url);
      assert.include(linkEls[1].href, fakeProps.sites[1].url);
    });

    it("should show delete menu when delete button is clicked", () => {
      const button = TestUtils.scryRenderedDOMComponentsWithClass(topSites, "tile-close-icon")[0];
      TestUtils.Simulate.click(button);
      const deleteMenu = TestUtils.scryRenderedComponentsWithType(topSites, DeleteMenu)[0];
      assert.equal(deleteMenu.props.visible, true);
    });
  });

});

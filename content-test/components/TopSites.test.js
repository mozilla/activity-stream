const TestUtils = require("react-addons-test-utils");
const React = require("react");
const ReactDOM = require("react-dom");
const {overrideConsoleError, renderWithProvider} = require("test/test-utils");
const ConnectedTopSites = require("components/TopSites/TopSites");
const {TopSites, TopSitesItem} = ConnectedTopSites;
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const SiteIcon = require("components/SiteIcon/SiteIcon");

const fakeProps = {
  sites: [
    {
      url: "http://foo.com",
      favicon_url: "http://foo.com/favicon.ico"
    },
    {url: "http://bar.com"}
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
      const linkEls = el.querySelectorAll(".tile");
      assert.equal(linkEls.length, fakeProps.sites.length);
      assert.include(linkEls[0].href, fakeProps.sites[0].url);
      assert.include(linkEls[1].href, fakeProps.sites[1].url);
    });

    it("should show delete menu when delete button is clicked", () => {
      const button = ReactDOM.findDOMNode(TestUtils.scryRenderedComponentsWithType(topSites, LinkMenuButton)[0]);
      TestUtils.Simulate.click(button);
      const menu = TestUtils.scryRenderedComponentsWithType(topSites, LinkMenu)[0];
      assert.equal(menu.props.visible, true);
    });

    it("should make the tile active when link menu button is clicked", () => {
      const button = ReactDOM.findDOMNode(TestUtils.scryRenderedComponentsWithType(topSites, LinkMenuButton)[0]);
      TestUtils.Simulate.click(button);
      const tileOuter = el.querySelector(".tile-outer");
      assert.include(tileOuter.className, "active");
    });
  });
  describe("actions", () => {
    it("should fire a click event when an item is clicked", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "CLICK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "TOP_SITES");
          assert.equal(a.data.action_position, 0);
          done();
        }
      }
      topSites = renderWithProvider(<TopSites page={"NEW_TAB"} dispatch={dispatch} sites={fakeProps.sites} />);
      TestUtils.Simulate.click(TestUtils.scryRenderedComponentsWithType(topSites, TopSitesItem)[0].refs.topSiteLink);
    });
  });
});

const TestUtils = require("react-addons-test-utils");
const React = require("react");
const ReactDOM = require("react-dom");
const {faker, overrideConsoleError, renderWithProvider} = require("test/test-utils");
const ConnectedTopSites = require("components/TopSites/TopSites");
const {PlaceholderTopSitesItem, TopSites, TopSitesItem} = ConnectedTopSites;
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const {PlaceholderSiteIcon, SiteIcon} = require("components/SiteIcon/SiteIcon");
const {selectSiteProperties} = require("common/selectors/siteMetadataSelectors");
const fakeSiteWithImage = faker.createSite();

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

describe("TopSitesItem", () => {
  const fakeSite = fakeSiteWithImage;
  let instance;

  describe("valid site", () => {
    beforeEach(() => {
      instance = renderWithProvider(<TopSitesItem {...fakeSite} />);
    });

    it("should render a SiteIcon with appropriate props", () => {
      assert.instanceOf(instance.refs.icon, SiteIcon);
      assert.include(instance.refs.icon.props.site, fakeSite);
    });
  });

  describe("screenshot", () => {
    const siteWithScreenshot = Object.assign({}, fakeSiteWithImage, {screenshot: "cool.jpg"});
    beforeEach(() => {
      instance = renderWithProvider(<TopSitesItem showNewStyle={true} {...siteWithScreenshot} />);
    });
    it("should render a title", () => {
      assert.ok(instance.refs.title);
      assert.equal(instance.refs.title.textContent, selectSiteProperties(siteWithScreenshot).label);
    });
    it("should render the screenshot element with the right background image", () => {
      assert.ok(instance.refs.screenshot);
      assert.equal(instance.refs.screenshot.style.backgroundImage, "url(\"cool.jpg\")");
    });
    it("should add the .top-corner class to SiteIcon", () => {
      assert.include(instance.refs.icon.props.className, "top-corner");
    });
  });
});

describe("PlaceholderTopSitesItem", () => {
  let instance;
  let el;

  beforeEach(() => {
    instance = renderWithProvider(<PlaceholderTopSitesItem />);
    el = ReactDOM.findDOMNode(instance);
  });

  it("should have a .placeholder class", () => {
    assert(el.classList.contains("placeholder"));
  });

  it("should render a PlaceholderSiteIcon", () => {
    let icon = TestUtils.findRenderedComponentWithType(instance, PlaceholderSiteIcon);
    assert.notEqual(null, icon);
  });
});

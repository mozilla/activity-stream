const TestUtils = require("react-addons-test-utils");
const React = require("react");
const ReactDOM = require("react-dom");
const {faker, overrideConsoleError, renderWithProvider, mountWithIntl} = require("test/test-utils");
const ConnectedTopSites = require("components/TopSites/TopSites");
const {PlaceholderTopSitesItem, TopSites, TopSitesItem} = ConnectedTopSites;
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const {PlaceholderSiteIcon, SiteIcon} = require("components/SiteIcon/SiteIcon");
const fakeSiteWithImage = faker.createSite();
const {prettyUrl} = require("lib/utils");

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
  let wrapper;

  describe("valid site", () => {
    beforeEach(() => {
      instance = renderWithProvider(<TopSitesItem {...fakeSite} />);
    });

    it("should render a SiteIcon with appropriate props", () => {
      assert.instanceOf(instance.refs.icon, SiteIcon);
      assert.include(instance.refs.icon.props.site, fakeSite);
    });

    it("should not render the unpinButton for unpinned sites", () => {
      assert.isUndefined(instance.refs.unpinButton);
    });

    it("should render the unpinButton for pinned sites", () => {
      const pinnedSite = Object.assign({}, fakeSiteWithImage, {isPinned: true});
      instance = renderWithProvider(<TopSitesItem intl={{formatMessage: () => {}}} {...pinnedSite} />);
      assert.ok(instance.refs.unpinButton);
    });
  });

  describe("screenshot", () => {
    const siteWithScreenshot = Object.assign({}, fakeSiteWithImage, {screenshot: "cool.jpg"});
    beforeEach(() => {
      instance = renderWithProvider(<TopSitesItem showNewStyle={true} {...siteWithScreenshot} />);
    });
    it("should render a title", () => {
      assert.ok(instance.refs.title);
      assert.equal(instance.refs.title.textContent, prettyUrl(siteWithScreenshot));
    });
    it("should render the screenshot element with the right background image", () => {
      assert.ok(instance.refs.screenshot);
      assert.equal(instance.refs.screenshot.style.backgroundImage, "url(\"cool.jpg\")");
    });
    it("should add the .top-corner class to SiteIcon", () => {
      assert.include(instance.refs.icon.props.className, "top-corner");
    });
  });

  describe("edit mode", () => {
    beforeEach(() => {
      wrapper = mountWithIntl(<TopSitesItem editMode={true} {...fakeSite} />, {context: {}, childContextTypes: {}});
    });

    it("should render the component", () => {
      assert.ok(wrapper.find(TopSitesItem));
    });

    it("should render 3 buttons", () => {
      assert.equal(1, wrapper.ref("pinButton").length);
      assert.equal(1, wrapper.ref("editButton").length);
      assert.equal(1, wrapper.ref("dismissButton").length);
    });

    it("should render the pin button if site isn't pinned", () => {
      assert.equal(1, wrapper.ref("pinButton").length);
      assert.equal(0, wrapper.ref("unpinButton").length);
    });

    it("should render the unpin button if site is pinned", () => {
      const pinnedSite = Object.assign({}, fakeSiteWithImage, {isPinned: true});
      wrapper = mountWithIntl(<TopSitesItem editMode={true} {...pinnedSite} />, {context: {}, childContextTypes: {}});
      assert.equal(0, wrapper.ref("pinButton").length);
      assert.equal(1, wrapper.ref("unpinButton").length);
    });

    it("should fire a dismiss action when the dismiss button is clicked", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_BLOCK_URL") {
          assert.equal(a.data, fakeSite.url);
          done();
        }
      }
      wrapper = mountWithIntl(<TopSitesItem editMode={true} dispatch={dispatch} {...fakeSite} />, {context: {}, childContextTypes: {}});
      wrapper.ref("dismissButton").simulate("click");
    });

    it("should fire a pin action when the pin button is clicked", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_PIN_TOPSITE") {
          assert.equal(a.data.site.url, fakeSite.url);
          assert.equal(a.data.index, 7);
          done();
        }
      }
      wrapper = mountWithIntl(<TopSitesItem editMode={true} dispatch={dispatch} index={7} {...fakeSite} />, {context: {}, childContextTypes: {}});
      wrapper.ref("pinButton").simulate("click");
    });

    it("should fire an unpin action when the pin button is clicked", done => {
      const pinnedSite = Object.assign({}, fakeSiteWithImage, {isPinned: true});
      function dispatch(a) {
        if (a.type === "NOTIFY_UNPIN_TOPSITE") {
          assert.equal(a.data.site.url, pinnedSite.url);
          done();
        }
      }
      wrapper = mountWithIntl(<TopSitesItem editMode={true} dispatch={dispatch} {...pinnedSite} />, {context: {}, childContextTypes: {}});
      wrapper.ref("unpinButton").simulate("click");
    });

    it("should fire an unpin action when a pinned site is dismissed", done => {
      const pinnedSite = Object.assign({}, fakeSiteWithImage, {isPinned: true});
      function dispatch(a) {
        if (a.type === "NOTIFY_UNPIN_TOPSITE") {
          assert.equal(a.data.site.url, pinnedSite.url);
          done();
        }
      }
      wrapper = mountWithIntl(<TopSitesItem editMode={true} dispatch={dispatch} {...pinnedSite} />, {context: {}, childContextTypes: {}});
      wrapper.ref("dismissButton").simulate("click");
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

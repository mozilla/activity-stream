const ConnectedSpotlight = require("components/Spotlight/Spotlight");
const {PlaceholderSpotlightItem, Spotlight, SpotlightItem} = ConnectedSpotlight;
const getHighlightContextFromSite = require("common/selectors/getHighlightContextFromSite");
const {selectSiteProperties} = require("common/selectors/siteMetadataSelectors");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const {PlaceholderHighlightContext, HighlightContext} = require("components/HighlightContext/HighlightContext");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {shallow} = require("enzyme");
const {SiteIcon} = require("components/SiteIcon/SiteIcon");
const {mockData, mountWithProvider, faker, renderWithProvider} = require("test/test-utils");
const fakeSpotlightItems = mockData.Highlights.rows;
const fakeSiteWithImage = faker.createSite();

fakeSiteWithImage.bestImage = fakeSiteWithImage.images[0];

describe("Spotlight", () => {
  let instance;
  let el;

  describe("valid sites", () => {
    beforeEach(() => {
      instance = renderWithProvider(<Spotlight sites={fakeSpotlightItems} />);
      el = ReactDOM.findDOMNode(instance);
    });

    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render a SpotlightItem for each item", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      assert.equal(children.length, 3);
    });
  });

  describe("actions", () => {
    it("should fire a click event an item is clicked", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "CLICK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "FEATURED");
          assert.equal(a.data.action_position, 0);
          assert.equal(a.data.metadata_source, "EmbedlyTest");
          assert.equal(a.data.highlight_type, fakeSpotlightItems[0].type);
          done();
        }
      }
      instance = renderWithProvider(<Spotlight page={"NEW_TAB"} dispatch={dispatch} sites={fakeSpotlightItems} />);
      TestUtils.Simulate.click(TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem)[0].refs.link);
    });
  });
});

describe("SpotlightItem", () => {
  const fakeSite = fakeSiteWithImage;
  let instance;
  let el;

  describe("valid sites", () => {
    beforeEach(() => {
      instance = renderWithProvider(<SpotlightItem {...fakeSite} />);
      el = ReactDOM.findDOMNode(instance);
    });

    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render the icon", () => {
      assert.instanceOf(instance.refs.icon, SiteIcon);
      assert.include(instance.refs.icon.props.site, fakeSite);
    });
    it("should render the image", () => {
      assert.include(instance.refs.image.style.backgroundImage, fakeSite.bestImage.url);
    });
    it("should render the url link", () => {
      const linkEl = instance.refs.link;
      assert.include(linkEl.href, fakeSite.url);
    });
    it("should render the title", () => {
      assert.equal(instance.refs.title.textContent, fakeSite.title);
    });
    it("should render the label (e.g. foo.com)", () => {
      assert.equal(instance.refs.label.textContent, selectSiteProperties(fakeSite).label);
    });
    it("should render the description", () => {
      assert.include(instance.refs.description.textContent, fakeSite.description);
    });
    it("should show link menu when link button is pressed", () => {
      const button = ReactDOM.findDOMNode(TestUtils.findRenderedComponentWithType(instance, LinkMenuButton));
      TestUtils.Simulate.click(button);
      const menu = TestUtils.findRenderedComponentWithType(instance, LinkMenu);
      assert.equal(menu.props.visible, true);
    });
    it("should render a HighlightContext with the right props", () => {
      const site = Object.assign({}, fakeSiteWithImage, {bookmarkDateCreated: Date.now()});
      let wrapper = mountWithProvider(<SpotlightItem {...site} />);

      const hc = wrapper.find(HighlightContext);

      const props = getHighlightContextFromSite(site);
      assert.equal(hc.props().type, "bookmark");
      assert.deepEqual(hc.props(), props);
    });
    it("should render the label without the eTLD if eTLD is specified", () => {
      let site = Object.assign({}, fakeSite, {"url": "https://google.ca", "eTLD": "ca"});
      assert.equal(renderWithProvider(<SpotlightItem {...site} />).refs.label.textContent, "google");
    });
  });
});

describe("PlaceholderSpotlightItem", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<PlaceholderSpotlightItem />);
  });

  it("should have a .placeholder class", () => {
    assert(wrapper.hasClass("placeholder"));
  });
  it("should render a PlaceholderHighlightContext", () => {
    assert.lengthOf(wrapper.find(PlaceholderHighlightContext), 1);
  });
  it("should render a .spotlight-icon", () => {
    assert.lengthOf(wrapper.find(".spotlight-icon"), 1);
  });
});

const {assert} = require("chai");
const ConnectedSpotlight = require("components/Spotlight/Spotlight");
const {Spotlight, SpotlightItem} = ConnectedSpotlight;
const getHighlightContextFromSite = require("selectors/getHighlightContextFromSite");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const HighlightContext = require("components/HighlightContext/HighlightContext");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const {mockData, faker, renderWithProvider} = require("test/test-utils");
const fakeSpotlightItems = mockData.Spotlight.rows;
const fakeSiteWithImage = faker.createSite();

fakeSiteWithImage.bestImage = fakeSiteWithImage.images[0];

describe("Spotlight", function() {
  let instance;
  let el;
  beforeEach(() => {
    instance = renderWithProvider(<Spotlight sites={fakeSpotlightItems} />);
    el = ReactDOM.findDOMNode(instance);
  });

  describe("valid sites", () => {
    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render a SpotlightItem for each item", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      assert.equal(children.length, 3);
    });
  });

  describe("actions", () => {
    it("should fire a click event an item is clicked without a url or recommender type if it is not a recommendation", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "CLICK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "FEATURED");
          assert.equal(a.data.action_position, 0);
          assert.equal(a.data.url, null);
          assert.equal(a.data.recommender_type, null);
          done();
        }
      }
      instance = renderWithProvider(<Spotlight page={"NEW_TAB"} dispatch={dispatch} sites={fakeSpotlightItems} />);
      TestUtils.Simulate.click(TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem)[0].refs.link);
    });
    it("should fire a click event an item is clicked with url and recommender type when site is a recommendation", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "CLICK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "FEATURED");
          assert.equal(a.data.action_position, 0);
          assert.equal(a.data.url, fakeRecommendation.url);
          assert.equal(a.data.recommender_type, fakeRecommendation.recommender_type);
          done();
        }
      }
      let fakeSitesWithRecommendation = fakeSpotlightItems;
      let fakeRecommendation =  {url: "http://example.com", recommender_type: "pocket-trending", recommended: true};
      fakeSitesWithRecommendation[0] = Object.assign({}, fakeSitesWithRecommendation[0], fakeRecommendation);
      instance = renderWithProvider(<Spotlight page={"NEW_TAB"} dispatch={dispatch} sites={fakeSitesWithRecommendation} />);
      TestUtils.Simulate.click(TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem)[0].refs.link);
    });
  });
});

describe("SpotlightItem", function() {
  const fakeSite = fakeSiteWithImage;
  let instance;
  let el;
  beforeEach(() => {
    instance = renderWithProvider(<SpotlightItem {...fakeSite} />);
    el = ReactDOM.findDOMNode(instance);
  });

  describe("valid sites", () => {
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
      instance = renderWithProvider(<SpotlightItem {...site} />);
      const hc = TestUtils.findRenderedComponentWithType(instance, HighlightContext);
      const props = getHighlightContextFromSite(site);
      assert.equal(hc.props.type, "bookmark");
      assert.deepEqual(hc.props, props);

    });
  });
});

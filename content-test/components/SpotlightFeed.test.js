const {assert} = require("chai");
const ConnectedSpotlight = require("components/Spotlight/SpotlightFeed");
const {SpotlightFeed, SpotlightFeedItem} = ConnectedSpotlight;
const LinkMenu = require("components/LinkMenu/LinkMenu");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const {mockData, faker, renderWithProvider} = require("test/test-utils");
const fakeSpotlightItems = mockData.Spotlight.rows;
const fakeSiteWithImage = faker.createSite();

fakeSiteWithImage.bestImage = fakeSiteWithImage.images[0];

describe("Spotlight", () => {
  let instance;
  let el;
  let fakeDispatch = () => {};
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    instance = renderWithProvider(<SpotlightFeed sites={fakeSpotlightItems}
                                                 dispatch={fakeDispatch}
                                                 page="TEST_PAGE" />);
    el = ReactDOM.findDOMNode(instance);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("valid sites", () => {
    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render a SpotlightFeedItem for each item", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightFeedItem);
      assert.equal(children.length, 3);
    });
  });

  describe("higlight no images", () => {
    let siteNoImages;
    beforeEach(() => {
      siteNoImages = Object.assign({}, fakeSiteWithImage, {
        background_color: "#000",
        images: []
      });

      instance = renderWithProvider(<SpotlightFeedItem index={0}
                                                       page="TEST_PAGE"
                                                       source="TEST_PAGE"
                                                       {...siteNoImages} />);
      el = ReactDOM.findDOMNode(instance);
    });

    it("should set correct background color", () => {
      const bgColor = el.querySelector(".feed-icon-image").style.backgroundColor;
      assert.ok(bgColor);
    });
  });

  describe("valid highlight", () => {
    beforeEach(() => {
      instance = renderWithProvider(<SpotlightFeedItem index={0}
                                                       page="TEST_PAGE"
                                                       source="TEST_PAGE"
                                                       {...fakeSiteWithImage} />);
      el = ReactDOM.findDOMNode(instance);
    });

    it("should set correct background image", () => {
      const bgImage = el.querySelector(".feed-icon-image").style.backgroundImage;
      const position = bgImage.indexOf(fakeSiteWithImage.images[0].url);
      assert.ok(position >= 0);
    });

    it("should have correct title", () => {
      assert.ok(instance.refs.title);
      assert.equal(instance.refs.title.textContent, fakeSiteWithImage.title);
    });

    it("should have an image", () => {
      const icon = TestUtils.scryRenderedComponentsWithType(instance, SiteIcon);
      assert.ok(icon);
    });

    it("should have a description", () => {
      assert.ok(instance.refs.description);
      assert.equal(instance.refs.description.textContent, fakeSiteWithImage.description);
    });

    it("should have a context menu", () => {
      const menu = TestUtils.scryRenderedComponentsWithType(instance, LinkMenu);
      assert.ok(menu);
    });

    describe("highlight no description", () => {
      let fakeFeedItem;

      beforeEach(() => {
        fakeFeedItem = Object.assign({}, fakeSiteWithImage, {description: ""});
        instance = renderWithProvider(<SpotlightFeedItem index={0}
                                                         page="TEST_PAGE"
                                                         source="TEST_PAGE"
                                                         {...fakeFeedItem} />);
      });

      it("should not render the element at all if no description present", () => {
        assert.isNotOk(instance.refs.description);
      });
    });
  });
});

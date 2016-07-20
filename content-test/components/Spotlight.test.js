const {assert} = require("chai");
const moment = require("moment");
const ConnectedSpotlight = require("components/Spotlight/Spotlight");
const {Spotlight, SpotlightItem} = ConnectedSpotlight;
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
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
    it("should fire a click event an item is clicked", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "CLICK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "FEATURED");
          assert.equal(a.data.action_position, 0);
          done();
        }
      }
      instance = renderWithProvider(<Spotlight page={"NEW_TAB"} dispatch={dispatch} sites={fakeSpotlightItems} />);
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
    it("should use the context_message if it exists", () => {
      const props = Object.assign({}, fakeSite, {
        context_message: "Foo bar baz"
      });
      instance = renderWithProvider(<SpotlightItem {...props} />);
      assert.equal(instance.refs.contextMessage.innerHTML, "Foo bar baz");
    });
    it("should render the lastVisitDate if it exists", () => {
      assert.equal(instance.refs.contextMessage.textContent, `Visited ${moment(fakeSiteWithImage.lastVisitDate).fromNow()}`);
    });
    it("should render the bookmarkDateCreated if it exists", () => {
      const props = Object.assign({}, fakeSite, {
        bookmarkDateCreated: 1456426160465
      });
      instance = renderWithProvider(<SpotlightItem {...props} />);
      assert.equal(instance.refs.contextMessage.textContent, `Bookmarked ${moment(1456426160465).fromNow()}`);
    });
    it("should say 'Visited Recently' if no bookmark or timestamp are available", () => {
      const props = Object.assign({}, fakeSite, {
        lastVisitDate: null
      });
      instance = renderWithProvider(<SpotlightItem {...props} />);
      assert.equal(instance.refs.contextMessage.textContent, "Visited recently");
    });
    describe("recommendations", () => {
      it("should say 'Trending' if it is a recommendation and have a timestamp", () => {
        const props = Object.assign({}, fakeSite, {
          recommended: true,
          lastVisitDate: null,
          timestamp: 1456426160465
        });
        instance = renderWithProvider(<SpotlightItem {...props} />);
        assert.equal(instance.refs.contextMessage.textContent, "Trending");
        assert.equal(instance.refs.contextMessage.dataset.timestamp, moment(1456426160465).fromNow());
      });
      it("if the recommendation's timestamp is 0 don't show a timestamp", () => {
        const props = Object.assign({}, fakeSite, {
          timestamp: 0
        });
        instance = renderWithProvider(<SpotlightItem {...props} />);
        assert.equal(instance.refs.contextMessage.dataset.timestamp, "");
      });
      it("should render the tooltip when hovering over a recommendation's context_message", () => {
        const props = Object.assign({}, fakeSite, {
          recommended: true,
          lastVisitDate: null
        });
        instance = renderWithProvider(<SpotlightItem {...props} />);
        assert.isTrue(instance.refs.spotlightTooltip.hidden);
        TestUtils.Simulate.mouseOver(instance.refs.spotlightContext);
        assert.isFalse(instance.refs.spotlightTooltip.hidden);
      });
    });
    it("should show link menu when link button is pressed", () => {
      const button = ReactDOM.findDOMNode(TestUtils.findRenderedComponentWithType(instance, LinkMenuButton));
      TestUtils.Simulate.click(button);
      const menu = TestUtils.findRenderedComponentWithType(instance, LinkMenu);
      assert.equal(menu.props.visible, true);
    });
  });
});

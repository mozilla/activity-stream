const {assert} = require("chai");
const moment = require("moment");
const ConnectedSpotlight = require("components/Spotlight/Spotlight");
const {Spotlight, SpotlightItem} = ConnectedSpotlight;
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const {mockData, faker} = require("test/test-utils");
const am = require("common/action-manager");

const fakeSpotlightItems = mockData.Spotlight.rows;
const fakeSiteWithImage = faker.createSite();
fakeSiteWithImage.bestImage = fakeSiteWithImage.images[0];

describe("Spotlight", function() {
  let instance;
  let el;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<Spotlight sites={fakeSpotlightItems} />);
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
    it("should fire a block action when delete button is clicked", done => {
      let url;
      function dispatch(a) {
        if (a.type === am.type("BLOCK_URL")) {
          assert.equal(a.data, url);
          done();
        }
      }
      instance = TestUtils.renderIntoDocument(<Spotlight sites={fakeSpotlightItems} dispatch={dispatch} />);
      const firstItem = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem)[0];
      url = firstItem.props.url;
      TestUtils.Simulate.click(firstItem.refs.delete);
    });
  });
});

describe("SpotlightItem", function() {
  const fakeSite = fakeSiteWithImage;
  let node;
  let instance;
  let el;
  beforeEach(() => {
    node = document.createElement("div");
    instance = ReactDOM.render(<SpotlightItem {...fakeSite} />, node);
    el = ReactDOM.findDOMNode(instance);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
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
      assert.equal(instance.refs.title.innerHTML, fakeSite.title);
    });
    it("should render the description", () => {
      assert.include(instance.refs.description.innerHTML, fakeSite.description);
    });
    it("should render the lastVisitDate if it exists", () => {
      assert.equal(instance.refs.contextMessage.innerHTML, `Visited ${moment(fakeSiteWithImage.lastVisitDate).fromNow()}`);
    });
    it("should render the bookmarkDateCreated if it exists", () => {
      const props = Object.assign({}, fakeSite, {
        bookmarkDateCreated: 1456426160465
      });
      instance = TestUtils.renderIntoDocument(<SpotlightItem {...props} />);
      assert.equal(instance.refs.contextMessage.innerHTML, `Bookmarked ${moment(1456426160465).fromNow()}`);
    });
    it("should say 'Visited Recently' if no bookmark or timestamp are available", () => {
      const props = Object.assign({}, fakeSite, {
        lastVisitDate: null
      });
      instance = TestUtils.renderIntoDocument(<SpotlightItem {...props} />);
      assert.equal(instance.refs.contextMessage.innerHTML, "Visited recently");
    });
    it("should call onDelete callback with url when delete icon is pressed", done => {
      function onDelete(url) {
        assert.equal(url, fakeSite.url);
        done();
      }
      const spotlight = TestUtils.renderIntoDocument(<SpotlightItem onDelete={onDelete} {...fakeSite} />);
      const button = spotlight.refs.delete;
      TestUtils.Simulate.click(button);
    });
  });
});

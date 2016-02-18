const {assert} = require("chai");
const Spotlight = require("components/Spotlight/Spotlight");
const {SpotlightItem} = Spotlight;
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const fakeSpotlightItems = require("lib/fake-data").History.rows;

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
    it("should skip sites that do not have an images prop", () => {
      const sites = [
        {title: "Hello world", url: "bar.com", description: "123"},
        {title: "Foo", url: "bar1.com", images: [{url: "foo.jpg"}]},
        {title: "Bar", url: "bar2.com", images: [{url: "bar.jpg"}]},
        {title: "Baz", url: "bar3.com", images: []},
        {title: "Baz", url: "bar4.com", images: [{}]},
      ];
      const testInstance = TestUtils.renderIntoDocument(<Spotlight sites={sites} length={5} />);
      const children = TestUtils.scryRenderedComponentsWithType(testInstance, SpotlightItem);
      assert.equal(children.length, 2);
    });
  });
});

describe("SpotlightItem", function() {
  const fakeSite = fakeSpotlightItems[0];
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
    it("should render the image as a link", () => {
      assert.include(instance.refs.image.style.backgroundImage, fakeSite.images[0].url);
      assert.include(instance.refs.image.href, fakeSite.url);
    });
    it("should render the url link with title", () => {
      const linkEl = instance.refs.link;
      assert.equal(linkEl.innerHTML, fakeSite.title);
      assert.include(linkEl.href, fakeSite.url);
    });
    it("should render the description", () => {
      assert.include(instance.refs.description.innerHTML, fakeSite.description);
    });
  });
});

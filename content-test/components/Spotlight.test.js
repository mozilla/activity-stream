const {assert} = require("chai");
const Spotlight = require("components/Spotlight/Spotlight");
const {SpotlightItem} = Spotlight;
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");

const fakeSpotlightItems = require("lib/shim").data.fakeSpotlightItems;

describe("Spotlight", function() {
  let node;
  let instance;
  let el;
  beforeEach(() => {
    node = document.createElement("div");
    instance = ReactDOM.render(<Spotlight sites={fakeSpotlightItems} />, node);
    el = ReactDOM.findDOMNode(instance);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
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
      assert.include(instance.refs.icon.style.backgroundImage, fakeSite.icon);
    });
    it("should render the image", () => {
      assert.include(instance.refs.image.style.backgroundImage, fakeSite.image);
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

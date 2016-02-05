const {assert} = require("chai");
const ActivityFeed = require("components/ActivityFeed/ActivityFeed");
const {ActivityFeedItem} = ActivityFeed;
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");

const fakeSites = require("lib/shim").data.fakeBookmarks;

describe("ActivityFeed", function () {
  let node, instance, el;
  beforeEach(() => {
    node = document.createElement("div");
    instance = ReactDOM.render(<ActivityFeed sites={fakeSites} />, node);
    el = ReactDOM.findDOMNode(instance);
  });
  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node);
  });

  describe("valid sites", () => {
    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render an ActivityFeedItem for each site", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, ActivityFeedItem);
      assert.equal(children.length, fakeSites.length);
    });
  });
});

describe("ActivityFeedItem", function () {
  const fakeSite = fakeSites[0];
  let node, instance, el;
  beforeEach(() => {
    node = document.createElement("div");
    instance = ReactDOM.render(<ActivityFeedItem {...fakeSite} />, node);
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
      assert.include(instance.refs.icon.style.backgroundImage, fakeSite.image);
    });
    it("should render the title", () => {
      assert.equal(instance.refs.title.innerHTML, fakeSite.title);
    });
    it("should render the url link", () => {
      const linkEl = instance.refs.link;
      assert.equal(linkEl.innerHTML, fakeSite.url);
      assert.include(linkEl.href, fakeSite.url);
    });
  });
});

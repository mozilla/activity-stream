const {assert} = require("chai");
const ActivityFeed = require("components/ActivityFeed/ActivityFeed");
const {ActivityFeedItem} = ActivityFeed;
const SiteIcon = require("components/SiteIcon/SiteIcon");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {prettyUrl} = require("lib/utils");

const fakeSites = require("test/test-utils").mockData.Bookmarks.rows;

describe("ActivityFeed", function() {
  let instance;
  let el;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<ActivityFeed sites={fakeSites} />);
    el = ReactDOM.findDOMNode(instance);
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

describe("ActivityFeedItem", function() {
  const fakeSite = fakeSites[0];
  let instance;
  let el;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<ActivityFeedItem {...fakeSite} />);
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
    it("should render the bookmarkTitle if it exists", () => {
      assert.equal(instance.refs.title.innerHTML, fakeSite.bookmarkTitle);
    });
    it("should render the title if no bookmarkTitle exists", () => {
      const fakeSiteCopy = JSON.parse(JSON.stringify(fakeSite));
      delete fakeSiteCopy.bookmarkTitle;
      instance = TestUtils.renderIntoDocument(<ActivityFeedItem {...fakeSiteCopy} />);
      assert.equal(instance.refs.title.innerHTML, fakeSiteCopy.title);
    });
    it("should render the url link", () => {
      const linkEl = instance.refs.link;
      assert.equal(linkEl.innerHTML, prettyUrl(fakeSite.url));
      assert.include(linkEl.href, fakeSite.url);
    });
  });
});

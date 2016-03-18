const {assert} = require("chai");
const ConnectedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const {ActivityFeedItem, ActivityFeed, GroupedActivityFeed} = ConnectedActivityFeed;
const SiteIcon = require("components/SiteIcon/SiteIcon");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {prettyUrl} = require("lib/utils");
const moment = require("moment");

const fakeSites = require("test/test-utils").mockData.Bookmarks.rows;
const fakeSite = {
  "title": "man throws alligator in wendys wptv dnt cnn",
  "dateDisplay": 1456426160465,
  "url": "http://www.cnn.com/videos/tv/2016/02/09/man-throws-alligator-in-wendys-wptv-dnt.cnn",
  "description": "A Florida man faces multiple charges for throwing an alligator through a Wendy's drive-thru window. CNN's affiliate WPTV reports.",
  "images": [
    {
      "url": "http://i2.cdn.turner.com/cnnnext/dam/assets/160209053130-man-throws-alligator-in-wendys-wptv-dnt-00004611-large-169.jpg",
      "height": 259,
      "width": 460,
      "entropy": 3.98714569089,
      "size": 14757
    }
  ]
};
const fakeSiteWithBookmark = Object.assign({}, fakeSite, {
  "bookmarkDateCreated": 1456426165218,
  "bookmarkGuid": "G6LXclyo_WAj"
});

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
  let instance;
  let el;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<ActivityFeedItem {...fakeSite} />);
    el = ReactDOM.findDOMNode(instance);
  });

  it("should not throw if missing props", () => {
    assert.doesNotThrow(() => {
      TestUtils.renderIntoDocument(<ActivityFeedItem />);
    });
  });

  describe("valid sites", () => {
    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render the link", () => {
      const linkEl = instance.refs.link;
      assert.equal(linkEl.href, fakeSite.url);
    });
    it("should render the icon", () => {
      assert.instanceOf(instance.refs.icon, SiteIcon);
      assert.include(instance.refs.icon.props.site, fakeSite);
    });
    it("should render the title", () => {
      assert.equal(instance.refs.title.innerHTML, fakeSite.title);
    });
    it("should render the url", () => {
      const urlEl = instance.refs.url;
      assert.equal(urlEl.innerHTML, prettyUrl(fakeSite.url));
    });
    it("should render the time", () => {
      const lastVisitEl = instance.refs.lastVisit;
      assert.equal(lastVisitEl.innerHTML, moment(fakeSite.dateDisplay).format("h:mma"));
    });
    it("should not have a bookmark class if no bookmarkGuid", () => {
      assert.notInclude(el.className, "bookmark");
    });
    it("should have a bookmark class if the site has a bookmarkGuid", () => {
      instance = TestUtils.renderIntoDocument(<ActivityFeedItem {...fakeSiteWithBookmark} />);
      assert.include(ReactDOM.findDOMNode(instance).className, "bookmark");
    });
    it("should call onDelete callback with url when delete icon is pressed", done => {
      function onDelete(url) {
        assert.equal(url, fakeSite.url);
        done();
      }
      const item = TestUtils.renderIntoDocument(<ActivityFeedItem onDelete={onDelete} {...fakeSite} />);
      const button = item.refs.delete;
      TestUtils.Simulate.click(button);
    });
    it("should render date if showDate=true", () => {
      const item = TestUtils.renderIntoDocument(<ActivityFeedItem showDate={true} {...fakeSite} />);
      const lastVisitEl = item.refs.lastVisit;
      assert.equal(lastVisitEl.innerHTML, moment(fakeSite.dateDisplay).calendar());
    });
  });
});

describe("GroupedActivityFeed", function() {
  let instance;
  let el;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<GroupedActivityFeed sites={fakeSites} />);
    el = ReactDOM.findDOMNode(instance);
  });

  describe("valid grouped activity feed", () => {
    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render an ActivityFeed for each date", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, ActivityFeed);
      // Each fakeSite has a different lastVisitDate, so there will be one
      // ActivityFeed per site.
      assert.equal(children.length, fakeSites.length);
    });
  });
});

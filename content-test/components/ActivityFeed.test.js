const {assert} = require("chai");
const ConnectedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const {ActivityFeedItem, GroupedActivityFeed, groupSitesBySession} = ConnectedActivityFeed;
const SiteIcon = require("components/SiteIcon/SiteIcon");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {prettyUrl} = require("lib/utils");
const moment = require("moment");

const {faker, overrideConsoleError} = require("test/test-utils");
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

describe("ActivityFeedItem", function() {
  let instance;
  let el;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<ActivityFeedItem {...fakeSite} />);
    el = ReactDOM.findDOMNode(instance);
  });

  it("should not throw if missing props", () => {
    assert.doesNotThrow(() => {
      const restore = overrideConsoleError();
      TestUtils.renderIntoDocument(<ActivityFeedItem />);
      restore();
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
      assert.equal(lastVisitEl.innerHTML, moment(fakeSite.dateDisplay).format("h:mm A"));
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
  let sites;
  beforeEach(() => {
    sites = [
      faker.createSite({moment: faker.moment()}),
      faker.createSite({moment: faker.moment().subtract(2, "days")}),
      faker.createSite({moment: faker.moment().subtract(4, "days")}),
    ];
    instance = TestUtils.renderIntoDocument(<GroupedActivityFeed sites={sites} />);
    el = ReactDOM.findDOMNode(instance);
  });

  describe("valid grouped activity feed", () => {
    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render an ActivityFeed for each date", () => {
      const children = TestUtils.scryRenderedDOMComponentsWithClass(instance, "activity-feed");
      // Each fakeSite is minimum of 24 hours apart
      // ActivityFeed per site.
      assert.equal(children.length, sites.length);
    });
    it("shouldn't render title if there are no sites", () => {
      const item = TestUtils.renderIntoDocument(<GroupedActivityFeed sites={[]} title="Fake Title" />);
      assert.isUndefined(item.refs.title);
    });
  });

  describe("date headings", () => {
    let m;
    let m2;
    let m3;
    let sites;
    beforeEach(() => {
      const date = new Date();
      m = moment(date);
      m2 = moment(date).subtract(1, "days");
      m3 = moment(date).subtract(2, "days");
      sites = [
        faker.createSite({moment: m}),
        faker.createSite({moment: m2}),
        faker.createSite({moment: m3})
      ];
    });
    it("should show date headings if showDateHeadings is true", () => {
      const item = TestUtils.renderIntoDocument(<GroupedActivityFeed showDateHeadings={true} sites={sites} />);
      const titles = TestUtils.scryRenderedDOMComponentsWithClass(item, "section-title");
      assert.lengthOf(titles, 2);
      assert.equal(titles[0].innerHTML, "Yesterday");
      assert.equal(titles[1].innerHTML, m3.format("[Last] dddd"));
    });
    it("should not show date headings if showDateHeadings is false", () => {
      const item = TestUtils.renderIntoDocument(<GroupedActivityFeed showDateHeadings={false} sites={sites} />);
      const titles = TestUtils.scryRenderedDOMComponentsWithClass(item, "section-title");
      assert.lengthOf(titles, 0);
    });
  });

  describe("events", () => {
    it("should send an event onClick", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "CLICK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.action_position, 0);
          done();
        }
      }
      instance = TestUtils.renderIntoDocument(<GroupedActivityFeed dispatch={dispatch} page={"NEW_TAB"} sites={sites} />);
      const link = TestUtils.scryRenderedComponentsWithType(instance, ActivityFeedItem)[0].refs.link;
      TestUtils.Simulate.click(link);
    });
    it("should send an event onDelete", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "DELETE");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "ACTIVITY_FEED");
          assert.equal(a.data.action_position, 1);
          done();
        }
      }
      instance = TestUtils.renderIntoDocument(<GroupedActivityFeed dispatch={dispatch} page={"NEW_TAB"} sites={sites} />);
      const link = TestUtils.scryRenderedComponentsWithType(instance, ActivityFeedItem)[1].refs.delete;
      TestUtils.Simulate.click(link);
    });
    it("should send an event onShare", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "SHARE");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "ACTIVITY_FEED");
          assert.equal(a.data.action_position, 2);
          done();
        }
      }
      instance = TestUtils.renderIntoDocument(<GroupedActivityFeed dispatch={dispatch} page={"NEW_TAB"} sites={sites} />);
      const link = TestUtils.scryRenderedComponentsWithType(instance, ActivityFeedItem)[2].refs.share;
      TestUtils.Simulate.click(link);
    });
  });
});

describe("groupSitesBySession", () => {
  const testDate = 1456420000000;
  const minute = 60000;
  const testSites = [
    {url: "foo1.com", dateDisplay: testDate},
    {url: "foo2.com", dateDisplay: testDate - 3 * minute},
    {url: "foo3.com", dateDisplay: testDate - 14 * minute},
    {url: "foo4.com", dateDisplay: testDate - 15 * minute},
  ];
  const result = groupSitesBySession(testSites);
  it("should create an array of arrays", () => {
    assert.isArray(result);
    result.forEach(group => assert.isArray);
  });
  it("should split sites after a 10 minute gap", () => {
    assert.lengthOf(result, 2);
  });
  it("should contain the right items", () => {
    assert.deepEqual(result[0], [testSites[0], testSites[1]]);
    assert.deepEqual(result[1], [testSites[2], testSites[3]]);
  });
  it("should work for ascending order", () => {
    assert.lengthOf(groupSitesBySession(testSites.reverse()), 2);
  });
});

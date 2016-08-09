const {assert} = require("chai");
const ConnectedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const {ActivityFeedItem, GroupedActivityFeed, groupSitesBySession} = ConnectedActivityFeed;
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const MediaPreview = require("components/MediaPreview/MediaPreview");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {prettyUrl} = require("lib/utils");
const moment = require("moment");
const {renderWithProvider} = require("test/test-utils");

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
    instance = renderWithProvider(<ActivityFeedItem {...fakeSite} />);
    el = ReactDOM.findDOMNode(instance);
  });

  it("should not throw if missing props", () => {
    assert.doesNotThrow(() => {
      const restore = overrideConsoleError();
      renderWithProvider(<ActivityFeedItem />);
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
      assert.equal(instance.refs.title.textContent, fakeSite.title);
    });
    it("should render the url", () => {
      const urlEl = instance.refs.url.dataset.feedUrl;
      assert.equal(urlEl, prettyUrl(fakeSite.url));
    });
    it("should render the time", () => {
      const lastVisitEl = instance.refs.lastVisit.dataset.lastVisit;
      assert.equal(lastVisitEl, moment(fakeSite.dateDisplay).format("h:mm A"));
    });
    it("should not have a bookmark class if no bookmarkGuid", () => {
      assert.notInclude(el.className, "bookmark");
    });
    it("should have a bookmark class if the site has a bookmarkGuid", () => {
      instance = renderWithProvider(<ActivityFeedItem {...fakeSiteWithBookmark} />);
      assert.include(ReactDOM.findDOMNode(instance).className, "bookmark");
    });
    it("should show the link menu when the link button is clicked", () => {
      const item = renderWithProvider(<ActivityFeedItem {...fakeSite} />);
      const button = ReactDOM.findDOMNode(TestUtils.findRenderedComponentWithType(item, LinkMenuButton));
      TestUtils.Simulate.click(button);
      const menu = TestUtils.findRenderedComponentWithType(item, LinkMenu);
      assert.equal(menu.props.visible, true);
    });
    it("should render date if showDate=true", () => {
      const item = renderWithProvider(<ActivityFeedItem showDate={true} {...fakeSite} />);
      const lastVisitEl = item.refs.lastVisit.dataset.lastVisit;
      assert.equal(lastVisitEl, moment(fakeSite.dateDisplay).calendar());
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
      faker.createSite({moment: faker.moment().subtract(4, "days")})
    ];
    instance = renderWithProvider(<GroupedActivityFeed sites={sites} />);
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
      const item = renderWithProvider(<GroupedActivityFeed sites={[]} title="Fake Title" />);
      assert.isUndefined(item.refs.title);
    });
  });

  describe("date headings", () => {
    let m;
    let m2;
    let m3;
    let m4;
    let sites;
    beforeEach(() => {
      const date = new Date();
      m = moment(date);
      m2 = moment(date).subtract(1, "days");
      m3 = moment(date).subtract(2, "days");
      m4 = moment(date).subtract(1, "years");
      sites = [
        faker.createSite({moment: m}),
        faker.createSite({moment: m2}),
        faker.createSite({moment: m3}),
        faker.createSite({moment: m4})
      ];
    });
    it("should show date headings if showDateHeadings is true", () => {
      const item = renderWithProvider(<GroupedActivityFeed showDateHeadings={true} sites={sites} />);
      const titles = TestUtils.scryRenderedDOMComponentsWithClass(item, "section-title");
      assert.lengthOf(titles, 4);
      assert.equal(titles[0].innerHTML, "Today");
      assert.equal(titles[1].innerHTML, "Yesterday");
      assert.equal(titles[2].innerHTML, m3.format("[Last] dddd"));
      assert.equal(titles[3].innerHTML, m4.format("dddd MMMM D, YYYY"));
    });
    it("should not show date headings if showDateHeadings is false", () => {
      const item = renderWithProvider(<GroupedActivityFeed showDateHeadings={false} sites={sites} />);
      const titles = TestUtils.scryRenderedDOMComponentsWithClass(item, "section-title");
      assert.lengthOf(titles, 0);
    });
  });

  describe("maxPreviews", () => {
    const sites = ["lDv68xYHFXM", "xDv68xYHFXM", "1Dv68xYHFXM", "0Dv68xYHFXM"].map(url => {
      return faker.createSite({override: {
        url: `https://www.youtube.com/watch?v=${url}`,
        media: {type: "video"}
      }});
    });
    it("should create previews for all items by default", () => {
      const feed = renderWithProvider(<GroupedActivityFeed sites={sites} />);
      const previews = TestUtils.scryRenderedComponentsWithType(feed, MediaPreview);
      assert.lengthOf(previews, sites.length, "one preview per site");
    });
    it("should create no previews if maxPreviews=0", () => {
      const feed = renderWithProvider(<GroupedActivityFeed sites={sites} maxPreviews={0} />);
      const previews = TestUtils.scryRenderedComponentsWithType(feed, MediaPreview);
      assert.lengthOf(previews, 0, "no previews");
    });
    it("should create previews for n sites if maxPreviews=n", () => {
      const feed = renderWithProvider(<GroupedActivityFeed sites={sites} maxPreviews={1} />);
      const previews = TestUtils.scryRenderedComponentsWithType(feed, MediaPreview);
      assert.lengthOf(previews, 1, "only one preview");
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
      instance = renderWithProvider(<GroupedActivityFeed dispatch={dispatch} page={"NEW_TAB"} sites={sites} />);
      const link = TestUtils.scryRenderedComponentsWithType(instance, ActivityFeedItem)[0].refs.link;
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
    {url: "foo4.com", dateDisplay: testDate - 15 * minute}
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

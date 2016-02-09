const {assert} = require("chai");
const React = require("react");
const TestUtils = require("react-addons-test-utils");

const {NewTabPage} = require("components/NewTabPage/NewTabPage");
const ActivityFeed = require("components/ActivityFeed/ActivityFeed");
const TopSites = require("components/TopSites/TopSites");

const fakeProps = require("test/test-utils").mockData;

describe("NewTabPage", () => {
  let instance;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<NewTabPage {...fakeProps} />);
  });

  it("should create a page", () => {
    assert.ok(TestUtils.isCompositeComponentWithType(instance, NewTabPage));
  });

  it("should render TopSites components with correct data", () => {
    const topSites = TestUtils.findRenderedComponentWithType(instance, TopSites);
    assert.equal(topSites.props.sites, fakeProps.TopSites.rows);
  });

  it("should render sites for ActivityFeeds with correct data", () => {
    const activityFeeds = TestUtils.scryRenderedComponentsWithType(instance, ActivityFeed);
    assert.lengthOf(activityFeeds, 2);
    assert.equal(activityFeeds[0].props.sites, fakeProps.Bookmarks.rows);
    assert.equal(activityFeeds[1].props.sites, fakeProps.History.rows);
  });
});

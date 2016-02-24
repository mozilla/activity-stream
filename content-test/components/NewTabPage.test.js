const {assert} = require("chai");
const React = require("react");
const TestUtils = require("react-addons-test-utils");

const {NewTabPage} = require("components/NewTabPage/NewTabPage");
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
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

  it("should render GroupedActivityFeed with correct data", () => {
    const activityFeed = TestUtils.findRenderedComponentWithType(instance, GroupedActivityFeed);
    assert.equal(activityFeed.props.sites, fakeProps.History.rows);
  });
});

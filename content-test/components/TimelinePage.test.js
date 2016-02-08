const {assert} = require("chai");
const React = require("react");
const TestUtils = require("react-addons-test-utils");

const {TimelinePage} = require("components/TimelinePage/TimelinePage");
const ActivityFeed = require("components/ActivityFeed/ActivityFeed");

const fakeProps = require("test/test-utils").mockData;

describe("TimelinePage", () => {
  let instance;
  beforeEach(() => {
    instance = TestUtils.renderIntoDocument(<TimelinePage {...fakeProps} />);
  });

  it("should create a page", () => {
    assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelinePage));
  });

  it("should render sites for ActivityFeeds with correct data", () => {
    const activityFeed = TestUtils.findRenderedComponentWithType(instance, ActivityFeed);
    assert.equal(activityFeed.props.sites, fakeProps.Bookmarks.rows);
  });
});

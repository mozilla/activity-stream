const {assert} = require("chai");
const React = require("react");
const TestUtils = require("react-addons-test-utils");

const TimelinePage = require("components/TimelinePage/TimelinePage");
const ConnectedTimelineHistory = require("components/TimelinePage/TimelineHistory");
const {TimelineHistory} = ConnectedTimelineHistory;
const ConnectedTimelineBookmarks = require("components/TimelinePage/TimelineBookmarks");
const {TimelineBookmarks} = ConnectedTimelineBookmarks;
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");

const {mockData, renderWithProvider} = require("test/test-utils");

describe("Timeline", () => {

  describe("TimelinePage", () => {
    const fakeProps = {
      location: {pathname: "/timeline"}
    };
    let instance;
    beforeEach(() => {
      instance = renderWithProvider(<TimelinePage {...fakeProps}>
        <div className="fake-child">Hello world</div>
      </TimelinePage>);
    });

    it("should create a page", () => {
      assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelinePage));
    });

    it("should render children", () => {
      const result = TestUtils.findRenderedDOMComponentWithClass(instance, "fake-child");
      TestUtils.isDOMComponent(result);
    });

    it("should add active class to correct sidebar item", () => {
      const result = TestUtils.findRenderedDOMComponentWithClass(instance, "active");
      TestUtils.isDOMComponent(result);
      assert.equal(result.querySelector(".link-title").innerHTML, "All");
    });
  });

  describe("TimelineHistory", () => {
    let instance;
    const fakeProps = mockData;

    beforeEach(() => {
      instance = renderWithProvider(<TimelineHistory {...fakeProps} />);
    });

    it("should create a page", () => {
      assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelineHistory));
    });

    it("should render GroupedActivityFeed with correct data", () => {
      const activityFeed = TestUtils.findRenderedComponentWithType(instance, GroupedActivityFeed);
      assert.equal(activityFeed.props.sites, fakeProps.History.rows);
    });

    it("should render the connected container with the correct props", () => {
      const container = renderWithProvider(<ConnectedTimelineHistory />);
      const inner = TestUtils.findRenderedComponentWithType(container, TimelineHistory);
      Object.keys(fakeProps).forEach(key => assert.property(inner.props, key));
    });
  });

  describe("TimelineBookmarks", () => {
    let instance;
    const fakeProps = mockData;
    beforeEach(() => {
      instance = renderWithProvider(<TimelineBookmarks {...fakeProps} />);
    });

    it("should create a page", () => {
      assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelineBookmarks));
    });

    it("should render GroupedActivityFeed with correct data", () => {
      const activityFeed = TestUtils.findRenderedComponentWithType(instance, GroupedActivityFeed);
      assert.equal(activityFeed.props.sites, fakeProps.Bookmarks.rows);
    });

    it("should render the connected container with the correct props", () => {
      const container = renderWithProvider(<ConnectedTimelineBookmarks />);
      const inner = TestUtils.findRenderedComponentWithType(container, TimelineBookmarks);
      Object.keys(fakeProps).forEach(key => assert.property(inner.props, key));
    });
  });

});

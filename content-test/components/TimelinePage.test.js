const {assert} = require("chai");
const React = require("react");
const TestUtils = require("react-addons-test-utils");
const TimelinePage = require("components/TimelinePage/TimelinePage");
const {TimelineHistory} = require("components/TimelinePage/TimelineHistory");
const {TimelineBookmarks} = require("components/TimelinePage/TimelineBookmarks");
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
const {mockData} = require("test/test-utils");

describe("Timeline", () => {

  describe("TimelinePage", () => {
    const fakeProps = {
      location: {pathname: "/timeline"}
    };
    let instance;
    beforeEach(() => {
      instance = TestUtils.renderIntoDocument(<TimelinePage {...fakeProps}>
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
      instance = TestUtils.renderIntoDocument(<TimelineHistory {...fakeProps} />);
    });

    it("should create a page", () => {
      assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelineHistory));
    });

    it("should render GroupedActivityFeed with correct data", () => {
      const activityFeed = TestUtils.findRenderedComponentWithType(instance, GroupedActivityFeed);
      assert.equal(activityFeed.props.sites, fakeProps.History.rows);
    });
  });

  describe("TimelineBookmarks", () => {
    let instance;
    const fakeProps = mockData;
    beforeEach(() => {
      instance = TestUtils.renderIntoDocument(<TimelineBookmarks {...fakeProps} />);
    });

    it("should create a page", () => {
      assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelineBookmarks));
    });

    it("should render GroupedActivityFeed with correct data", () => {
      const activityFeed = TestUtils.findRenderedComponentWithType(instance, GroupedActivityFeed);
      assert.equal(activityFeed.props.sites, fakeProps.Bookmarks.rows);
    });
  });

});

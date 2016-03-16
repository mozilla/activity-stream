const {assert} = require("chai");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");

const TimelinePage = require("components/TimelinePage/TimelinePage");
const ConnectedTimelineHistory = require("components/TimelinePage/TimelineHistory");
const {TimelineHistory} = ConnectedTimelineHistory;
const ConnectedTimelineBookmarks = require("components/TimelinePage/TimelineBookmarks");
const {TimelineBookmarks} = ConnectedTimelineBookmarks;
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
const LoadMore = require("components/LoadMore/LoadMore");
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
    let loadMore;
    const fakeProps = mockData;

    function setup(customProps = {}, dispatch) {
      const props = Object.assign({}, fakeProps, customProps);
      instance = renderWithProvider(<TimelineHistory {...props} />, dispatch && {dispatch});
      loadMore = TestUtils.findRenderedComponentWithType(instance, LoadMore);
    }

    beforeEach(setup);

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
      Object.keys(TimelineHistory.propTypes).forEach(key => assert.property(inner.props, key));
    });

    it("should have a LoadMore element", () => {
      assert.ok(loadMore);
    });

    it("should show a loader if History.isLoading is true", () => {
      setup({
        History: {
          isLoading: true,
          canLoadMore: true,
          rows: [{url: "https://foo.com"}]
        }
      });
      assert.equal(ReactDOM.findDOMNode(loadMore.refs.loader).hidden, false);
    });

    it("should hide LoadMore if canLoadMore is false", () => {
      setup({
        History: {
          isLoading: false,
          canLoadMore: false,
          rows: [{url: "https://foo.com"}]
        }
      });
      assert.equal(ReactDOM.findDOMNode(loadMore).hidden, true);
    });

    it("should hide LoadMore if rows are empty", () => {
      setup({
        History: {
          isLoading: false,
          canLoadMore: true,
          rows: []
        }
      });
      assert.equal(ReactDOM.findDOMNode(loadMore).hidden, true);
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
      Object.keys(TimelineBookmarks.propTypes).forEach(key => assert.property(inner.props, key));
    });
  });

});

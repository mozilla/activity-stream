const {assert} = require("chai");
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");

const TimelinePage = require("components/TimelinePage/TimelinePage");
const ConnectedTimelineFeed = require("components/TimelinePage/TimelineFeed");
const {TimelineFeed} = ConnectedTimelineFeed;
const ConnectedTimelineHistory = require("components/TimelinePage/TimelineHistory");
const {TimelineHistory} = ConnectedTimelineHistory;
const ConnectedTimelineBookmarks = require("components/TimelinePage/TimelineBookmarks");
const {TimelineBookmarks} = ConnectedTimelineBookmarks;
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
const Loader = require("components/Loader/Loader");
const Spotlight = require("components/Spotlight/Spotlight");
const {mockData, renderWithProvider} = require("test/test-utils");
const {INFINITE_SCROLL_THRESHOLD, SCROLL_TOP_OFFSET} = require("common/constants");

describe("Timeline", () => {
  describe("TimelinePage", () => {
    const fakeProps = {location: {pathname: "/timeline"}};
    let instance;
    beforeEach(() => {
      instance = renderWithProvider(<TimelinePage {...fakeProps}>
        <div className="fake-child">Hello world</div>
      </TimelinePage>);
    });

    it("should create a page", () => {
      assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelinePage));
    });

    it("should set the title to Activity Stream", () => {
      assert.equal(document.title, "Activity Stream");
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

  describe("TimelineFeed", () => {
    let instance;
    let loader;
    let loaderEl;

    const fakeProps = {
      Feed: {
        init: true,
        isLoading: false,
        canLoadMore: true,
        rows: mockData.History.rows
      },
      dateKey: "lastVisitDate",
      pageName: "TIMELINE_ALL",
      loadMoreAction: () => {}
    };

    function setup(customProps = {}, dispatch) {
      const props = Object.assign({}, fakeProps, customProps);
      const connected = renderWithProvider(<ConnectedTimelineFeed {...props} />, dispatch && {dispatch});
      instance = TestUtils.findRenderedComponentWithType(connected, TimelineFeed);
      loader = TestUtils.findRenderedComponentWithType(instance, Loader);
      loaderEl = ReactDOM.findDOMNode(loader);
    }

    beforeEach(setup);

    it("should create a TimelineFeed", () => {
      assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelineFeed));
    });

    describe("Elements", () => {
      it("should render GroupedActivityFeed with correct data", () => {
        const activityFeed = TestUtils.findRenderedComponentWithType(instance, GroupedActivityFeed);
        assert.equal(activityFeed.props.sites, fakeProps.Feed.rows);
        assert.equal(activityFeed.props.dateKey, fakeProps.dateKey);
      });
      it("should not render a Spotlight if Spotlight data is missing", () => {
        assert.lengthOf(TestUtils.scryRenderedComponentsWithType(instance, Spotlight), 0);
      });
      it("should render a Spotlight if Spotlight data is provided", () => {
        setup({Spotlight: mockData.Highlights});
        assert.ok(TestUtils.findRenderedComponentWithType(instance, Spotlight));
      });
    });

    describe("Loader", () => {
      it("should have a Loader element", () => {
        assert.ok(loader);
      });
      it("should show Loader if History.isLoading is true", () => {
        setup({Feed: Object.assign({}, fakeProps.Feed, {isLoading: true})});
        assert.equal(loaderEl.hidden, false);
      });
    });

    describe("#loadMore", () => {
      it("should dispatch loadMoreAction", done => {
        setup({loadMoreAction: () => "foo"}, action => {
          assert.equal(action, "foo");
          done();
        });
        instance.loadMore();
      });
      it("should select the {dateKey} of the last item", done => {
        setup({
          dateKey: "foo",
          Feed: Object.assign({}, fakeProps.Feed, {
            rows: [
              {url: "asd.com", foo: 3},
              {url: "blah.com", foo: 2},
              {url: "324ads.com", foo: 1}
            ]
          }),
          loadMoreAction: date => {
            assert.equal(date, 1);
            done();
          }
        });
        instance.loadMore();
      });
      it("should dispatch a NotifyEvent", done => {
        setup({}, action => {
          if (action && action.type === "NOTIFY_USER_EVENT") {
            assert.equal(action.type, "NOTIFY_USER_EVENT");
            assert.equal(action.data.event, "LOAD_MORE_SCROLL");
            assert.equal(action.data.page, fakeProps.pageName);
            done();
          }
        });
        instance.loadMore();
      });
    });

    describe("#maybeLoadMoreData", function() {
      it("should set this.windowHeight if it is falsey", () => {
        instance.windowHeight = null;
        instance.maybeLoadMoreData({scrollTop: 0, scrollHeight: 5000});
        assert.equal(instance.windowHeight, window.innerHeight);
      });
      it("should not call loadMore if the scrollTop is before the threshold", () => {
        setup({
          loadMoreAction: () => {
            throw new Error("Should not call loadMore");
          }
        });
        instance.windowHeight = 200;
        instance.maybeLoadMoreData({scrollTop: 0, scrollHeight: 400});
      });
      it("should loadMore if the scrollTop is past the threshold", done => {
        setup({loadMoreAction: () => done()});
        instance.windowHeight = 200;
        const scrollTop = 200 + SCROLL_TOP_OFFSET - INFINITE_SCROLL_THRESHOLD + 1;
        instance.maybeLoadMoreData({scrollTop, scrollHeight: 200});
      });
      it("should not call loadMore if canLoadMore is false", () => {
        setup({
          Feed: Object.assign({}, fakeProps.Feed, {canLoadMore: false}),
          loadMoreAction: () => {
            throw new Error("Should not call loadMore");
          }
        });
        instance.windowHeight = 200;
        instance.maybeLoadMoreData({scrollTop: 1000, scrollHeight: 200});
      });
      it("should not call loadMore if isLoading is true", () => {
        setup({
          Feed: Object.assign({}, fakeProps.Feed, {isLoading: true}),
          loadMoreAction: () => {
            throw new Error("Should not call loadMore");
          }
        });
        instance.windowHeight = 200;
        instance.maybeLoadMoreData({scrollTop: 1000, scrollHeight: 200});
      });
    });
  });

  describe("TimelineHistory", () => {
    let instance;
    const fakeProps = mockData;

    function setup(customProps = {}, dispatch) {
      const props = Object.assign({}, fakeProps, customProps);
      instance = renderWithProvider(<TimelineHistory {...props} />, dispatch && {dispatch});
    }

    beforeEach(setup);

    it("should create a page", () => {
      assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelineHistory));
    });

    it("should render the connected container with the correct props", () => {
      const container = renderWithProvider(<ConnectedTimelineHistory />);
      const inner = TestUtils.findRenderedComponentWithType(container, TimelineHistory);
      Object.keys(TimelineHistory.propTypes).forEach(key => assert.property(inner.props, key));
    });
  });

  describe("TimelineBookmarks", () => {
    let instance;
    const fakeProps = mockData;

    function setup(customProps = {}, dispatch) {
      const props = Object.assign({}, fakeProps, customProps);
      instance = renderWithProvider(<TimelineBookmarks {...props} />, dispatch && {dispatch});
    }

    beforeEach(setup);

    it("should create a page", () => {
      assert.ok(TestUtils.isCompositeComponentWithType(instance, TimelineBookmarks));
    });

    it("should render the connected container with the correct props", () => {
      const container = renderWithProvider(<ConnectedTimelineBookmarks />);
      const inner = TestUtils.findRenderedComponentWithType(container, TimelineBookmarks);
      Object.keys(TimelineBookmarks.propTypes).forEach(key => assert.property(inner.props, key));
    });
  });
});

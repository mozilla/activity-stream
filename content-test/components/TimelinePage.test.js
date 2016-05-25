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
        canLoadMore: false,
        rows: mockData.History.rows,
      },
      dateKey: "lastVisitDate",
      pageName: "TEST_PAGE",
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
        setup({
          Feed: {
            isLoading: true,
            canLoadMore: true,
            rows: [{url: "https://foo.com"}]
          }
        });
        assert.equal(loaderEl.hidden, false);
      });
    });
    // Trying to get this to work
    // describe("Scrolling", () => {
    //   let scrollEl;
    //   beforeEach(() => {
    //     scrollEl = instance.refs.scrollElement;
    //     // set the height of the wrapper to something big
    //     // so we can actually scroll
    //     instance.refs.wrapper.style.height = "3000px";
    //   });
    //   it("should trigger onScroll when the user scrolls", done => {
    //     setup({onScroll: () => done()});
    //     TestUtils.Simulate.scroll(scrollEl, {target: scrollEl, deltaY: 1});
    //   });
    // });

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

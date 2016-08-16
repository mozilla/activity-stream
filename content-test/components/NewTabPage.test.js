const React = require("react");
const TestUtils = require("react-addons-test-utils");
const ConnectedNewTabPage = require("components/NewTabPage/NewTabPage");
const {NewTabPage} = ConnectedNewTabPage;
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
const TopSites = require("components/TopSites/TopSites");
const Spotlight = require("components/Spotlight/Spotlight");
const {mockData, renderWithProvider} = require("test/test-utils");

const fakeProps = mockData;

describe("NewTabPage", () => {
  let instance;

  beforeEach(() => {
    instance = renderWithProvider(<NewTabPage {...fakeProps} dispatch={() => {}} />);
  });

  function setupConnected(dispatch = () => {}) {
    instance = TestUtils.findRenderedComponentWithType(
      renderWithProvider(<ConnectedNewTabPage />, {dispatch}),
      NewTabPage
    );
  }

  it("should create a page", () => {
    assert.ok(TestUtils.isCompositeComponentWithType(instance, NewTabPage));
  });

  it("should set the title to New Tab", () => {
    assert.equal(document.title, "New Tab");
  });

  it("should render TopSites components with correct data", () => {
    const topSites = TestUtils.findRenderedComponentWithType(instance, TopSites);
    assert.equal(topSites.props.sites, fakeProps.TopSites.rows);
  });

  it("should render Spotlight components with correct data", () => {
    const spotlightSites = TestUtils.findRenderedComponentWithType(instance, Spotlight);
    assert.equal(spotlightSites.props.sites, fakeProps.Spotlight.rows);
  });

  it("should render GroupedActivityFeed with correct data", () => {
    const activityFeed = TestUtils.findRenderedComponentWithType(instance, GroupedActivityFeed);
    assert.equal(activityFeed.props.sites, fakeProps.TopActivity.rows);
  });

  it("should render connected component with correct props", () => {
    const container = renderWithProvider(<ConnectedNewTabPage />);
    const inner = TestUtils.findRenderedComponentWithType(container, NewTabPage);
    Object.keys(NewTabPage.propTypes).forEach(key => assert.property(inner.props, key));
  });
  describe("settings", () => {
    it("should hide the settings menu by default", () => {
      assert.equal(instance.refs.settingsMenu.props.visible, false);
    });
    it("should show the settings menu when the settings button is clicked", () => {
      TestUtils.Simulate.click(instance.refs.settingsLink);
      assert.equal(instance.refs.settingsMenu.props.visible, true);
    });
    it("should show the setting button if we have recommendations", () => {
      let fakePropsWithRecommendations = Object.assign({}, mockData, {showRecommendationOption: true});
      instance = renderWithProvider(<NewTabPage {...fakePropsWithRecommendations} dispatch={() => {}} />);
      assert.equal(instance.refs.settingsLink.hidden, false);
    });
  });

  describe("hide recommendations", () => {
    it("should fire a user event when toggle recommendations is clicked", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "TOGGLE_RECOMMENDATION");
          assert.equal(a.data.page, "NEW_TAB");
          done();
        }
      });
      const toggleRecommendation = TestUtils.scryRenderedDOMComponentsWithClass(instance.refs.settingsMenu, "context-menu-link")[0];
      TestUtils.Simulate.click(toggleRecommendation);
    });
    it("should create an action when toggle recommendations is clicked", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_TOGGLE_RECOMMENDATIONS") {
          done();
        }
      });
      const toggleRecommendation = TestUtils.scryRenderedDOMComponentsWithClass(instance.refs.settingsMenu, "context-menu-link")[0];
      TestUtils.Simulate.click(toggleRecommendation);
    });
    it("should re-request highlights when toggle recommendations is clicked", done => {
      setupConnected(a => {
        if (a.type === "HIGHLIGHTS_LINKS_REQUEST") {
          done();
        }
      });
      const toggleRecommendation = TestUtils.scryRenderedDOMComponentsWithClass(instance.refs.settingsMenu, "context-menu-link")[0];
      TestUtils.Simulate.click(toggleRecommendation);
    });
  });

  describe("delete events", () => {
    it("should have the correct page, source, index for top site delete menu", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "TOP_SITES");
          assert.equal(a.data.action_position, 0);
          done();
        }
      });
      const item = TestUtils.findRenderedComponentWithType(instance, TopSites);
      const deleteLink = TestUtils.scryRenderedDOMComponentsWithClass(item, "context-menu-link")[0];
      TestUtils.Simulate.click(deleteLink);
    });
    it("should have the correct page, source, index for spotlight delete menu", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "FEATURED");
          assert.equal(a.data.action_position, 0);
          done();
        }
      });
      const item = TestUtils.findRenderedComponentWithType(instance, Spotlight);
      const deleteLink = TestUtils.scryRenderedDOMComponentsWithClass(item, "context-menu-link")[0];
      TestUtils.Simulate.click(deleteLink);
    });
    it("should have the correct page, source, index for activity feed", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "ACTIVITY_FEED");
          assert.equal(a.data.action_position, 0);
          done();
        }
      });
      const item = TestUtils.findRenderedComponentWithType(instance, GroupedActivityFeed);
      const deleteLink = TestUtils.scryRenderedDOMComponentsWithClass(item, "context-menu-link")[0];
      TestUtils.Simulate.click(deleteLink);
    });
  });
});

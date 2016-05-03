const {assert} = require("chai");
const React = require("react");
const TestUtils = require("react-addons-test-utils");
const ConnectedNewTabPage = require("components/NewTabPage/NewTabPage");
const {NewTabPage} = ConnectedNewTabPage;
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
const TopSites = require("components/TopSites/TopSites");
const Spotlight = require("components/Spotlight/Spotlight");
const Search = require("components/Search/Search");
const {mockData, renderWithProvider} = require("test/test-utils");

const fakeProps = mockData;

describe("NewTabPage", () => {
  let instance;
  let searchInstance;

  beforeEach(() => {
    instance = renderWithProvider(<NewTabPage {...fakeProps} dispatch={() => {}} />);
  });

  function setupConnected(dispatch = () => {}) {
    instance = TestUtils.findRenderedComponentWithType(
      renderWithProvider(<ConnectedNewTabPage />, {dispatch}),
      NewTabPage
    );
    searchInstance = TestUtils.findRenderedComponentWithType(instance, Search);
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
    const container = renderWithProvider(<ConnectedNewTabPage/>);
    const inner = TestUtils.findRenderedComponentWithType(container, NewTabPage);
    Object.keys(NewTabPage.propTypes).forEach(key => assert.property(inner.props, key));
  });

  describe("search", () => {
    it("should dispatch a search event when onSearch is called", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_PERFORM_SEARCH") {
          assert.equal(a.data, "hello world");
          done();
        }
      });
      searchInstance.refs.input.value = "hello world";
      TestUtils.Simulate.change(searchInstance.refs.input);
      TestUtils.Simulate.click(searchInstance.refs.button);
    });

    it("should dispatch a user event on search", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_USER_EVENT") {
          done();
        }
      });
      searchInstance.refs.input.value = "hello world";
      TestUtils.Simulate.change(searchInstance.refs.input);
      TestUtils.Simulate.click(searchInstance.refs.button);
    });
  });

  describe("settings", () => {
    it("should hide the settings menu by default", () => {
      assert.equal(instance.refs.settingsMenu.props.visible, false);
    });
    it("should show the settings menu when the settings button is clicked", () => {
      TestUtils.Simulate.click(instance.refs.settingsLink);
      assert.equal(instance.refs.settingsMenu.props.visible, true);
    });
    it("should fire a user event when unblock all is clicked", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "UNBLOCK_ALL");
          assert.equal(a.data.page, "NEW_TAB");
          done();
        }
      });
      const blockLink = TestUtils.scryRenderedDOMComponentsWithClass(instance.refs.settingsMenu, "context-menu-link")[0];
      TestUtils.Simulate.click(blockLink);
    });
    it("should create an action when unblock all is clicked", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_UNBLOCK_ALL") {
          done();
        }
      });
      const blockLink = TestUtils.scryRenderedDOMComponentsWithClass(instance.refs.settingsMenu, "context-menu-link")[0];
      TestUtils.Simulate.click(blockLink);
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

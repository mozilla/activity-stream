const React = require("react");
const TestUtils = require("react-addons-test-utils");
const ConnectedNewTabPage = require("components/NewTabPage/NewTabPage");
const {NewTabPage} = ConnectedNewTabPage;
const TopSites = require("components/TopSites/TopSites");
const Spotlight = require("components/Spotlight/Spotlight");
const Bookmarks = require("components/Bookmarks/Bookmarks");
const PocketStories = require("components/PocketStories/PocketStories");
const {mockData, renderWithProvider} = require("test/test-utils");
const {selectNewTabSites} = require("common/selectors/selectors");
const {connect} = require("react-redux");
const {injectIntl} = require("react-intl");

const fakeProps = Object.assign({}, {intl: {formatMessage: () => {}}}, mockData);

describe("NewTabPage", () => {
  let instance;

  beforeEach(() => {
    instance = renderWithProvider(<NewTabPage {...fakeProps} dispatch={() => {}} />);
  });

  /**
   * A wrapper for selectNewTabSites that always forces isReady to true.
   */
  function forceIsReadySelectNewTabs(...args) {
    let selected = selectNewTabSites(...args);
    return Object.assign(selected, {isReady: true});
  }

  /**
   * Overwrites the lexically scoped instance variable with a version
   * that is connected to the mock store.
   *
   * @param {Function} dispatch   Dispatch function for the store; defaults
   *                              to a NO-OP function
   * @param {Function} mapStatesToProps  passed through to connect().
   *                                     defaults to forceIsReadySelectNewTabs,
   *                                     since we (almost?) always want to test
   *                                     the regular display, not the placeholder
   *                                     one.
   */
  function setupConnected(
    dispatch = () => {}, mapStatesToProps = forceIsReadySelectNewTabs) {
    let ConnectedNewTabPage = connect(mapStatesToProps)(injectIntl(NewTabPage)); // eslint-disable-line no-shadow

    instance = TestUtils.findRenderedComponentWithType(
      renderWithProvider(<ConnectedNewTabPage />, {dispatch}),
      NewTabPage
    );
  }

  it("should create a page", () => {
    assert.ok(TestUtils.isCompositeComponentWithType(instance, NewTabPage));
  });

  it("should set the title to New Tab", () => {
    setupConnected();
    assert.equal(document.title, "New Tab");
  });

  it("should render TopSites components with correct data", () => {
    const topSites = TestUtils.findRenderedComponentWithType(instance, TopSites);
    assert.equal(topSites.props.sites, fakeProps.TopSites.rows);
  });

  it("should render Spotlight components with correct data", () => {
    const spotlightSites = TestUtils.findRenderedComponentWithType(instance, Spotlight);
    assert.equal(spotlightSites.props.sites, fakeProps.Highlights.rows);
  });

  it("should render Stories components with correct data", () => {
    const storiesComponent = TestUtils.findRenderedComponentWithType(instance, PocketStories);
    assert.equal(storiesComponent.props.stories, fakeProps.PocketStories.rows);
  });

  it("should render connected component with correct props", () => {
    const container = renderWithProvider(<ConnectedNewTabPage />);
    const inner = TestUtils.findRenderedComponentWithType(container, NewTabPage);
    Object.keys(NewTabPage.propTypes).forEach(key => assert.property(inner.props, key));
  });

  it("should pass placeholder=true to Spotlight, Stories, TopSites and Bookmarks when isReady is false", () => {
    instance = renderWithProvider(
      <NewTabPage {...fakeProps} dispatch={() => {}} />);

    let spotlight = TestUtils.findRenderedComponentWithType(instance, Spotlight);
    assert.equal(spotlight.props.placeholder, true);

    let stories = TestUtils.findRenderedComponentWithType(instance, PocketStories);
    assert.equal(stories.props.placeholder, true);

    let topSites = TestUtils.findRenderedComponentWithType(instance, TopSites);
    assert.equal(topSites.props.placeholder, true);

    let bookmarks = TestUtils.findRenderedComponentWithType(instance, Bookmarks);
    assert.equal(bookmarks.props.placeholder, true);
  });

  it("should pass placeholder=false to Spotlight, Stories, TopSites and Bookmarks when isReady is true", () => {
    let propsWithIsReadyTrue = Object.assign({}, fakeProps, {isReady: true});
    instance = renderWithProvider(
      <NewTabPage {...propsWithIsReadyTrue} dispatch={() => {}} />);

    let spotLight = TestUtils.findRenderedComponentWithType(instance, Spotlight);
    assert.equal(spotLight.props.placeholder, false);

    let stories = TestUtils.findRenderedComponentWithType(instance, PocketStories);
    assert.equal(stories.props.placeholder, false);

    let topSites = TestUtils.findRenderedComponentWithType(instance, TopSites);
    assert.equal(topSites.props.placeholder, false);

    let bookmarks = TestUtils.findRenderedComponentWithType(instance, Bookmarks);
    assert.equal(bookmarks.props.placeholder, false);
  });

  it("should show the Bookmarks section when showBookmarks is true", () => {
    let props = Object.assign({}, fakeProps, {isReady: true, Prefs: {prefs: {showBookmarks: true}}});
    instance = renderWithProvider(<NewTabPage {...props} dispatch={() => {}} />);

    const children = TestUtils.scryRenderedComponentsWithType(instance, Bookmarks);
    assert.equal(children.length, 1);
  });

  it("should hide the Bookmarks section when showBookmarks is false", () => {
    let props = Object.assign({}, fakeProps, {isReady: true, Prefs: {prefs: {showBookmarks: false}}});
    instance = renderWithProvider(<NewTabPage {...props} dispatch={() => {}} />);

    const children = TestUtils.scryRenderedComponentsWithType(instance, Bookmarks);
    assert.equal(children.length, 0);
  });

  describe("delete events", () => {
    it("should have the correct page, source, index for top site delete menu", done => {
      setupConnected(a => {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "TOP_SITES");
          assert.equal(a.data.action_position, 0);
          assert.equal(a.data.metadata_source, "EmbedlyTest");
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
          assert.equal(a.data.metadata_source, "EmbedlyTest");
          done();
        }
      });
      const item = TestUtils.findRenderedComponentWithType(instance, Spotlight);
      const deleteLink = TestUtils.scryRenderedDOMComponentsWithClass(item, "context-menu-link")[0];
      TestUtils.Simulate.click(deleteLink);
    });
  });

  describe("loader events", () => {
    it("should fire an event if data isn't ready and we show the loader", done => {
      renderWithProvider(<NewTabPage {...fakeProps} isReady={false} dispatch={a => {
        if (a.type === "NOTIFY_UNDESIRED_EVENT") {
          assert.equal(a.data.event, "SHOW_LOADER");
          assert.equal(a.data.source, "NEW_TAB");
          done();
        }
      }} />);
    });
  });

  describe("NewTab stats event", () => {
    it("should fire an event if data is ready", done => {
      renderWithProvider(<NewTabPage {...fakeProps} isReady={true} dispatch={a => {
        if (a.type === "NOTIFY_NEWTAB_STATS") {
          assert.equal(a.data.highlightsSize, mockData.Highlights.rows.length);
          assert.equal(a.data.topsitesSize, mockData.TopSites.rows.length);
          assert.equal(a.data.topsitesTippytop, 0);
          assert.equal(a.data.topsitesScreenshot, 0);
          assert.equal(a.data.topsitesLowResIcon, 0);
          done();
        }
      }} />);
    });
  });
});

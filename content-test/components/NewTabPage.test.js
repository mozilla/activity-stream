const {assert} = require("chai");
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
    instance = renderWithProvider(<NewTabPage {...fakeProps} />);
  });

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
});

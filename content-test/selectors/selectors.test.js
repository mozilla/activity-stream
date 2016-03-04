const {assert} = require("chai");
const {connect} = require("react-redux");
const React = require("react");
const TestUtils = require("react-addons-test-utils");
const dedupe = require("lib/dedupe");

const {
  justDispatch,
  selectSpotlight,
  dedupedSites,
  SPOTLIGHT_LENGTH
} = require("selectors/selectors");
const {rawMockData, createMockProvider} = require("test/test-utils");

const validSpotlightSite = {
  "title": "man throws alligator in wendys wptv dnt cnn",
  "url": "http://www.cnn.com/videos/tv/2016/02/09/man-throws-alligator-in-wendys-wptv-dnt.cnn",
  "description": "A Florida man faces multiple charges for throwing an alligator through a Wendy's drive-thru window. CNN's affiliate WPTV reports.",
  "lastVisitDate": 1456426160465,
  "images": [{
    "url": "http://i2.cdn.turner.com/cnnnext/dam/assets/160209053130-man-throws-alligator-in-wendys-wptv-dnt-00004611-large-169.jpg",
    "height": 259,
    "width": 460,
    "entropy": 3.98714569089,
    "size": 14757
  }]
};

const fakeState = rawMockData;
const EmptyComponent = React.createClass({render: () => (<div />)});

function connectSelectorToComponent(selector, InnerComponent = EmptyComponent) {
  const Provider = createMockProvider();
  const Connected = connect(justDispatch)(InnerComponent);
  const instance = TestUtils.renderIntoDocument(<Provider><Connected /></Provider>);
  return TestUtils.findRenderedComponentWithType(instance, InnerComponent);
}

describe("selectors", () => {
  describe("justDispatch", () => {
    it("should return an empty state object", () => {
      assert.deepEqual(justDispatch(fakeState), {});
    });
    it("should pass dispatch to inner element", () => {
      const instance = connectSelectorToComponent(justDispatch);
      assert.property(instance.props, "dispatch");
      assert.isFunction(instance.props.dispatch);
    });
  });
  describe("selectSpotlight", () => {
    let state = selectSpotlight(fakeState);

    // Tests that provided sites don't get selected, because they don't
    // match the conditions for spotlight to use them
    function assertInvalidSite(site) {
      const testSite = Object.assign({}, validSpotlightSite, site);
      const emptyState = selectSpotlight({History: {rows: [testSite]}});
      assert.lengthOf(emptyState.rows, 0);
    }

    it("should have the same properties as History", () => {
      assert.deepEqual(Object.keys(state), Object.keys(fakeState.History));
    });
    it("should add a bestImage for each item", () => {
      state.rows.forEach(site => {
        assert.property(site, "bestImage");
        assert.isObject(site.bestImage);
        assert.property(site.bestImage, "url");
      });
    });
    it("should skip sites that do not have a title", () => {
      assertInvalidSite({
        title: null
      });
    });
    it("should skip sites that do not have a description", () => {
      assertInvalidSite({
        description: null
      });
    });
    it("should skip sites for which the title equals the description", () => {
      assertInvalidSite({
        title: "foo",
        description: "foo"
      });
    });
    it("should skip sites that do not have an images prop or an empty array", () => {
      assertInvalidSite({
        images: null
      });
      assertInvalidSite({
        images: []
      });
    });
  });
  describe("dedupedSites", () => {
    let state = dedupedSites(fakeState);
    it("should return the right properties", () => {
      [
        "Bookmarks",
        "History",
        "Spotlight",
        "TopActivity",
        "TopSites"
      ].forEach(prop => {
        assert.property(state, prop);
      });
    });
    it("should not modify Bookmarks or History", () => {
      assert.equal(state.Bookmarks, fakeState.Bookmarks);
      assert.equal(state.History, fakeState.History);
    });
    it("should use first 3 items of selectSpotlight for Spotlight", () => {
      assert.deepEqual(state.Spotlight.rows, selectSpotlight(fakeState).rows.slice(0, SPOTLIGHT_LENGTH));
    });
    it("should dedupe TopSites, Spotlight, and TopActivity", () => {
      const groups = [state.TopSites.rows, state.Spotlight.rows, state.TopActivity.rows];
      assert.deepEqual(groups, dedupe.group(groups));
    });
  });
});

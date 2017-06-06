const ConnectedSpotlight = require("components/Spotlight/Spotlight");
const ConnectedBookmarks = require("components/Bookmarks/Bookmarks");
const {SpotlightItem} = ConnectedSpotlight;
const {Bookmarks, PlaceholderBookmarks} = ConnectedBookmarks;
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {mockData, faker, renderWithProvider} = require("test/test-utils");
const fakeBookmarkItems = mockData.Bookmarks.rows;
const fakeNonBookmarkItems = mockData.Highlights.rows;
const fakeSiteWithImage = faker.createSite();
const getBestImage = require("common/getBestImage");

fakeSiteWithImage.bestImage = fakeSiteWithImage.images[0];

describe("Bookmarks", () => {
  let instance;
  let el;
  let stubDispatcher;

  describe("valid sites", () => {
    beforeEach(() => {
      stubDispatcher = sinon.stub();
      instance = renderWithProvider(<Bookmarks dispatch={stubDispatcher} sites={fakeBookmarkItems} prefs={{}} />);
      el = ReactDOM.findDOMNode(instance);
    });

    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render a SpotlightItem for each item", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      assert.equal(children.length, 3);
    });
    it("should filter out any items that are not bookmarks", () => {
      instance = renderWithProvider(<Bookmarks dispatch={stubDispatcher}
                                               sites={fakeNonBookmarkItems}
                                               prefs={{collapseBookmarks: false}} />);
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      assert.equal(children.length, 0);
    });
    it("should display a placeholder when no bookmarks are available", () => {
      instance = renderWithProvider(<Bookmarks dispatch={stubDispatcher}
                                               sites={fakeNonBookmarkItems}
                                               prefs={{collapseBookmarks: false}} />);
      const children = TestUtils.scryRenderedComponentsWithType(instance, PlaceholderBookmarks);
      assert.equal(children.length, 1);
    });
    it("should show placeholder if props.placeholder is true", () => {
      instance = renderWithProvider(<Bookmarks dispatch={stubDispatcher}
                                               placeholder={true}
                                               sites={fakeBookmarkItems}
                                               prefs={{collapseBookmarks: false}} />);
      const children = TestUtils.scryRenderedComponentsWithType(instance, PlaceholderBookmarks);
      assert.equal(children.length, 1);
    });
    it("should show provide bestImage prop to SpotlightItems", () => {
      let i;
      instance = renderWithProvider(<Bookmarks dispatch={stubDispatcher}
                                               placeholder={false}
                                               sites={fakeBookmarkItems}
                                               prefs={{collapseBookmarks: false}} />);
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      for (i = 0; i < children.length; i++) {
        assert.equal(children[i].props.bestImage, getBestImage(fakeBookmarkItems[i].images));
      }
    });
    it("should show provide `BOOKMARKS` source prop to SpotlightItems", () => {
      let i;
      instance = renderWithProvider(<Bookmarks dispatch={stubDispatcher}
                                               placeholder={false}
                                               sites={fakeBookmarkItems}
                                               prefs={{collapseBookmarks: false}} />);
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      for (i = 0; i < children.length; i++) {
        assert.equal(children[i].props.source, "BOOKMARKS");
      }
    });
  });

  describe("actions", () => {
    it("should fire a click event when an item is clicked", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "CLICK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "BOOKMARKS");
          assert.equal(a.data.action_position, 0);
          assert.equal(a.data.metadata_source, "EmbedlyTest");
          assert.equal(a.data.highlight_type, fakeBookmarkItems[0].type);
          done();
        }
      }
      instance = renderWithProvider(<Bookmarks page={"NEW_TAB"} dispatch={dispatch} sites={fakeBookmarkItems} prefs={{}} />);
      TestUtils.Simulate.click(TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem)[0].refs.link);
    });
  });
});

const ConnectedSpotlight = require("components/Spotlight/Spotlight");
const ConnectedVisitAgain = require("components/VisitAgain/VisitAgain");
const {SpotlightItem} = ConnectedSpotlight;
const {VisitAgain} = ConnectedVisitAgain;
const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {mockData, renderWithProvider} = require("test/test-utils");
const fakeVisitAgainItems = mockData.VisitAgain.rows;
const {VISITAGAIN_DISPLAYED_LENGTH} = require("common/constants");
const getBestImage = require("common/getBestImage");
const CollapsibleSection = require("components/CollapsibleSection/CollapsibleSection");

describe("Bookmarks", () => {
  let instance;
  let el;
  let stubDispatcher;

  describe("valid sites", () => {
    beforeEach(() => {
      stubDispatcher = sinon.stub();
      instance = renderWithProvider(<VisitAgain dispatch={stubDispatcher} sites={fakeVisitAgainItems} prefs={{}} />);
      el = ReactDOM.findDOMNode(instance);
    });

    it("should create the element", () => {
      assert.ok(el);
    });
    it("should not render if placeholder prop is true", () => {
      instance = renderWithProvider(<VisitAgain dispatch={stubDispatcher} sites={fakeVisitAgainItems}
                                                prefs={{}} placeholder={true} />);
      el = ReactDOM.findDOMNode(instance);
      assert.equal(el, null);
    });
    it("should not render if there are no items to display", () => {
      instance = renderWithProvider(<VisitAgain dispatch={stubDispatcher} sites={[]}
                                                prefs={{}} placeholder={false} />);
      el = ReactDOM.findDOMNode(instance);
      assert.equal(el, null);
    });
    it("should render correct number of SpotlightItems", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);

      // Make sure more than VISITAGAIN_DISPLAY_LENGTH sites are provided and
      // component actually slices down to the correct number.
      assert.isTrue(instance.props.sites.length > VISITAGAIN_DISPLAYED_LENGTH);
      assert.equal(children.length, VISITAGAIN_DISPLAYED_LENGTH);
    });
    it("should show provide `VISITAGAIN` source prop to SpotlightItems", () => {
      let i;
      instance = renderWithProvider(<VisitAgain dispatch={stubDispatcher}
                                               placeholder={false}
                                               sites={fakeVisitAgainItems}
                                               prefs={{collapseVisitAgain: false}} />);

      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);

      for (i = 0; i < children.length; i++) {
        assert.equal(children[i].props.source, "VISITAGAIN");
      }
    });
    it("should show provide bestImage prop to SpotlightItems", () => {
      let i;
      instance = renderWithProvider(<VisitAgain dispatch={stubDispatcher}
                                               placeholder={false}
                                               sites={fakeVisitAgainItems}
                                               prefs={{collapseVisitAgain: false}} />);
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      for (i = 0; i < children.length; i++) {
        assert.equal(children[i].props.bestImage, getBestImage(fakeVisitAgainItems[i].images));
      }
    });
    it("should pass props.prefs to CollapsibleSection component", () => {
      instance = renderWithProvider(<VisitAgain dispatch={stubDispatcher}
                                                placeholder={false}
                                                sites={fakeVisitAgainItems}
                                                prefs={{collapseVisitAgain: true}} />);

      const comp = TestUtils.findRenderedComponentWithType(instance, CollapsibleSection);

      assert.deepEqual(comp.props.prefs, instance.props.prefs);
    });
    it("should pass `collapseVisitAgain` to CollapsibleSection component", () => {
      instance = renderWithProvider(<VisitAgain dispatch={stubDispatcher}
                                                placeholder={false}
                                                sites={fakeVisitAgainItems}
                                                prefs={{collapseVisitAgain: true}} />);

      const comp = TestUtils.findRenderedComponentWithType(instance, CollapsibleSection);

      assert.equal(comp.props.prefName, "collapseVisitAgain");
    });
  });

  describe("actions", () => {
    it("should fire a click event when an item is clicked", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "CLICK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "VISITAGAIN");
          assert.equal(a.data.action_position, 0);
          assert.equal(a.data.metadata_source, "EmbedlyTest");
          assert.equal(a.data.highlight_type, fakeVisitAgainItems[0].type);
          done();
        }
      }
      instance = renderWithProvider(<VisitAgain page={"NEW_TAB"} dispatch={dispatch} sites={fakeVisitAgainItems} prefs={{}} />);
      TestUtils.Simulate.click(TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem)[0].refs.link);
    });
  });
});

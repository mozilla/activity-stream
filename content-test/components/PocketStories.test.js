const ConnectedSpotlight = require("components/Spotlight/Spotlight");
const {SpotlightItem} = ConnectedSpotlight;

const {POCKET_STORIES_LENGTH, POCKET_TOPICS_LENGTH} = require("common/constants");
const ConnectedPocketStories = require("components/PocketStories/PocketStories");
const {PocketStories} = ConnectedPocketStories;

const React = require("react");
const ReactDOM = require("react-dom");
const TestUtils = require("react-addons-test-utils");
const {mockData, renderWithProvider} = require("test/test-utils");
const fakePocketStories = mockData.PocketStories.rows;
const fakePocketTopics = mockData.PocketTopics.rows;

describe("PocketStories", () => {
  let instance;
  let el;

  describe("valid stories", () => {
    beforeEach(() => {
      instance = renderWithProvider(<PocketStories stories={fakePocketStories}
        topics={fakePocketTopics} dispatch={() => {}} />);
      el = ReactDOM.findDOMNode(instance);
    });
    it("should create the element", () => {
      assert.ok(el);
    });
    it("should render a SpotlightItem for each item", () => {
      const children = TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem);
      assert.equal(POCKET_STORIES_LENGTH, children.length);
    });
    it("should render the Read More section", () => {
      const readMore = TestUtils.scryRenderedDOMComponentsWithClass(instance, "pocket-read-more");
      assert.equal(1, readMore.length);

      const links = TestUtils.scryRenderedDOMComponentsWithClass(instance, "pocket-read-more-link");
      assert.equal(POCKET_TOPICS_LENGTH, links.length);
    });
    it("should render the Read Even More section", () => {
      const readEvenMore = TestUtils.scryRenderedDOMComponentsWithClass(instance, "pocket-read-even-more");
      assert.equal(1, readEvenMore.length);
    });
    it("should render the Pocket Info panel", () => {
      const pocketInfo = TestUtils.scryRenderedDOMComponentsWithClass(instance, "pocket-info");
      assert.equal(1, pocketInfo.length);
    });
    it("should render the Pocket Feedback form", () => {
      const pocketFeedback = TestUtils.scryRenderedDOMComponentsWithClass(instance, "pocket-feedback");
      assert.equal(1, pocketFeedback.length);
    });
    it("should not render PocketStories if no stories available", () => {
      let emptyInstance = renderWithProvider(<PocketStories stories={[]} topics={fakePocketTopics} dispatch={() => {}} />);
      el = ReactDOM.findDOMNode(emptyInstance);
      assert.notOk(el);
    });
  });

  describe("actions", () => {
    it("should fire a click event when an item is clicked", done => {
      function dispatch(a) {
        if (a.type === "NOTIFY_USER_EVENT") {
          assert.equal(a.data.event, "CLICK");
          assert.equal(a.data.page, "NEW_TAB");
          assert.equal(a.data.source, "RECOMMENDED");
          assert.equal(a.data.action_position, 0);
          done();
        }
      }
      instance = renderWithProvider(<PocketStories page={"NEW_TAB"} dispatch={dispatch}
        stories={fakePocketStories} topics={fakePocketTopics} />);
      TestUtils.Simulate.click(TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem)[0].refs.link);
    });
  });

  describe("impression stats", () => {
    it("should fire impression stats events", done => {
      let verifiedView = false;
      function dispatch(a) {
        if (a.type === "NOTIFY_IMPRESSION_STATS") {
          assert.equal(a.data.source, "pocket");

          if (!verifiedView) {
            assert.deepEqual(a.data.tiles, [
              {id: fakePocketStories[0].guid},
              {id: fakePocketStories[1].guid},
              {id: fakePocketStories[2].guid}
            ]);
            verifiedView = true;
          } else {
            assert.equal(a.data.click, 0);
            assert.deepEqual(a.data.tiles, [{id: fakePocketStories[0].guid, pos: 0}]);
            done();
          }
        }
      }
      instance = renderWithProvider(<PocketStories page={"NEW_TAB"} dispatch={dispatch}
        stories={fakePocketStories} topics={fakePocketTopics} />);
      TestUtils.Simulate.click(TestUtils.scryRenderedComponentsWithType(instance, SpotlightItem)[0].refs.link);
    });
  });
});

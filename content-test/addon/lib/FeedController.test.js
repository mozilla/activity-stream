const FeedController = require("addon/lib/FeedController");
const Feed = require("addon/lib/Feed");
const {createStore, applyMiddleware} = require("redux");

// This is just for creating a fake store
const placeholderReducer = (prevState = 0, action) => action.type === "ADD" && prevState + 1;

class TestFeed extends Feed {
  constructor(options) {
    super(options);
    this.onAction = sinon.spy();
  }
}

describe("FeedController", () => {
  it("should create instances of options.feeds with other options", () => {
    const options = {
      feeds: [Feed],
      foo: "foo",
      bar: "bar"
    };
    const feeds = new FeedController(options);
    const firstFeed = feeds.feeds[0];
    assert.instanceOf(firstFeed, Feed);
    assert.deepEqual(firstFeed.options, {foo: "foo", bar: "bar"});
  });
  describe("#connectStore", () => {
    it("should set the .store on each feed", () => {
      const feeds = new FeedController({feeds: [Feed, Feed], getCachedMetadata() {}, fetchNewMetadata() {}});
      const store = {};
      feeds.connectStore(store);
      feeds.feeds.forEach(f => assert.equal(f.store, store));
    });
  });
  describe("#reduxMiddleware", () => {
    let feeds;
    let firstFeed;
    let store;
    beforeEach(() => {
      feeds = new FeedController({feeds: [TestFeed], getCachedMetadata() {}, fetchNewMetadata() {}});
      firstFeed = feeds.feeds[0];
      store = createStore(placeholderReducer, applyMiddleware(feeds.reduxMiddleware));
    });
    it("should have .reduxMiddleware", () => {
      assert.isFunction(feeds.reduxMiddleware);
    });
    it("should call onAction with currentState, action", () => {
      // Start with 0
      assert.equal(store.getState(), 0);

      // Dispatch action to add 1 to store
      const action = {type: "ADD"};
      store.dispatch(action);
      assert.equal(store.getState(), 1);

      // Make sure the onAction was called with the new state, not the old state
      assert.calledWith(firstFeed.onAction, 1, action);
    });
    it("should catch errors in onAction without affecting others", () => {
      class ErrorFeed extends Feed {
        constructor(options) {
          super(options);
          this.onAction = sinon.spy(() => {
            throw new Error("error in onAction");
          });
        }
      }
      feeds = new FeedController({feeds: [ErrorFeed, TestFeed], getCachedMetadata() {}, fetchNewMetadata() {}});
      store = createStore(placeholderReducer, applyMiddleware(feeds.reduxMiddleware));

      // Make sure the error does not throw
      assert.doesNotThrow(() => {
        store.dispatch({type: "ADD"});
      });

      // Make sure all onACtion were called
      feeds.feeds.forEach(f => assert.calledOnce(f.onAction));
    });
  });
});

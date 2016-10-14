const Feeds = require("addon/Feeds/Feeds");
const Feed = require("addon/Feeds/Feed");
const {createStore, applyMiddleware} = require("redux");

// This is just for creating a fake store
const placeholderReducer = (prevState = 0, action) => action.type === "ADD" && prevState + 1;

class TestFeed extends Feed {
  constructor(options) {
    super(options);
    this.reducer = sinon.spy();
  }
}

describe("Feeds", () => {
  it("should create instances of options.feeds with getMetadata", () => {
    const getMetadata = sinon.spy();
    const feeds = new Feeds({feeds: [Feed], getMetadata});
    const firstFeed = feeds.feeds[0];
    assert.instanceOf(firstFeed, Feed);
    assert.equal(firstFeed.getMetadata, getMetadata);
  });
  describe("#connectStore", () => {
    it("should set the .store on each feed", () => {
      const feeds = new Feeds({feeds: [Feed, Feed], getMetadata() {}});
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
      feeds = new Feeds({feeds: [TestFeed], getMetadata() {}});
      firstFeed = feeds.feeds[0];
      store = createStore(placeholderReducer, applyMiddleware(feeds.reduxMiddleware));
    });
    it("should have .reduxMiddleware", () => {
      assert.isFunction(feeds.reduxMiddleware);
    });
    it("should call reducers with currentState, action", () => {
      // Start with 0
      assert.equal(store.getState(), 0);

      // Dispatch action to add 1 to store
      const action = {type: "ADD"};
      store.dispatch(action);
      assert.equal(store.getState(), 1);

      // Make sure the reducer was called with the new state, not the old state
      assert.calledWith(firstFeed.reducer, 1, action);
    });
    it("should catch errors in reducers without affecting others", () => {
      class ErrorFeed extends Feed {
        constructor(options) {
          super(options);
          this.reducer = sinon.spy(() => {
            throw new Error("error in reducer");
          });
        }
      }
      feeds = new Feeds({feeds: [ErrorFeed, TestFeed], getMetadata() {}});
      store = createStore(placeholderReducer, applyMiddleware(feeds.reduxMiddleware));

      // Make sure the error does not throw
      assert.doesNotThrow(() => {
        store.dispatch({type: "ADD"});
      });

      // Make sure all reducers were called
      feeds.feeds.forEach(f => assert.calledOnce(f.reducer));
    });
  });
});

const PageWorker = require("addon/PageWorker");
const {LOCAL_STORAGE_KEY} = require("common/constants");
const {ADDON_TO_CONTENT} = require("common/event-constants");
const redux = require("redux");

// Test reducer that adds action.data to a total
function reducer(state = 0, action) {
  return action.type === "add" ? (state + action.number) : state;
}
function createStore() {
  return redux.createStore(reducer, 0);
}

describe("PageWorker", () => {
  let pageWorker;
  let store;
  beforeEach(() => {
    store = createStore();
    pageWorker = new PageWorker({store});
  });
  afterEach(() => pageWorker.destroy());
  it("should create a PageWorker with a store", () => {
    assert.equal(pageWorker._store, store);
    assert.isNull(pageWorker._page);
    assert.isNull(pageWorker._unsubscribe);
  });
  it("should throw if you try to create a PageWorker without a store", () => {
    assert.throws(() => {
      assert.ok(new PageWorker());
    }, "options.store is required");
  });
  describe("#connect", () => {
    it("should create a Page instance and ._unsubscribe", () => {
      pageWorker.connect();
      assert.isObject(pageWorker._page);
      assert.isFunction(pageWorker._unsubscribe);
    });
    it("should subscribe to the store with ._onDispatch", () => {
      sinon.spy(pageWorker, "_onDispatch");
      pageWorker.connect();
      store.dispatch({type: "add", number: 42});
      assert.equal(store.getState(), 42);
      assert.called(pageWorker._onDispatch);
    });
  });
  describe("_onDispatch", () => {
    it("should emit a message to Page instance when store dispatches an action", () => {
      store.dispatch({type: "add", number: 3});
      assert(store.getState(), 3);
      pageWorker.connect();
      pageWorker._onDispatch();

      const expectedMessage = {type: LOCAL_STORAGE_KEY, data: 3};
      pageWorker._page.port.emit.calledWith(ADDON_TO_CONTENT, expectedMessage);
    });
  });
  describe("#destroy", () => {
    it("should not throw if called twice or without connect", () => {
      pageWorker.destroy();
      pageWorker.destroy();
    });
    it("should set ._onDispatch to null", () => {
      pageWorker._onDispatch = null;
    });
    it("should destroy ._page and set ._page to null", () => {
      pageWorker.connect();
      const page = pageWorker._page;
      pageWorker.destroy();
      assert.isNull(pageWorker._page);
      assert.calledOnce(page.destroy);
    });
    it("should unsubscribe from the store", () => {
      sinon.spy(pageWorker, "_onDispatch");
      pageWorker.connect();
      store.dispatch({type: "add", number: 2});
      pageWorker.destroy();
      store.dispatch({type: "add", number: 8});

      assert.equal(store.getState(), 10);
      assert.isNull(pageWorker._unsubscribe);
      // Should only have called once, for the dispatch before pageWorker was destroyed
      assert.calledOnce(pageWorker._onDispatch);
    });
  });
});

const PageWorker = require("addon/PageWorker");
const {LOCAL_STORAGE_KEY} = require("common/constants");
const {ADDON_TO_CONTENT} = require("common/event-constants");
const redux = require("redux");

// Test reducer that adds action.data to a total
function reducer(state = {number: 0}, action) {
  return action.type === "add" ? ({number: state.number + action.number}) : state;
}
function createStore() {
  return redux.createStore(reducer, {number: 0});
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
      assert.deepEqual(store.getState(), {number: 42});
      assert.called(pageWorker._onDispatch);
    });
  });
  describe("_onDispatch", () => {
    it("should emit a message to Page instance when store dispatches an action", () => {
      pageWorker.connect();
      store.dispatch({type: "add", number: 3});

      const expectedMessage = {type: LOCAL_STORAGE_KEY, data: {number: 3}};
      assert.calledWith(pageWorker._page.port.emit, ADDON_TO_CONTENT, expectedMessage);
      assert.deepEqual(pageWorker._store.getState(), {number: 3});
    });
    it("should not emit a message if the state did not change", () => {
      pageWorker.connect();
      store.dispatch({type: "other"});
      assert.notCalled(pageWorker._page.port.emit);
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

      assert.deepEqual(store.getState(), {number: 10});
      assert.isNull(pageWorker._unsubscribe);
      // Should only have called once, for the dispatch before pageWorker was destroyed
      assert.calledOnce(pageWorker._onDispatch);
    });
  });
});

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
  let clock;
  beforeEach(() => {
    store = createStore();
    pageWorker = new PageWorker({store});
    clock = sinon.useFakeTimers();
  });
  afterEach(() => {
    pageWorker.destroy();
    clock.restore();
  });
  it("should create a PageWorker with a store", () => {
    assert.equal(pageWorker._store, store);
    assert.isNull(pageWorker._page);
    assert.isNull(pageWorker._unsubscribe);
    assert.equal(pageWorker._wait, 1000);
  });
  it("should allow overriding ._wait", () => {
    const pw = new PageWorker({store, wait: 300});
    assert.equal(pw._wait, 300);
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
      clock.tick(pageWorker._wait);
      assert.deepEqual(store.getState(), {number: 42});
      assert.called(pageWorker._onDispatch);
    });
  });
  describe("_onDispatch", () => {
    it("should debounce according to the ._wait value", () => {
      sinon.spy(pageWorker, "_onDispatch");
      pageWorker.connect();
      store.dispatch({type: "add", number: 10});
      store.dispatch({type: "add", number: 2});
      store.dispatch({type: "add", number: 8});
      clock.tick(pageWorker._wait);
      assert.deepEqual(store.getState(), {number: 20});
      assert.calledOnce(pageWorker._onDispatch);
    });
    it("should emit a message to Page instance when store dispatches an action", () => {
      pageWorker.connect();
      store.dispatch({type: "add", number: 3});
      clock.tick(pageWorker._wait);
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
    it("should catch errors in _page.destroy", () => {
      pageWorker.connect();
      pageWorker._page.destroy = () => {
        throw new Error();
      };
      assert.doesNotThrow(() => {
        pageWorker.destroy();
        assert.isNull(pageWorker._page);
      });
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
      clock.tick(pageWorker._wait);
      pageWorker.destroy();
      store.dispatch({type: "add", number: 8});
      clock.tick(pageWorker._wait);

      assert.deepEqual(store.getState(), {number: 10});
      assert.isNull(pageWorker._unsubscribe);
      // Should only have called once, for the dispatch before pageWorker was destroyed
      assert.calledOnce(pageWorker._onDispatch);
    });
  });
});

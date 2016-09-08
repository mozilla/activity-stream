const PageWorker = require("addon/PageWorker");

function createStore() {
  return {
    _unsubscribe: () => {},
    getState: () => {},
    dispatch: () => {},
    subscribe() {
      return this._unsubscribe;
    }
  };
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
  describe("#connect", () => {
    it("should create a page and subscribe", () => {
      pageWorker.connect();
      assert.isObject(pageWorker._page);
      assert.equal(pageWorker._unsubscribe, store._unsubscribe);
    });
  });
});

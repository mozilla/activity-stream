const {Store} = require("lib/Store.jsm");
const {actionTypes: at} = require("common/Actions.jsm");
const {createStore} = require("redux");
const {addNumberReducer} = require("test/unit/utils");

describe("Store", () => {
  let sandbox;
  let store;
  before(() => {
    sandbox = sinon.sandbox.create();
  });
  beforeEach(() => {
    store = new Store();
  });
  afterEach(() => sandbox.restore());
  it("should have an empty feeds Set", () => {
    assert.instanceOf(store.feeds, Set);
    assert.equal(store.feeds.size, 0, ".feeds.size");
  });
  it("should have a redux store at ._store", () => {
    assert.ok(store._store);
    assert.property(store, "dispatch");
    assert.property(store, "getState");
  });
  describe("#init", () => {
    it("should dispatch an init action", () => {
      sandbox.spy(store, "dispatch");

      store.init();

      assert.calledWith(store.dispatch, {type: at.INIT});
    });
    it("should dispatch an init action", () => {
      sandbox.spy(store, "dispatch");

      store.init([]);

      assert.calledWith(store.dispatch, {type: at.INIT});
    });
    it("should add each feed to store.feeds", () => {
      const s = {};

      store.init([s]);

      assert.isTrue(store.feeds.has(s), ".feeds.has(s)");
    });
    it("should add a reference to the store to each feed", () => {
      const s = {};

      store.init([s]);

      assert.equal(s.store, store, "s.store");
    });
  });
  describe("#uninit", () => {
    it("should clear .feeds", () => {
      store.init([{}, {}, {}]);
      assert.equal(store.feeds.size, 3);

      store.uninit();

      assert.equal(store.feeds.size, 0);
    });
    it("should dispatch an uninit action", () => {
      sandbox.spy(store, "dispatch");

      store.uninit();

      assert.calledWith(store.dispatch, {type: at.UNINIT});
    });
  });
  describe("#getState", () => {
    it("should return the redux state", () => {
      store._store = createStore((prevState = 123) => prevState);
      const {getState} = store;
      assert.equal(getState(), 123);
    });
  });
  describe("#dispatch", () => {
    it("should call .onAction of each feed", () => {
      const {dispatch} = store;
      const sub = {onAction: sinon.spy()};
      const action = {type: "FOO"};

      store.init([sub]);

      dispatch(action);

      assert.calledWith(sub.onAction, action);
    });
    it("should call the reducers", () => {
      const {dispatch} = store;
      store._store = createStore(addNumberReducer);

      dispatch({type: "ADD", data: 14});

      assert.equal(store.getState(), 14);
    });
  });
  describe("#subscribe", () => {
    it("should subscribe to changes to the store", () => {
      const sub = sinon.spy();
      const action = {type: "FOO"};

      store.subscribe(sub);
      store.dispatch(action);

      assert.calledOnce(sub);
    });
  });
});

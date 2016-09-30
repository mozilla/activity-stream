const createStore = require("common/create-store");
const {actions} = require("common/action-manager");
const {createRows} = require("test/faker");

// These tests ensure that all our reducers
// do not unintentionally create new objects
describe("Reducers", () => {
  let store;
  // Dispatch a fake action that contains an array of links
  function dispatchRows(type, length = 10) {
    store.dispatch(actions.Response(type, createRows({length})));
  }
  beforeEach(() => {
    store = createStore({logger: false});
  });
  it("should return a reference", () => {
    assert.strictEqual(store.getState(), store.getState());
  });
  it("should cause a state change for a related reducer", () => {
    dispatchRows("TOP_FRECENT_SITES_RESPONSE", 6);
    const newState = store.getState();
    assert.equal(newState.TopSites.rows.length, 6);
  });
  it("should not modify other unrelated state", () => {
    const oldState = store.getState();
    dispatchRows("TOP_FRECENT_SITES_RESPONSE", 6);
    const newState = store.getState();
    assert.strictEqual(newState.Highlights, oldState.Highlights);
  });
  it("should not modify any state for unused actions", () => {
    const oldState = store.getState();
    store.dispatch(actions.Notify("NOTIFY_PERFORMANCE", {}));
    const newState = store.getState();
    Object.keys(oldState).forEach(key => {
      assert.equal(newState[key], oldState[key], key);
    });
  });
});

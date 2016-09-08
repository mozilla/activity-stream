const createStore = require("common/create-store");
const {LOCAL_STORAGE_KEY} = require("common/constants");

function assertIsStore(store) {
  assert.isObject(store);
  assert.property(store, "dispatch");
  assert.property(store, "getState");
  assert.property(store, "subscribe");
}

describe("createStore", () => {
  let consoleLog;
  before(() => {
    consoleLog = console.log; // eslint-disable-line no-console
    console.log = sinon.spy(); // eslint-disable-line no-console
  });
  after(() => {
    console.log = consoleLog; // eslint-disable-line no-console
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  });
  it("should create a redux store", () => {
    const store = createStore();
    assertIsStore(store);
  });
  it("should attach a logger if .logger = true", () => {
    const store = createStore({logger: true});
    const action = {type: "FOO"};
    store.dispatch(action);
    assert.calledWith(console.log, "ACTION", action); // eslint-disable-line no-console
  });
  it("should rehydrate from local storage if .rehydrate = true", () => {
    const state = {Prefs: "foo"};
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    const store = createStore({rehydrate: true});
    assert.equal(store.getState().Prefs, "foo");
  });
});

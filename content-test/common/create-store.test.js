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

describe("_mergeStateReducer", () => {
  describe("should return a reducer that...", () => {
    it("should return the result of calling the first arg if action.type !== MERGE_STORE", () => {
      const action = {type: "FOO"};
      const mainReducerStub = sinon.stub().returnsArg(0);
      const fakeState = {monkey: "orangutan"};

      const mergeStateReducer = createStore._mergeStateReducer(mainReducerStub);
      const state = mergeStateReducer(fakeState, action);

      assert.calledWith(mainReducerStub, fakeState, action);
      assert.deepEqual(state, fakeState);
    });

    it("should return action.data merged into the previous state if action === MERGE_STORE", () => {
      const fakePrevState = {sheep: 1, dog: 2, monkey: 3};
      const fakeState = {monkey: 4};
      const action = {type: "MERGE_STORE", data: fakeState};

      const mergeStateReducer = createStore._mergeStateReducer(sinon.stub());
      const state = mergeStateReducer(fakePrevState, action);

      assert.deepEqual(state, {sheep: 1, dog: 2, monkey: 4});
    });
  });
});

describe("_rehydrationIntervalCallback", () => {
  it("should dispatch MERGE_STORE if selectors aren't ready", () => {
    const fakeStoreState = {TopSites: {init: null}};
    const fakeStore = {
      dispatch: sinon.stub(),
      getState: () => fakeStoreState
    };

    createStore._rehydrationIntervalCallback(fakeStore);

    assert.calledWith(fakeStore.dispatch, {type: "MERGE_STORE", data: {}});
  });
});

describe("_startRehydrationPolling", () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });
  afterEach(() => {
    sandbox.restore();
  });

  it("should set a timer to call rehydrationIntervalCallback", () => {
    const setIntervalStub = sandbox.stub(window, "setInterval");

    createStore._startRehydrationPolling();

    assert.calledOnce(setIntervalStub);
  });
});

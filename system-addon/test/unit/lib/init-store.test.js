const initStore = require("content-src/lib/init-store");
const {MERGE_STORE_ACTION} = initStore;
const {GlobalOverrider, addNumberReducer} = require("test/unit/utils");
const {actionCreators: ac} = require("common/Actions.jsm");

describe("initStore", () => {
  let globals;
  let store;
  beforeEach(() => {
    globals = new GlobalOverrider();
    globals.set("sendAsyncMessage", globals.sandbox.spy());
    globals.set("addMessageListener", globals.sandbox.spy());
    store = initStore({number: addNumberReducer});
  });
  afterEach(() => globals.restore());
  it("should create a store with the provided reducers", () => {
    assert.ok(store);
    assert.property(store.getState(), "number");
  });
  it("should add a listener that dispatches MERGE_STORE_ACTION", () => {
    assert.calledWith(global.addMessageListener, initStore.INCOMING_MESSAGE_NAME);
    const listener = global.addMessageListener.firstCall.args[1];
    globals.sandbox.spy(store, "dispatch");
    globals.sandbox.stub(store, "getState").returns({App: {initialized: false}});
    const message = {name: initStore.INCOMING_MESSAGE_NAME, data: {type: MERGE_STORE_ACTION}};

    listener(message);

    assert.calledWith(store.dispatch, message.data);
  });
  it("should not dispatch incoming actions if MERGE_STORE_ACTION was never received", () => {
    const listener = global.addMessageListener.firstCall.args[1];
    globals.sandbox.spy(store, "dispatch");
    const message = {name: initStore.INCOMING_MESSAGE_NAME, data: {type: "FOO"}};

    listener(message);

    assert.notCalled(store.dispatch);
  });
  it("should dispatch incoming actions if MERGE_STORE_ACTION was received", () => {
    const listener = global.addMessageListener.firstCall.args[1];
    const dispatchSpy = globals.sandbox.spy(store, "dispatch");
    const message = {name: initStore.INCOMING_MESSAGE_NAME, data: {type: "FOO"}};

    // First dispatch the merge store action
    listener({name: initStore.INCOMING_MESSAGE_NAME, data: {type: MERGE_STORE_ACTION}});
    dispatchSpy.reset();
    // Now dispatch the message
    listener(message);

    assert.calledWith(store.dispatch, message.data);
  });
  it("should not throw if addMessageListener is not defined", () => {
    // Note: this is being set/restored by GlobalOverrider
    delete global.addMessageListener;

    assert.doesNotThrow(() => initStore({number: addNumberReducer}));
  });
  it("should initialize with an initial state if provided as the second argument", () => {
    store = initStore({number: addNumberReducer}, {number: 42});

    assert.equal(store.getState().number, 42);
  });
  it("should log errors from failed messages", () => {
    const callback = global.addMessageListener.firstCall.args[1];
    globals.sandbox.stub(global.console, "error");
    globals.sandbox.stub(store, "dispatch").throws(Error("failed"));

    const message = {name: initStore.INCOMING_MESSAGE_NAME, data: {type: MERGE_STORE_ACTION}};
    callback(message);

    assert.calledOnce(global.console.error);
  });
  it("should replace the state if a MERGE_STORE_ACTION is dispatched", () => {
    store.dispatch({type: initStore.MERGE_STORE_ACTION, data: {number: 42}});
    assert.deepEqual(store.getState(), {number: 42});
  });
  it("should send out SendToMain actions", () => {
    const action = ac.SendToMain({type: "FOO"});
    store.dispatch(action);
    assert.calledWith(global.sendAsyncMessage, initStore.OUTGOING_MESSAGE_NAME, action);
  });
  it("should not send out other types of ations", () => {
    store.dispatch({type: "FOO"});
    assert.notCalled(global.sendAsyncMessage);
  });
});

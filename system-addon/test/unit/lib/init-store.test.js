const initStore = require("content-src/lib/init-store");
const {GlobalOverrider, addNumberReducer} = require("test/unit/utils");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {childReducers} = require("common/Reducers.jsm");

describe("initStore", () => {
  let globals;
  let store;
  beforeEach(() => {
    globals = new GlobalOverrider();
    globals.set("sendAsyncMessage", globals.sandbox.spy());
    globals.set("addMessageListener", globals.sandbox.spy());
    store = initStore({number: addNumberReducer, DidFirstRender: childReducers.DidFirstRender});
  });
  afterEach(() => globals.restore());
  it("should create a store with the provided reducers", () => {
    assert.ok(store);
    assert.property(store.getState(), "number");
  });
  it("should not add the listener for incoming actions before the FIRST_REACT_RENDER action", () => {
    assert.notCalled(global.addMessageListener);
  });
  it("should add a listener for incoming actions after the FIRST_REACT_RENDER action", () => {
    globals.sandbox.spy(store, "dispatch");

    store.dispatch({type: at.FIRST_REACT_RENDER});
    store.dispatch.reset();
    assert.calledWith(global.addMessageListener, initStore.INCOMING_MESSAGE_NAME);

    const callback = global.addMessageListener.firstCall.args[1];
    const message = {name: initStore.INCOMING_MESSAGE_NAME, data: {type: "FOO"}};
    callback(message);

    assert.calledWith(store.dispatch, message.data);
  });
  it("should merge in the state if a MERGE_STORE_ACTION is dispatched", () => {
    store.dispatch({type: initStore.MERGE_STORE_ACTION, data: {number: 42}});
    assert.deepEqual(store.getState().number, 42);
  });
  it("should send out SendToMain ations", () => {
    const action = ac.SendToMain({type: "FOO"});
    store.dispatch(action);
    assert.calledWith(global.sendAsyncMessage, initStore.OUTGOING_MESSAGE_NAME, action);
  });
  it("should not send out other types of ations", () => {
    store.dispatch({type: "FOO"});
    assert.notCalled(global.sendAsyncMessage);
  });
});

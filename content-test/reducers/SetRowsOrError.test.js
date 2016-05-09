const {assert} = require("chai");
const setRowsOrError = require("reducers/SetRowsOrError");
const REQUEST_TYPE = "RECENT_LINKS_REQUEST";
const RESPONSE_TYPE = "RECENT_LINKS_RESPONSE";

describe("setRowsOrError", () => {
  let reducer;
  beforeEach(() => {
    reducer = setRowsOrError(REQUEST_TYPE, RESPONSE_TYPE);
  });

  it("should return a function", () => {
    assert.isFunction(reducer);
  });

  it("should leave the state unchanged for unrelated events", () => {
    const action = {type: "OTHER_REQUEST"};
    assert.deepEqual(reducer(undefined, action), setRowsOrError.DEFAULTS);
  });

  it("should set the loading state to true if a request is received", () => {
    const action = {type: REQUEST_TYPE};
    const state = reducer(undefined, action);
    assert.isTrue(state.isLoading);
  });

  it("should set init to true/loading to false when a response is received", () => {
    const action = {type: RESPONSE_TYPE};
    const state = reducer(undefined, action);
    assert.isTrue(state.init);
    assert.isFalse(state.isLoading);
  });

  it("should not set init to true and loading to false when a response with error is received", () => {
    const action = {type: RESPONSE_TYPE, error: true};
    const state = reducer(undefined, action);
    assert.isFalse(state.init);
    assert.isFalse(state.isLoading);
  });

  it("should set rows", () => {
    const rows = [{url: "a"}, {url: "b"}];
    const action = {type: RESPONSE_TYPE, data: rows};
    const state = reducer(undefined, action);
    assert.deepEqual(state.rows, rows);
  });

  it("should append rows for append type action", () => {
    const prevRows = [{url: "x"}, {url: "y"}];
    const newRows = [{url: "a"}, {url: "b"}];
    const action = {type: RESPONSE_TYPE, data: newRows, meta: {append: true}};
    const state = reducer(Object.assign({}, setRowsOrError.DEFAULTS, {rows: prevRows}), action);
    assert.deepEqual(state.rows, prevRows.concat(newRows));
  });

  it("should set an error if the action contains an error ", () => {
    const action = {type: RESPONSE_TYPE, error: true, data: new Error("Test")};
    const state = reducer(undefined, action);
    assert.deepEqual(state.error, action.data);
  });

  it("should set rows to empty for non-append error actions", () => {
    const action = {type: RESPONSE_TYPE, error: true, data: new Error("Test")};
    const state = reducer(undefined, action);
    assert.deepEqual(state.rows, []);
  });

  it("should leave rows unchanged for append-type error actions", () => {
    const action = {type: RESPONSE_TYPE, error: true, meta: {append: true}, data: new Error("Test")};
    const prevRows = [{url: "a"}, {url: "b"}];
    const state = reducer(Object.assign({}, setRowsOrError.DEFAULTS, {rows: prevRows}), action);
    assert.deepEqual(state.rows, prevRows);
  });

  ((event) => {
    it(`should remove a row removed via ${event}`, () => {
      const action = {type: event, data: "http://foo.com"};
      const prevRows = [{url: "http://foo.com"}, {url: "http://bar.com"}];
      const state = reducer(Object.assign({}, setRowsOrError.DEFAULTS, {rows: prevRows}), action);
      assert.deepEqual(state.rows, [{url: "http://bar.com"}]);
    });
  })("NOTIFY_HISTORY_DELETE", "NOTIFY_BLOCK_URL");

});

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

  it("should set canLoadMore to true by default", () => {
    const action = {
      type: RESPONSE_TYPE,
      data: [{url: "a"}, {url: "b"}]
    };
    const state = reducer(undefined, action);
    assert.isTrue(state.canLoadMore);
  });

  it("should set canLoadMore to false when data is missing", () => {
    const state = reducer(undefined, {type: RESPONSE_TYPE});
    assert.isFalse(state.canLoadMore);
  });

  it("should set canLoadMore to false when there are 0 items", () => {
    const state = reducer(undefined, {type: RESPONSE_TYPE, data: []});
    assert.isFalse(state.canLoadMore);
  });

  it("should set canLoadMore to false when the results are less than the querySize", () => {
    reducer = setRowsOrError(REQUEST_TYPE, RESPONSE_TYPE, 3);
    const state = reducer(undefined, {type: RESPONSE_TYPE, data: [{url: "a"}, {url: "b"}]});
    assert.isFalse(state.canLoadMore);
  });

  it("should set canLoadMore to true when the results are equal to the querySize", () => {
    reducer = setRowsOrError(REQUEST_TYPE, RESPONSE_TYPE, 3);
    const state = reducer(undefined, {type: RESPONSE_TYPE, data: [{url: "a"}, {url: "b"}, {url: "c"}]});
    assert.isTrue(state.canLoadMore);
  });

  it("should set bookmark status of history items on RECEIVE_BOOKMARK_ADDED", () => {
    const action = {
      type: "RECEIVE_BOOKMARK_ADDED",
      data: {
        bookmarkGuid: "bookmark123",
        lastModified: 1234124,
        frecency: 200,
        bookmarkTitle: "foo",
        url: "https://foo.com"
      }
    };
    const prevRows = [
      {type: "history", url: "blah.com"},
      {type: "history", url: "https://foo.com", frecency: 1}
    ];
    const result = reducer(Object.assign({}, setRowsOrError.DEFAULTS, {rows: prevRows}), action);
    const newRow = result.rows[1];
    assert.equal(newRow.bookmarkGuid, action.data.bookmarkGuid, "should have the right bookmarkGuid");
    assert.equal(newRow.bookmarkDateCreated, action.data.lastModified, "should have the right bookmarkDateCreated");
    assert.equal(newRow.frecency, action.data.frecency, "should have the right frecency");
    assert.equal(newRow.bookmarkTitle, action.data.bookmarkTitle, "should have the right bookmarkTitle");
  });

  it("should remove bookmark status of history items on RECEIVE_BOOKMARK_REMOVED", () => {
    const action = {
      type: "RECEIVE_BOOKMARK_REMOVED",
      data: {
        url: "https://foo.com",
        bookmarkId: 123
      }
    };
    const prevRows = [
      {type: "history", url: "blah.com"},
      {
        type: "history",
        bookmarkGuid: "bookmark123",
        bookmarkDateCreated: 1234124,
        frecency: 200,
        bookmarkTitle: "foo",
        url: "https://foo.com"
      }
    ];
    const result = reducer(Object.assign({}, setRowsOrError.DEFAULTS, {rows: prevRows}), action);
    const newRow = result.rows[1];
    assert.isUndefined(newRow.bookmarkGuid, "should remove bookmarkGuid");
    assert.isUndefined(newRow.bookmarkDateCreated, "should remove bookmarkDateCreated");
    assert.equal(newRow.frecency, prevRows[1].frecency, "should not change the frecency");
    assert.isUndefined(newRow.bookmarkTitle, "should remove bookmarkTitle");
  });

  (event => {
    it(`should remove a row removed via ${event}`, () => {
      const action = {type: event, data: "http://foo.com"};
      const prevRows = [{url: "http://foo.com"}, {url: "http://bar.com"}];
      const state = reducer(Object.assign({}, setRowsOrError.DEFAULTS, {rows: prevRows}), action);
      assert.deepEqual(state.rows, [{url: "http://bar.com"}]);
    });
  })("NOTIFY_HISTORY_DELETE", "NOTIFY_BLOCK_URL");

  it("should remove a bookmark for \"RECEIVE_BOOKMARK_REMOVED\" if request type is \"RECENT_BOOKMARKS_REQUEST\"", () => {
    reducer = setRowsOrError("RECENT_BOOKMARKS_REQUEST", "RECENT_LINKS_RESPONSE");
    const action = {type: "RECEIVE_BOOKMARK_REMOVED", data: {url: "http://foo.com", id: 123}};
    const prevRows = [{url: "http://foo.com", bookmarkGuid: "boorkmarkFOO"}, {url: "http://bar.com", bookmarkGuid: "boorkmarkBAR"}];
    const state = reducer(Object.assign({}, setRowsOrError.DEFAULTS, {rows: prevRows}), action);
    assert.deepEqual(state.rows, [{url: "http://bar.com", bookmarkGuid: "boorkmarkBAR"}]);
  });
});

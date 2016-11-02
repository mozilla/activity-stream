const SearchFeed = require("addon/Feeds/SearchFeed");

describe("SearchFeed", () => {
  let instance;
  let searchProvider;
  let store;
  beforeEach(() => {
    store = {dispatch: sinon.spy()};
    searchProvider = {
      currentState: {engines: [{name: "foo"}, {name: "bar"}], currentEngine: {name: "foo"}},
      searchSuggestionUIStrings: {searchString: "Search"}
    };
    instance = new SearchFeed({searchProvider});
    instance.connectStore(store);
  });
  it("should create a SearchFeed", () => {
    assert.instanceOf(instance, SearchFeed);
  });

  describe("#getUIStrings", () => {
    it("should dispatch a SEARCH_UISTRINGS_RESPONSE action", () => {
      instance.getUIStrings();
      assert.calledOnce(store.dispatch);
      assert.equal(store.dispatch.firstCall.args[0].type, "SEARCH_UISTRINGS_RESPONSE");
    });
    it("should dispatch the search suggestion UI strings", () => {
      instance.getUIStrings();
      assert.equal(store.dispatch.firstCall.args[0].data, searchProvider.searchSuggestionUIStrings);
    });
  });

  describe("#getEngines", () => {
    it("should dispatch SEARCH_STATE_UPDATED action", () => {
      instance.getEngines();
      assert.calledOnce(store.dispatch);
      assert.equal(store.dispatch.firstCall.args[0].type, "SEARCH_STATE_UPDATED");
    });
    it("should dispatch current state and current engine", () => {
      instance.getEngines();
      const {data} = store.dispatch.firstCall.args[0];
      assert.deepEqual(data, {engines: searchProvider.currentState.engines, currentEngine: JSON.stringify(searchProvider.currentState.currentEngine)});
    });
  });

  describe("#onAction", () => {
    beforeEach(() => {
      instance.getEngines = sinon.spy();
      instance.getUIStrings = sinon.spy();
    });
    it("should call getEngines + getUIStrings on APP_INIT", () => {
      instance.onAction({}, {type: "APP_INIT"});
      assert.calledOnce(instance.getEngines);
      assert.calledOnce(instance.getUIStrings);
    });
    it("should call getEngines on SEARCH_ENGINES_CHANGED", () => {
      instance.onAction({}, {type: "SEARCH_ENGINES_CHANGED"});
      assert.calledOnce(instance.getEngines);
    });
  });
});

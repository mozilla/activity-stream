const am = require("common/action-manager");
const FAKE_BROWSER = {};
const SearchFeed = require("inject!addon/Feeds/SearchFeed")({"addon/lib/getCurrentBrowser": () => FAKE_BROWSER});

describe("SearchFeed", () => {
  let instance;
  let searchProvider;
  let store;
  beforeEach(() => {
    store = {dispatch: sinon.spy()};
    searchProvider = {
      currentEngine: {},
      currentState: {engines: [{name: "foo"}, {name: "bar"}], currentEngine: {name: "foo"}},
      cycleCurrentEngine: sinon.spy(),
      asyncPerformSearch: sinon.spy(),
      removeFormHistoryEntry: sinon.spy(),
      manageEngines: sinon.spy()
    };
    instance = new SearchFeed({searchProvider, send: sinon.spy()});
    instance.connectStore(store);
  });
  it("should create a SearchFeed", () => {
    assert.instanceOf(instance, SearchFeed);
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

  describe("#getSuggestions", () => {
    it("should call options.searchProvider.asyncGetSuggestions", () => {
      const action = {data: "a"};
      searchProvider.asyncGetSuggestions = sinon.spy(() => Promise.resolve([]));
      instance.getSuggestions(action);
      assert.calledWith(searchProvider.asyncGetSuggestions, FAKE_BROWSER);
    });
    it("should call options.send with the right data", () => {
      const action = {data: "a", workerId: "abc23jaskj2"};
      const suggestions = ["ab", "abc"];
      searchProvider.asyncGetSuggestions = () => Promise.resolve(suggestions);
      return instance.getSuggestions(action).then(() => {
        assert.calledOnce(instance.options.send);
        assert.calledWith(instance.options.send, am.actions.Response("SEARCH_SUGGESTIONS_RESPONSE", suggestions), action.workerId, true);
      });
    });
  });

  describe("#cycleCurrentEngine", () => {
    it("should call searchProvider.cycleCurrentEngine", () => {
      const action = {data: {}};
      instance.cycleCurrentEngine(action);
      assert.calledWith(searchProvider.cycleCurrentEngine, action.data);
    });
    it("should call options.send with the right data", () => {
      const action = {data: {}, workerId: "Adsj2kk"};
      instance.cycleCurrentEngine(action);
      assert.calledWith(
        instance.options.send,
        am.actions.Response("SEARCH_CYCLE_CURRENT_ENGINE_RESPONSE", {currentEngine: searchProvider.currentEngine}),
        action.workerId
      );
    });
  });

  describe("#doSearch", () => {
    it("should call searchProvider.asyncPerformSearch", () => {
      instance.doSearch({data: "foo"});
      assert.calledWith(searchProvider.asyncPerformSearch, FAKE_BROWSER, "foo");
    });
  });

  describe("#removeFormHistoryEntry", () => {
    it("should call searchProvider.removeFormHistoryEntry", () => {
      instance.removeFormHistoryEntry({data: "foo"});
      assert.calledWith(searchProvider.removeFormHistoryEntry, FAKE_BROWSER, "foo");
    });
  });

  describe("#manageEngines", () => {
    it("should call searchProvider.manageEngines", () => {
      instance.manageEngines();
      assert.calledWith(searchProvider.manageEngines, FAKE_BROWSER);
    });
  });

  describe("#onAction", () => {
    it("should call getEngines on APP_INIT", () => {
      instance.getEngines = sinon.spy();
      instance.onAction({}, {type: "APP_INIT"});
      assert.calledOnce(instance.getEngines);
    });
    it("should call getEngines on SEARCH_ENGINES_CHANGED", () => {
      instance.getEngines = sinon.spy();
      instance.onAction({}, {type: "SEARCH_ENGINES_CHANGED"});
      assert.calledOnce(instance.getEngines);
    });
    it("should call doSearch on NOTIFY_PERFORM_SEARCH", () => {
      instance.doSearch = sinon.spy();
      const action = {type: "NOTIFY_PERFORM_SEARCH"};
      instance.onAction({}, action);
      assert.calledWith(instance.doSearch, action);
    });
    it("should call doSearch on NOTIFY_MANAGE_ENGINES", () => {
      instance.manageEngines = sinon.spy();
      const action = {type: "NOTIFY_MANAGE_ENGINES"};
      instance.onAction({}, action);
      assert.calledOnce(instance.manageEngines);
    });
    it("should call cycleCurrentEngines on SEARCH_CYCLE_CURRENT_ENGINE_REQUEST", () => {
      instance.cycleCurrentEngine = sinon.spy();
      const action = {type: "SEARCH_CYCLE_CURRENT_ENGINE_REQUEST"};
      instance.onAction({}, action);
      assert.calledWith(instance.cycleCurrentEngine, action);
    });
  });
});

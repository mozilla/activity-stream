const {
  SnippetsMap,
  SnippetsProvider,
  SNIPPETS_UPDATE_INTERVAL_MS,
  addSnippetsSubscriber
} = require("content-src/lib/snippets.js");
const {createStore, combineReducers} = require("redux");
const {reducers} = require("common/Reducers.jsm");
const {actionTypes: at} = require("common/Actions.jsm");

describe("SnippetsMap", () => {
  let snippetsMap;
  beforeEach(() => {
    snippetsMap = new SnippetsMap();
  });
  afterEach(async () => {
    await snippetsMap.clear();
  });
  describe("#set", () => {
    it("should set a value without connecting a db", async() => {
      await snippetsMap.set("foo", 123);
      assert.equal(snippetsMap.get("foo"), 123);
    });
    it("should set an item in indexedDB when connected", async () => {
      await snippetsMap.connect();
      await snippetsMap.set("foo", 123);

      // destroy the old snippetsMap, create a new one
      snippetsMap = new SnippetsMap();
      await snippetsMap.connect();
      assert.equal(snippetsMap.get("foo"), 123);
    });
  });
  describe("#delete", () => {
    it("should delete a value without connecting a db", async() => {
      snippetsMap.set("foo", 123);
      assert.isTrue(snippetsMap.has("foo"));

      await snippetsMap.delete("foo");

      assert.isFalse(snippetsMap.has("foo"));
    });
    it("should delete an item from indexedDB when connected", async () => {
      await snippetsMap.connect();
      await snippetsMap.set("foo", 123);
      await snippetsMap.set("bar", 123);
      await snippetsMap.delete("foo");

      // destroy the old snippetsMap, create a new one
      snippetsMap = new SnippetsMap();
      await snippetsMap.connect();
      assert.isFalse(snippetsMap.has("foo"));
      assert.isTrue(snippetsMap.has("bar"));
    });
  });
  describe("#clear", () => {
    it("should clear all items without connecting a db", async() => {
      snippetsMap.set("foo", 123);
      snippetsMap.set("bar", 123);
      assert.propertyVal(snippetsMap, "size", 2);

      await snippetsMap.clear();

      assert.propertyVal(snippetsMap, "size", 0);
    });
    it("should clear the indexedDB store when connected", async () => {
      await snippetsMap.connect();
      snippetsMap.set("foo", 123);
      snippetsMap.set("bar", 123);
      await snippetsMap.clear();

      // destroy the old snippetsMap, create a new one
      snippetsMap = new SnippetsMap();
      await snippetsMap.connect();
      assert.propertyVal(snippetsMap, "size", 0);
    });
  });
});

describe("SnippetsProvider", () => {
  let sandbox;
  let snippets;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(window, "fetch").returns(Promise.resolve(""));
  });
  afterEach(async () => {
    if (global.gSnippetsMap) {
      await global.gSnippetsMap.clear();
    }
    delete global.gSnippetsMap;
    sandbox.restore();
  });
  it("should create a gSnippetsMap", () => {
    snippets = new SnippetsProvider();
    assert.instanceOf(global.gSnippetsMap, SnippetsMap);
  });
  describe("#init(options)", () => {
    beforeEach(() => {
      snippets = new SnippetsProvider();
      sandbox.stub(snippets, "_refreshSnippets").returns(Promise.resolve());
      sandbox.stub(snippets, "_showRemoteSnippets");
      sandbox.stub(snippets, "_showDefaultSnippets");
    });
    it("should connect to the database by default", () => {
      sandbox.stub(global.gSnippetsMap, "connect").returns(Promise.resolve());

      snippets.init();

      assert.calledOnce(global.gSnippetsMap.connect);
    });
    it("should log connection errors without throwing", async () => {
      sandbox.stub(global.console, "error");
      sandbox.stub(global.gSnippetsMap, "connect").returns(() => { throw new Error(); });
      await snippets.init();

      assert.calledOnce(global.console.error);
    });
    it("should not call connect if options.connect is false", async () => {
      sandbox.stub(global.gSnippetsMap, "connect").returns(Promise.resolve());

      await snippets.init({connect: false});

      assert.notCalled(global.gSnippetsMap.connect);
    });
    it("should call _refreshSnippets and _showRemoteSnippets", async () => {
      await snippets.init({connect: false});

      assert.calledOnce(snippets._refreshSnippets);
      assert.calledOnce(snippets._showRemoteSnippets);
    });
    it("should call _showDefaultSnippets if _showRemoteSnippets throws an error", async () => {
      snippets._showRemoteSnippets.callsFake(() => { throw new Error("error"); });
      await snippets.init({connect: false});

      assert.calledOnce(snippets._showDefaultSnippets);
    });
    it("should set each item in .appData in gSnippetsMap as appData.{item}", async () => {
      await snippets.init({connect: false, appData: {foo: 123, bar: "hello"}});
      assert.equal(snippets.snippetsMap.get("appData.foo"), 123);
      assert.equal(snippets.snippetsMap.get("appData.bar"), "hello");
    });
  });
  describe("#_refreshSnippets", () => {
    let clock;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
      snippets = new SnippetsProvider();
      global.gSnippetsMap.set("snippets-cached-version", 4);
    });
    afterEach(() => {
      clock.restore();
    });
    it("should clear gSnippetsMap if the cached version is different than the current version or missing", async () => {
      sandbox.spy(global.gSnippetsMap, "clear");
      await snippets.init({connect: false, appData: {version: 5, snippetsURL: "foo.com"}});
      assert.calledOnce(global.gSnippetsMap.clear);

      global.gSnippetsMap.clear.reset();
      global.gSnippetsMap.delete("snippets-cached-version");
      await snippets.init({connect: false, appData: {version: 5, snippetsURL: "foo.com"}});
      assert.calledOnce(global.gSnippetsMap.clear);
    });
    it("should not clear gSnippetsMap if the cached version the same as the current version", async () => {
      sandbox.spy(global.gSnippetsMap, "clear");
      await snippets.init({connect: false, appData: {version: 4, snippetsURL: "foo.com"}});
      assert.notCalled(global.gSnippetsMap.clear);
    });
    it("should fetch new data if no last update time was cached", async () => {
      await snippets.init({connect: false, appData: {version: 4, snippetsURL: "foo.com"}});
      assert.calledOnce(global.fetch);
    });
    it("should fetch new data if it has been at least SNIPPETS_UPDATE_INTERVAL_MS since the last update", async () => {
      global.gSnippetsMap.set("snippets-last-update", Date.now());
      clock.tick(SNIPPETS_UPDATE_INTERVAL_MS + 1);

      await snippets.init({connect: false, appData: {version: 4, snippetsURL: "foo.com"}});

      assert.calledOnce(global.fetch);
    });
    it("should NOT fetch new data if it has been less than 4 hours since the last update", async () => {
      global.gSnippetsMap.set("snippets-last-update", Date.now());

      clock.tick(5);

      await snippets.init({connect: false, appData: {version: 4, snippetsURL: "foo.com"}});

      assert.notCalled(global.fetch);
    });
    it("should set payload, last-update, and cached-version after fetching", async () => {
      clock.tick(7);
      global.fetch.returns(Promise.resolve({status: 200, text: () => Promise.resolve("foo123")}));

      await snippets.init({connect: false, appData: {version: 5, snippetsURL: "foo.com"}});

      assert.equal(global.gSnippetsMap.get("snippets"), "foo123");
      assert.equal(global.gSnippetsMap.get("snippets-last-update"), 7);
      assert.equal(global.gSnippetsMap.get("snippets-cached-version"), 5);
    });
    it("should catch fetch errors gracefully", async () => {
      sandbox.stub(global.console, "error");
      global.fetch.returns(Promise.reject({status: 400}));

      await snippets.init({connect: false, appData: {version: 5, snippetsURL: "foo.com"}});

      assert.calledOnce(global.console.error);
    });
  });
  describe("#_showRemoteSnippets", () => {
    beforeEach(() => {
      snippets = new SnippetsProvider();
      sandbox.stub(snippets, "_refreshSnippets").returns(Promise.resolve());
      sandbox.stub(snippets, "_showDefaultSnippets");
      let fakeEl = {style: {}, getElementsByTagName() { return [{parentNode: {replaceChild() {}}}]; }};
      sandbox.stub(global.document, "getElementById").returns(fakeEl);
    });
    it("should call _showDefaultSnippets if no snippets element exists", async() => {
      global.gSnippetsMap.set("snippets", "foo123");
      global.document.getElementById.returns(null);
      await snippets.init({connect: false});

      assert.calledOnce(snippets._showDefaultSnippets);
      const error = snippets._showDefaultSnippets.firstCall.args[0];
      assert.match(error.message, "No element was found");
    });
    it("should call _showDefaultSnippets if no payload is found", async() => {
      global.gSnippetsMap.set("snippets", "");
      await snippets.init({connect: false});

      const error = snippets._showDefaultSnippets.firstCall.args[0];
      assert.match(error.message, "No remote snippets were found");
    });
    it("should not call _showDefaultSnippets if the payload and element are ok", async() => {
      global.gSnippetsMap.set("snippets", "foo123");
      await snippets.init({connect: false});
      assert.notCalled(snippets._showDefaultSnippets);
    });
  });
});

describe("addSnippetsSubscriber", () => {
  let store;
  let sandbox;
  let snippets;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    store = createStore(combineReducers(reducers));
    sandbox.spy(store, "subscribe");

    snippets = addSnippetsSubscriber(store);

    sandbox.stub(snippets, "init");
  });
  afterEach(async () => {
    sandbox.restore();
    if (global.gSnippetsMap) {
      await global.gSnippetsMap.clear();
    }
    delete global.gSnippetsMap;
  });
  it("should not initialize SnippetsProvider if .initialized is false", () => {
    store.dispatch({type: "FOO"});

    assert.calledOnce(store.subscribe);
    assert.notCalled(snippets.init);
  });
  it("should initialize SnippetsProvider if .initialize and .onboardingFinished are true ", () => {
    store.dispatch({type: at.SNIPPETS_DATA, data: {onboardingFinished: true}});
    assert.calledOnce(snippets.init);
  });
  it("should not initialize SnippetsProvider if .initialize is true and .onboardingFinished is false", () => {
    store.dispatch({type: at.SNIPPETS_DATA, data: {onboardingFinished: false}});
    assert.notCalled(snippets.init);
  });
});

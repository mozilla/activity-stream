const createPrefsProvider = require("inject!addon/PrefsProvider");
const {SimplePrefs} = require("shims/sdk/simple-prefs");

describe("PrefsProvider", () => {
  let prefsProvider;
  let simplePrefs;

  // This is just a utility to mock required options for PrefsProvider.
  // Override as necessary with the setup function.
  function setup(customPrefs = {}) {
    simplePrefs = new SimplePrefs(customPrefs);
    const {PrefsProvider} = createPrefsProvider({"sdk/simple-prefs": simplePrefs});
    prefsProvider = new PrefsProvider({
      broadcast: sinon.spy(),
      send: sinon.spy()
    });
  }

  beforeEach(() => setup());

  it("should set instance properties", () => {
    assert.property(prefsProvider, "broadcast");
    assert.property(prefsProvider, "send");
  });

  describe("#init", () => {
    it("should add a listener for event changes", () => {
      prefsProvider.init();
      assert.property(prefsProvider, "onPrefChange");
      assert.isFunction(prefsProvider.onPrefChange, "prefsProvider.onPrefChange");
      assert.calledWith(simplePrefs.on, "", prefsProvider.onPrefChange);
    });
  });

  describe("onPrefChange", () => {
    // Note: onPrefChange doesn't exist until init is called
    beforeEach(() => prefsProvider.init());

    it("should broadcast an action with the right properties", () => {
      simplePrefs.prefs.foo = false;
      prefsProvider.onPrefChange("foo");
      assert.calledOnce(prefsProvider.broadcast);

      const action = prefsProvider.broadcast.firstCall.args[0];
      assert.equal(action.type, "PREF_CHANGED_RESPONSE", "should have the right action message");
      assert.equal(action.data.name, "foo", "should have the right data.name");
      assert.equal(action.data.value, false, "should have the right data.value");
    });
  });

  describe("#destroy", () => {
    it("should remove the event listener", () => {
      prefsProvider.init();
      assert.calledOnce(simplePrefs.on);
      const callback = simplePrefs.on.firstCall.args[1];
      prefsProvider.destroy();
      assert.calledWith(simplePrefs.off, "", callback);
    });
  });

  describe("#actionHandler", () => {
    it("should not call .send for other event types", () => {
      prefsProvider.actionHandler({msg: {type: "HIGHLIGHTS_LINKS_REQUEST"}, worker: {}});
      assert.callCount(prefsProvider.send, 0);
    });
    it("should respond to PREFS_REQUEST", () => {
      setup({foo: true, bar: false});
      const worker = {};
      prefsProvider.actionHandler({msg: {type: "PREFS_REQUEST"}, worker});
      assert.calledOnce(prefsProvider.send);

      const [action, sentWorker] = prefsProvider.send.firstCall.args;
      assert.equal(action.type, "PREFS_RESPONSE", "should have the right action type");
      assert.deepEqual(action.data, {foo: true, bar: false}, "should send all prefs");
      assert.equal(sentWorker, worker, "should send to the right worker");
    });
    it("should change prefs on NOTIFY_UPDATE_PREF", () => {
      setup({foo: true});
      assert.isTrue(simplePrefs.prefs.foo);
      prefsProvider.actionHandler({msg: {type: "NOTIFY_UPDATE_PREF", data: {name: "foo", value: false}}, worker: {}});
      assert.isFalse(simplePrefs.prefs.foo, "should set prefs.foo to false");
    });
  });
});

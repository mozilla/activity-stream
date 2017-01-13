const createPrefsProvider = require("inject!addon/PrefsProvider");
const {SimplePrefs} = require("shims/sdk/simple-prefs");

describe("PrefsProvider", () => {
  let prefsProvider;
  let simplePrefs;
  let tabTracker = {};

  // This is just a utility to mock required options for PrefsProvider.
  // Override as necessary with the setup function.
  function setup(customPrefs = {}) {
    tabTracker.handleUserEvent = sinon.spy();
    simplePrefs = new SimplePrefs(customPrefs);
    const {PrefsProvider} = createPrefsProvider({"sdk/simple-prefs": simplePrefs});
    prefsProvider = new PrefsProvider({
      eventTracker: tabTracker,
      broadcast: sinon.spy()
    });
  }

  beforeEach(() => setup());

  it("should set instance properties", () => {
    assert.property(prefsProvider.options, "eventTracker");
    assert.property(prefsProvider.options, "broadcast");
  });

  describe("#init", () => {
    it("should add a listener for event changes", () => {
      prefsProvider.init();
      assert.property(prefsProvider, "_onPrefChange");
      assert.isFunction(prefsProvider._onPrefChange, "prefsProvider._onPrefChange");
      assert.calledWith(simplePrefs.on, "", prefsProvider._onPrefChange);
    });
  });

  describe("onPrefChange", () => {
    // Note: onPrefChange doesn't exist until init is called
    beforeEach(() => prefsProvider.init());

    it("should broadcast an action with the right properties", () => {
      simplePrefs.prefs.foo = false;
      prefsProvider._onPrefChange("foo");
      assert.calledOnce(prefsProvider.options.broadcast);

      const action = prefsProvider.options.broadcast.firstCall.args[0];
      assert.equal(action.type, "PREF_CHANGED_RESPONSE");
      assert.equal(action.data.name, "foo");
      assert.equal(action.data.value, false);
    });
    it("should send a user event ping", () => {
      simplePrefs.prefs.foo = false;
      prefsProvider._onPrefChange("foo");
      assert.calledOnce(prefsProvider.options.eventTracker.handleUserEvent);
      const action = prefsProvider.options.eventTracker.handleUserEvent.firstCall.args[0];
      assert.equal(action.event, "PREF_CHANGE");
      assert.equal(action.source, "foo");
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
});

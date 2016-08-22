const {PrefsProvider} = require("../../lib/PrefsProvider");
const EventEmitter = require("eventemitter2");

class SimplePrefsMock extends EventEmitter {
  constructor(prefs) {
    super();
    this.prefs = prefs || {};
  }
}

describe("PrefsProvider", () => {
  let prefsProvider;

  // This is just a utility to mock required options for PrefsProvider.
  // Override as necessary with the setup function.
  function setup(customOptions = {}) {
    prefsProvider = new PrefsProvider(Object.assign({}, {
      simplePrefs: new SimplePrefsMock(),
      broadcast: () => {},
      send: () => {}
    }, customOptions));
  }

  beforeEach(() => setup());

  it("should set instance properties", () => {
    assert.property(prefsProvider, "simplePrefs");
    assert.property(prefsProvider, "broadcast");
    assert.property(prefsProvider, "send");
  });

  describe("#init", () => {
    it("should add a listener for event changes", done => {
      setup({broadcast: () => done()});
      prefsProvider.init();
      assert.lengthOf(prefsProvider.simplePrefs.listeners(""), 1);
      prefsProvider.simplePrefs.emit("", "foo");
    });
    it("should broadcast an action with the right properties", done => {
      setup({
        simplePrefs: new SimplePrefsMock({foo: true}),
        broadcast(action) {
          assert.equal(action.type, "PREF_CHANGED_RESPONSE", "should have the right action message");
          assert.equal(action.data.name, "foo", "should have the right data.name");
          assert.equal(action.data.value, false, "should have the right data.value");
          done();
        }
      });
      prefsProvider.init();
      prefsProvider.simplePrefs.prefs.foo = false;
      prefsProvider.simplePrefs.emit("", "foo");
    });
  });

  describe("#destroy", () => {
    it("should remove the event listener", () => {
      prefsProvider.init();
      assert.lengthOf(prefsProvider.simplePrefs.listeners(""), 1);
      prefsProvider.destroy();
      assert.lengthOf(prefsProvider.simplePrefs.listeners(""), 0);
    });
  });

  describe("#actionHandler", () => {
    it("should not do anything for other event types", () => {
      const send = () => {
        throw new Error("Called send method");
      };
      setup({send});
      prefsProvider.actionHandler({msg: {type: "HIGHLIGHTS_LINKS_REQUEST"}, worker: {}});
    });
    it("should respond to PREFS_REQUEST", done => {
      const worker = {};
      setup({
        simplePrefs: new SimplePrefsMock({foo: true, bar: false}),
        send: (action, sentWorker) => {
          assert.equal(action.type, "PREFS_RESPONSE", "should have the right action type");
          assert.deepEqual(action.data, {foo: true, bar: false}, "should send all prefs");
          assert.equal(sentWorker, worker, "should use the right worker");
          done();
        }
      });
      prefsProvider.actionHandler({msg: {type: "PREFS_REQUEST"}, worker});
    });
    it("should change prefs on NOTIFY_UPDATE_PREF", () => {
      setup({simplePrefs: new SimplePrefsMock({foo: true})});
      assert.isTrue(prefsProvider.simplePrefs.prefs.foo);
      prefsProvider.actionHandler({msg: {type: "NOTIFY_UPDATE_PREF", data: {name: "foo", value: false}}, worker: {}});
      assert.isFalse(prefsProvider.simplePrefs.prefs.foo, "should set prefs.foo to false");
    });
  });
});

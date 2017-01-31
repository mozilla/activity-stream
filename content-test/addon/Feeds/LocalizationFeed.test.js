const LocalizationFeed = require("addon/Feeds/LocalizationFeed");
const EventEmitter = require("shims/_utils/EventEmitter");

describe("LocalizationFeed", () => {
  let instance;
  beforeEach(() => {
    instance = new LocalizationFeed({send: sinon.spy()});
  });
  it("should add a .prefsTarget", () => {
    assert.instanceOf(instance.prefsTarget, EventEmitter);
  });
  describe("#getData", () => {
    it("should return a promise", () => {
      assert.instanceOf(instance.getData(), Promise);
    });
    it("should resolve getData with the correct action", () => (
      instance.getData().then(action => {
        assert.isObject(action);
        assert.equal(action.type, "LOCALE_UPDATED");
      })
    ));
    it("should resolve with a valid locale", () => (
      instance.getData().then(action => (
        assert.include(LocalizationFeed.AVAILABLE_LOCALES, action.data)
      ))
    ));
  });
  describe("#addListeners / #removeListeners", () => {
    it("should add listeners for each pref ", () => {
      instance.addListeners();
      LocalizationFeed.LOCALE_PREFS.forEach(pref => (
        assert.calledWith(instance.prefsTarget.on, pref, instance.onPrefChange)
      ));
    });
    it("should remove listeners for each pref ", () => {
      instance.removeListeners();
      LocalizationFeed.LOCALE_PREFS.forEach(pref => (
        assert.calledWith(instance.prefsTarget.off, pref, instance.onPrefChange)
      ));
    });
  });
  describe("#onPrefChange", () => {
    it("should call .refresh with the right message", () => {
      instance.refresh = sinon.spy();
      instance.onPrefChange("foo");
      assert.calledWith(instance.refresh, "foo pref was updated");
    });
  });
  describe("#onAction", () => {
    it("should call this.refresh after APP_INIT", () => {
      instance.refresh = sinon.spy();
      instance.onAction({}, {type: "APP_INIT"});
      assert.calledOnce(instance.refresh);
    });
    it("should call this.addListeners after APP_INIT", () => {
      sinon.spy(instance, "addListeners");
      instance.onAction({}, {type: "APP_INIT"});
      assert.calledOnce(instance.addListeners);
    });
    it("should call this.removeListeners after APP_UNLOAD", () => {
      sinon.spy(instance, "removeListeners");
      instance.onAction({}, {type: "APP_UNLOAD"});
      assert.calledOnce(instance.removeListeners);
    });
  });
});

const createStoreWithState = state => ({
  state,
  getState() {
    return this.state;
  }
});

describe("PocketFeed", () => {
  let PocketFeed;
  let instance;
  beforeEach(() => {
    PocketFeed = require("inject!addon/Feeds/PocketFeed")({});
    instance = new PocketFeed({}, 0);
  });

  describe("#onAction", () => {
    let store;
    beforeEach(() => {
      instance.refresh = sinon.spy();
      store = createStoreWithState({});
      instance.connectStore(store);
    });
    it("should call refresh on APP_INIT", () => {
      instance.onAction(store.getState(), {type: "APP_INIT"});
      assert.calledOnce(instance.refresh);
    });
    it("should call refresh on PREF_CHANGED_RESPONSE for pocket experiment", () => {
      instance.onAction({}, {type: "PREF_CHANGED_RESPONSE", data: {name: "experiments.pocket"}});
      assert.calledOnce(instance.refresh);
    });
    it("should not call refresh on unrelated PREF_CHANGED_RESPONSE", () => {
      instance.onAction({}, {type: "PREF_CHANGED_RESPONSE", data: {}});
      assert.notCalled(instance.refresh);
    });
    it("should call refresh on SYSTEM_TICK", () => {
      instance.onAction({}, {type: "SYSTEM_TICK"});
      assert.calledOnce(instance.refresh);
    });
  });
});

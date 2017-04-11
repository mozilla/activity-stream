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
    it("should call refresh on SYSTEM_TICK", () => {
      instance.onAction({}, {type: "SYSTEM_TICK"});
      assert.calledOnce(instance.refresh);
    });
  });
});

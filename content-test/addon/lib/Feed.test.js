const Feed = require("addon/lib/Feed");

describe("Feed", () => {
  it("should initialize with the right properties", () => {
    const instance = new Feed();
    assert.property(instance, "store");
    assert.property(instance, "state");
    assert.property(instance.state, "inProgress");
    assert.property(instance.state, "lastUpdated");
  });
  it("should add .getCachedMetadata from options", () => {
    const options = {getCachedMetadata: () => {}};
    const instance = new Feed(options);
    assert.equal(instance.options.getCachedMetadata, options.getCachedMetadata);
  });
  it("should add .fetchNewMetadata from options", () => {
    const options = {fetchNewMetadata: () => {}};
    const instance = new Feed(options);
    assert.equal(instance.options.fetchNewMetadata, options.fetchNewMetadata);
  });
  describe("#connectStore", () => {
    it("should set .store", () => {
      const instance = new Feed();
      const store = {};
      instance.connectStore(store);
      assert.equal(instance.store, store);
    });
  });
  describe("#log", () => {
    beforeEach(() => {
      sinon.spy(console, "log"); // eslint-disable-line no-console
    });
    afterEach(() => {
      console.log.restore(); // eslint-disable-line no-console
    });
    it("should log text", () => {
      const instance = new Feed();
      instance.log("foo");
      assert.calledWith(console.log, "foo"); // eslint-disable-line no-console
    });
  });
  describe("#refresh", () => {
    let instance;
    let store;
    let resolvePromise;
    let refreshPromise;
    let clock;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
      clock.tick(100);
      instance = new Feed();
      store = {dispatch: sinon.spy()};
      instance.connectStore(store);
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      instance.getData = sinon.spy(() => promise);
      refreshPromise = instance.refresh();
    });
    afterEach(() => {
      clock.restore();
    });
    it("should catch error if .getData is not defined", () => {
      instance = new Feed();
      instance.connectStore(store);
      return instance.refresh();
    });
    it("should catch error if .store is not defined", () => {
      instance = new Feed();
      instance.getData = () => Promise.resolve();
      return instance.refresh();
    });
    it("should resolve immediatley and skip .getData if .inProgress is true", () => instance.refresh()
        .then(instance.refresh())
        .then(instance.refresh())
        .then(() => {
          assert.calledOnce(instance.getData);
        })
    );
    it("should set inProgress to true", () => {
      assert.isTrue(instance.state.inProgress);
    });
    it("should call getData", () => {
      assert.calledOnce(instance.getData);
    });
    it("should set .inProgress to false when getData resolves", () => {
      resolvePromise();
      return refreshPromise.then(() => {
        assert.isFalse(instance.state.inProgress);
      });
    });
    it("should dispatch the action", () => {
      const action = {type: "foo"};
      resolvePromise(action);
      return refreshPromise.then(() => {
        assert.calledWith(store.dispatch, action);
      });
    });
    it("should set .lastUpdated", () => {
      assert.isNull(instance.state.lastUpdated);
      resolvePromise();
      return refreshPromise.then(() => {
        // Note: Date is overridden by sinon in beforeEach, so it should be 100
        assert.equal(instance.state.lastUpdated, clock.now);
      });
    });
  });
});

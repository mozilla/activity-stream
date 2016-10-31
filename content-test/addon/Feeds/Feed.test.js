const Feed = require("addon/Feeds/Feed");

describe("Feed", () => {
  it("should initialize with the right properties", () => {
    const instance = new Feed();
    assert.property(instance, "lastUpdated");
    assert.property(instance, "inProgress");
    assert.property(instance, "store");
  });
  it("should add .getMetadata from options", () => {
    const options = {getMetadata: () => {}};
    const instance = new Feed(options);
    assert.equal(instance.options.getMetadata, options.getMetadata);
  });
  describe("#connectStore", () => {
    it("should set .store", () => {
      const instance = new Feed();
      const store = {};
      instance.connectStore(store);
      assert.equal(instance.store, store);
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
    it("should reject with an eror if .getData is not defined", done => {
      instance = new Feed();
      instance.connectStore(store);
      instance.refresh().catch(e => {
        assert.instanceOf(e, Error);
        done();
      });
    });
    it("should reject with an error if .store is not defined", () => {
      instance = new Feed();
      instance.getData = () => Promise.resolve();
      return instance.refresh().catch(e => {
        assert.instanceOf(e, Error);
      });
    });
    it("should resolve immediatley and skip .getData if .inProgress is true", () => {
      instance.refresh()
      .then(instance.refresh())
      .then(instance.refresh())
      .then(() => {
        assert.calledOnce(instance.getData);
      });
    });
    it("should set inProgress to true", () => {
      assert.isTrue(instance.inProgress);
    });
    it("should call getData", () => {
      assert.calledOnce(instance.getData);
    });
    it("should set .inProgress to false when getData resolves", () => {
      resolvePromise();
      return refreshPromise.then(() => {
        assert.isFalse(instance.inProgress);
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
      assert.isNull(instance.lastUpdated);
      resolvePromise();
      return refreshPromise.then(() => {
        // Note: Date is overridden by sinon in beforeEach, so it should be 100
        assert.equal(instance.lastUpdated, clock.now);
      });
    });
  });
});

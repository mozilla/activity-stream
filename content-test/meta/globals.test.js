/* globals Task, Services */
describe("globals", () => {
  describe("Services", () => {
    it("should exist", () => {
      assert.ok(Services);
    });
    it("should have a notifyObservers method", () => {
      assert.isFunction(Services.obs.notifyObservers);
    });
  });
  describe("Task", () => {
    it("should exist", () => {
      assert.ok(Task);
    });
    it("should have a working .spawn method", done => {
      Task.spawn(function*() {
        const result = yield new Promise(resolve => resolve(42));
        assert.equal(result, 42);
        done();
      });
    });
    it("should have a working .async method", done => {
      const fn = Task.async(function*() {
        const result = yield new Promise(resolve => resolve(42));
        assert.equal(result, 42);
        done();
      });
      fn();
    });
  });
});

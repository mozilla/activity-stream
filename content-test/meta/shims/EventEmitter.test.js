const EventEmitter = require("shims/_utils/EventEmitter");
const noop = () => {};

describe("EventEmitter", () => {
  let instance = new EventEmitter();
  beforeEach(() => {
    instance = new EventEmitter();
  });
  it("should create an instance", () => {
    assert.instanceOf(instance, EventEmitter);
  });
  it("should have a .on spy", () => {
    assert.property(instance, "on");
    assert.isTrue(instance.on.isSinonProxy);
  });
  it("should have an .off spy", () => {
    assert.property(instance, "off");
    assert.isTrue(instance.off.isSinonProxy);
  });
  it("should call .off for .removeListener", () => {
    instance.removeListener("foo", noop);
    assert.calledWith(instance.off, "foo", noop);
  });
});

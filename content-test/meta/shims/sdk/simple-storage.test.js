const simpleStorage = require("sdk/simple-storage");
const {SimpleStorage} = simpleStorage;

describe("SimpleStorage", () => {
  let instance;
  beforeEach(() => {instance = new SimpleStorage();});
  it("should have a .storage property", () => {
    assert.property(instance, "storage");
    assert.isObject(instance.storage);
  });
  it("should set .storage from the constructor options", () => {
    instance = new SimpleStorage({foo: true});
    assert.deepEqual(instance.storage, {foo: true});
  });
  it("should have EventEmitter methods", () => {
    assert.property(instance, "on");
    assert.property(instance, "off");
  });
  describe("simpleStorage", () => {
    it("should be an instance of SimpleStorage", () => {
      assert.instanceOf(simpleStorage, SimpleStorage);
    });
  });
});

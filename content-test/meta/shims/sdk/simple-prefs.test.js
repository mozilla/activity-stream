const simplePrefs = require("sdk/simple-prefs");
const {SimplePrefs} = simplePrefs;

describe("SimplePrefs", () => {
  let instance;
  beforeEach(() => { instance = new SimplePrefs(); });
  it("should have a .prefs property", () => {
    assert.property(instance, "prefs");
    assert.isObject(instance.prefs);
  });
  it("should set prefs from the constructor options", () => {
    instance = new SimplePrefs({foo: true});
    assert.deepEqual(instance.prefs, {foo: true});
  });
  it("should have EventEmitter methods", () => {
    assert.property(instance, "on");
    assert.property(instance, "off");
  });
  describe("simplePrefs", () => {
    it("should be an instance of SimplePrefs", () => {
      assert.instanceOf(simplePrefs, SimplePrefs);
    });
  });
});

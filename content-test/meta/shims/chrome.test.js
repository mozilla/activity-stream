const chrome = require("chrome");
const {Chrome} = chrome;

describe("Chrome", () => {
  let instance = new Chrome();
  beforeEach(() => {
    instance = new Chrome();
  });
  it("should have Cu, Cc, Ci properties", () => {
    assert.property(instance, "Cu");
    assert.property(instance, "Cc");
    assert.property(instance, "Ci");
  });
  describe("#Cu", () => {
    it("should have a .import spy", () => {
      assert.property(instance.Cu, "import");
      assert.isTrue(instance.Cu.import.isSinonProxy);
    });
  });
  describe("#Ci", () => {
    it("should have a .nsIDOMParser spy", () => {
      assert.property(instance.Ci, "nsIDOMParser");
      assert.isTrue(instance.Ci.nsIDOMParser.isSinonProxy);
    });
  });
  describe("chrome", () => {
    it("should be an instance of Chrome", () => {
      assert.instanceOf(chrome, Chrome);
    });
  });
});

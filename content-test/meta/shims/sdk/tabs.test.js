const tabs = require("sdk/tabs");
const {Tabs, Tab} = tabs;

describe("Tab", () => {
  let instance;
  beforeEach(() => {instance = new Tab();});
  it("should create a tab with a title, id", () => {
    assert.property(instance, "title");
    assert.property(instance, "id");
  });
  it("should allow setting of custom properties", () => {
    instance = new Tab({title: "foo", id: 123, blah: 1});
    assert.equal(instance.title, "foo");
    assert.equal(instance.id, 123);
    assert.equal(instance.blah, 1);
  });
  it("should call a callback for .close", () => {
    const cb = sinon.spy();
    instance.close(cb);
    assert.called(cb);
    assert.called(instance.close);
  });
});

describe("Tabs", () => {
  let instance;
  beforeEach(() => {instance = new Tabs();});
  it("should have an .open spy", () => {
    instance.open();
    assert.called(instance.open);
  });
  it("should return an active tab for .activeTab", () => {
    assert.instanceOf(instance.activeTab, Tab);
  });
  it("should return the length of open tabs for .length", () => {
    assert.equal(instance.length, 1);
  });
  describe("tabs", () => {
    it("should be an instance of Tabs", () => {
      assert.instanceOf(tabs, Tabs);
    });
  });
});

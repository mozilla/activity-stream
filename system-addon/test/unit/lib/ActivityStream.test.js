import {ActivityStream} from "lib/ActivityStream.jsm";

describe("ActivityStream", () => {
  it("should exist", () => {
    assert.ok(ActivityStream);
  });
  it("should initialze with .initalized=false", () => {
    const as = new ActivityStream();
    assert.isFalse(as.initialized, ".initialized");
  });
  describe("#init", () => {
    it("should set .initialized to true", () => {
      const as = new ActivityStream();
      as.init();
      assert.isTrue(as.initialized, ".initialized");
    });
  });
  describe("#uninit", () => {
    it("should set .initialized to false", () => {
      const as = new ActivityStream();
      as.init();
      as.uninit()
      assert.isFalse(as.initialized, ".initialized");
    });
  });
});

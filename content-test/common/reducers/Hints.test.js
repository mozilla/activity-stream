const Hints = require("common/reducers/Hints");
const {ShowAllHints, DisableHint} = require("common/action-manager").actions;

describe("Hints reducer", () => {
  it("should have the correct initial state", () => {
    const state = Hints(undefined, {});
    assert.deepEqual(state, {});
  });
  it("should reset Hints to {} on an ENABLE_ALL_HINTS action", () => {
    const state = Hints({foo: false, blah: false}, ShowAllHints());
    assert.deepEqual(state, {});
  });
  it("should add [id]: false on a DISABLE_HINT action", () => {
    const state = Hints({blah: false}, DisableHint("foo"));
    assert.deepEqual(state, {blah: false, foo: false});
  });
});

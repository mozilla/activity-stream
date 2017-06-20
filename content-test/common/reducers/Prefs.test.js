const Prefs = require("common/reducers/Prefs");

function prevState(custom = {}) {
  return Object.assign({}, Prefs.INITIAL_STATE, custom);
}

// This is a test to ensure we haven't accidentally modified
// our INITIAL_STATE for the reducer
function checkIndependence(type) {
  const state = Prefs(undefined, {type, data: {}});
  assert.notEqual(Prefs.INITIAL_STATE, state, "should not modify INITIAL_STATE");
}

describe("Prefs reducer", () => {
  it("should have the correct initial state", () => {
    const state = Prefs(undefined, {});
    assert.deepEqual(state, Prefs.INITIAL_STATE);
  });
  describe("PREFS_RESPONSE", () => {
    it("should return a new object", () => {
      checkIndependence("PREFS_RESPONSE");
    });
    describe("non-error", () => {
      it("should set prefs", () => {
        const prefs = {foo: "bar"};
        const state = Prefs(undefined, {type: "PREFS_RESPONSE", data: prefs});
        assert.equal(state.prefs, prefs);
      });
      it("should set error:false", () => {
        const prefs = {foo: "bar"};
        const state = Prefs(prevState({error: true}), {type: "PREFS_RESPONSE", data: prefs});
        assert.isFalse(state.error);
      });
    });
    describe("has error", () => {
      it("should set error to action.data", () => {
        const error = new Error("foo");
        const state = Prefs(undefined, {type: "PREFS_RESPONSE", error: true, data: error});
        assert.equal(state.error, error);
      });
    });
  });
  describe("PREF_CHANGED_RESPONSE", () => {
    it("should return a new object", () => {
      checkIndependence("PREF_CHANGED_RESPONSE");
    });
    it("should set the changed pref", () => {
      const state = Prefs(prevState({foo: 1}), {type: "PREF_CHANGED_RESPONSE", data: {name: "foo", value: 2}});
      assert.equal(state.prefs.foo, 2);
    });
    it("should return a new .pref object instead of mutating", () => {
      const oldState = prevState({foo: 1});
      const state = Prefs(oldState, {type: "PREF_CHANGED_RESPONSE", data: {name: "foo", value: 2}});
      assert.notEqual(oldState.prefs, state.prefs);
    });
  });
});

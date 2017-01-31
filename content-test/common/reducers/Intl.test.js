const Intl = require("common/reducers/Intl");

describe("Intl reducer", () => {
  it("should have the correct initial state", () => {
    const state = Intl(undefined, {});
    assert.deepEqual(state, Intl.INITIAL_STATE);
  });
  describe("LOCALE_UPDATED", () => {
    it("should update .locale", () => {
      const state = Intl(undefined, {type: "LOCALE_UPDATED", data: "en-FOO"});
      assert.deepEqual(state, Object.assign({}, Intl.INITIAL_STATE, {locale: "en-FOO"}));
    });
  });
});

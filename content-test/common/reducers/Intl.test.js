const Intl = require("common/reducers/Intl");

describe("Intl reducer", () => {
  it("should have the correct initial state", () => {
    const state = Intl(undefined, {});
    assert.deepEqual(state, Intl.INITIAL_STATE);
  });
  describe("LOCALE_UPDATED", () => {
    it("should not update if action.data is missing", () => {
      const prevState = {locale: "en-US", strings: {}, direction: "ltr"};
      const state = Intl(prevState, {type: "LOCALE_UPDATED"});
      assert.equal(state, prevState);
    });
    it("should update .locale, .strings and .direction", () => {
      const state = Intl(undefined, {
        type: "LOCALE_UPDATED",
        data: "he-FOO"
      });
      assert.equal(state.locale, "he-FOO", ".locale");
      assert.isObject(state.strings, ".strings");
      assert.equal(state.direction, "rtl");
    });
  });
});

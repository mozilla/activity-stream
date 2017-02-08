const Intl = require("common/reducers/Intl");

describe("Intl reducer", () => {
  it("should have the correct initial state", () => {
    const state = Intl(undefined, {});
    assert.deepEqual(state, Intl.INITIAL_STATE);
  });
  describe("LOCALE_UPDATED", () => {
    it("should not update if action.data is missing", () => {
      const prevState = {locale: "en-US", strings: {}};
      const state = Intl(prevState, {type: "LOCALE_UPDATED"});
      assert.equal(state, prevState);
    });
    it("should update .locale, .strings and .direction", () => {
      const state = Intl(undefined, {type: "LOCALE_UPDATED", data: {locale: "en-FOO", strings: {foo: "foo"}, direction: "ltr"}});
      assert.deepEqual(state, Object.assign({}, Intl.INITIAL_STATE, {locale: "en-FOO", strings: {foo: "foo"}, direction: "ltr"}));
    });
  });
});

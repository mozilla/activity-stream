const Intl = require("common/reducers/Intl");
const {getDirection} = Intl;
const {DEFAULT_LOCALE} = require("common/constants");

describe("Intl reducer", () => {
  it("should have the correct initial state", () => {
    const state = Intl(undefined, {});
    assert.deepEqual(state, Intl.INITIAL_STATE);
  });
  describe("getDirection", () => {
    it("should return ltr with default strings", () => {
      const expectedDir = "ltr";
      assert.equal(getDirection(DEFAULT_LOCALE), expectedDir);
    });
    it("should gracefully handle 3 letter code locales", () => {
      const expectedDir = "ltr";
      assert.equal(getDirection("aus-IL"), expectedDir);
    });
    it("should return rtl for rtl languages", () => {
      const expectedDir = "rtl";
      assert.equal(getDirection("he-IL"), expectedDir);
    });
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

const {DEFAULT_LOCALE} = require("common/constants");
const {getLocalizedStrings, getDirection} = require("common/localizationUtils");

describe("localizationUtils", () => {
  describe("getLocalizedStrings", () => {
    it("should return default locale strings without merging if default locale is selected", () => {
      const strings = {};
      strings[DEFAULT_LOCALE] = {greeting: "hello", confirm: "yes"};
      const result = getLocalizedStrings(DEFAULT_LOCALE, strings);
      assert.equal(result, strings[DEFAULT_LOCALE]);
    });
    it("should get strings for a given locale", () => {
      const strings = {fr: {greeting: "bonjour"}};
      strings[DEFAULT_LOCALE] = {greeting: "hello"};
      const result = getLocalizedStrings("fr", strings);
      assert.deepEqual(result, strings.fr);
    });
    it("should include strings from the default locale for any missing ids", () => {
      const strings = {fr: {greeting: "bonjour"}};
      strings[DEFAULT_LOCALE] = {greeting: "hello", confirm: "yes"};
      const result = getLocalizedStrings("fr", strings);
      assert.deepEqual(result, {greeting: "bonjour", confirm: "yes"});
    });
    it("should just return default locale strings if a locale is missing", () => {
      const strings = {};
      strings[DEFAULT_LOCALE] = {greeting: "hello", confirm: "yes"};
      const result = getLocalizedStrings("fr", strings);
      assert.deepEqual(result, strings[DEFAULT_LOCALE]);
    });
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
});

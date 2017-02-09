const {DEFAULT_LOCALE} = require("common/constants");
const getLocalizedStrings = require("common/getLocalizedStrings");

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

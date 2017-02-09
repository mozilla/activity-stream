const {DEFAULT_LOCALE} = require("../common/constants");
const STRINGS = require("../data/locales/locales.json");

module.exports = function getLocalizedStrings(locale, allStrings = STRINGS) {
  if (locale === DEFAULT_LOCALE) {
    return allStrings[DEFAULT_LOCALE];
  }
  const strings = allStrings[locale];
  // This will include the English string for any missing ids
  return Object.assign({}, allStrings[DEFAULT_LOCALE], strings || {});
};

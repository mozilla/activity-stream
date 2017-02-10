const {DEFAULT_LOCALE, RTL_LIST} = require("common/constants");
const STRINGS = require("../data/locales/locales.json");

module.exports.getDirection = function getDirection(locale) {
  return (RTL_LIST.indexOf(locale.split("-")[0]) >= 0) ? "rtl" : "ltr";
};

module.exports.getLocalizedStrings = function getLocalizedStrings(locale, allStrings = STRINGS) {
  if (locale === DEFAULT_LOCALE) {
    return allStrings[DEFAULT_LOCALE];
  }
  const strings = allStrings[locale];
  // This will include the English string for any missing ids
  return Object.assign({}, allStrings[DEFAULT_LOCALE], strings || {});
};

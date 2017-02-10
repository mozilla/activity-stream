const {DEFAULT_LOCALE, RTL_LIST} = require("common/constants");
const INITIAL_STATE = {locale: DEFAULT_LOCALE, strings: {}, direction: "ltr"};
const getLocalizedStrings = require("common/getLocalizedStrings");

function getDirection(locale) {
  return (RTL_LIST.indexOf(locale.split("-")[0]) >= 0) ? "rtl" : "ltr";
}

function Intl(prevState = INITIAL_STATE, action) {
  switch (action.type) {
    case "LOCALE_UPDATED":
      if (!action.data) {
        return prevState;
      }
      return {
        locale: action.data,
        strings: getLocalizedStrings(action.data),
        direction: getDirection(action.data)
      };
    default:
      return prevState;
  }
}

Intl.INITIAL_STATE = INITIAL_STATE;
Intl.getDirection = getDirection;

module.exports = Intl;

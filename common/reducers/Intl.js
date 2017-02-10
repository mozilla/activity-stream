const {DEFAULT_LOCALE} = require("common/constants");
const INITIAL_STATE = {locale: DEFAULT_LOCALE, strings: {}, direction: "ltr"};
const {getDirection, getLocalizedStrings} = require("common/localizationUtils");

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

module.exports = Intl;

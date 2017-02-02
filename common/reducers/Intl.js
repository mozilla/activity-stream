const INITIAL_STATE = {locale: null, strings: {}};

function Intl(prevState = INITIAL_STATE, action) {
  switch (action.type) {
    case "LOCALE_UPDATED":
      if (!action.data) {
        return prevState;
      }
      return Object.assign({}, prevState, {
        locale: action.data.locale,
        strings: action.data.strings
      });
    default:
      return prevState;
  }
}

Intl.INITIAL_STATE = INITIAL_STATE;

module.exports = Intl;

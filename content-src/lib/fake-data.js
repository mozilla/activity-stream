const {HIGHLIGHTS_LENGTH, DEFAULT_LOCALE} = require("common/constants");
const faker = require("test/faker");
const STRINGS = require("../../data/locales/locales.json")[DEFAULT_LOCALE];

module.exports = {
  "Highlights": {
    "rows": faker.createRows({images: HIGHLIGHTS_LENGTH}),
    "error": false
  },
  "TopSites": {
    "rows": faker.createRows({images: 3}),
    "error": false
  },
  "Search": {
    "error": false,
    "searchString": "he",
    "suggestions": ["help", "helloworld"],
    "formHistory": ["hello"],
    "currentEngine": {
      "name": "Google",
      "icon": ""
    },
    "engines": [{"name": "Google", "icon": ""}, {"name": "Yahoo", "icon": ""}],
    "searchPlaceholder": "",
    "searchSettings": "",
    "searchHeader": "",
    "searchForSomethingWith": ""
  },
  "Experiments": {
    "values": {},
    "error": false
  },
  "Filter": {"query": ""},
  "Prefs": {
    "prefs": {
      "showSearch": true,
      "showTopSites": true,
      "showHighlights": true
    },
    "error": false
  },
  "Intl": {
    "locale": DEFAULT_LOCALE,
    "strings": STRINGS,
    "direction": "ltr"
  }
};

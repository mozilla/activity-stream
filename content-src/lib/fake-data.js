const {HIGHLIGHTS_LENGTH} = require("common/constants");
const faker = require("test/faker");

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
    "prefs": {},
    "error": false
  },
  "ShareProviders": {
    "providers": [
      {
        "name": "MySpace",
        "origin": "https://myspace.com"
      }
    ]
  },
  "Intl": {
    "locale": "en-US",
    "strings": {}
  }
};

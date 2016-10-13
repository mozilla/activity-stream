const {SPOTLIGHT_DEFAULT_LENGTH, WEIGHTED_HIGHLIGHTS_LENGTH} =
  require("common/constants");
const faker = require("test/faker");

module.exports = {
  "WeightedHighlights": {
    "rows": faker.createRows({images: WEIGHTED_HIGHLIGHTS_LENGTH}),
    "error": false,
    "weightedHighlights": false
  },
  "TopSites": {
    "rows": faker.createRows({images: 3}),
    "error": false
  },
  "History": {
    "rows": faker.createRows({images: 3}),
    "error": false
  },
  "Highlights": {
    "rows": faker.createRows({images: SPOTLIGHT_DEFAULT_LENGTH}),
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
  }
};

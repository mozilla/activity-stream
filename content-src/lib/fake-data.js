const {HIGHLIGHTS_LENGTH, POCKET_STORIES_LENGTH, POCKET_TOPICS_LENGTH, DEFAULT_LOCALE} = require("common/constants");
const faker = require("test/faker");
const STRINGS = require("../../data/locales/locales.json")[DEFAULT_LOCALE];

module.exports = {
  "Highlights": {
    "rows": faker.createRows({images: HIGHLIGHTS_LENGTH}),
    "error": false
  },
  "PocketStories": {
    "rows": faker.createRows({length: POCKET_STORIES_LENGTH}),
    "error": false
  },
  "PocketTopics": {
    "rows": faker.createRows({length: POCKET_TOPICS_LENGTH}),
    "error": false
  },
  "TopSites": {
    "rows": faker.createRows({images: 3}).map(row => Object.assign({}, row, {hasHighResIcon: true})),
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
    "values": {"pocket": true},
    "error": false
  },
  "Filter": {"query": ""},
  "Prefs": {
    "prefs": {
      "showSearch": true,
      "showTopSites": true,
      "showHighlights": true,
      "showPocket": true
    },
    "error": false
  },
  "Intl": {
    "locale": DEFAULT_LOCALE,
    "strings": STRINGS,
    "direction": "ltr"
  }
};

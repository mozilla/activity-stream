const faker = require("test/faker");

module.exports = {
  "TopSites": {
    "rows": faker.createRows({images: 3}),
    "error": false
  },
  "History": {
    "rows": faker.createRows({images: 3}),
    "error": false
  },
  "Highlights": {
    "rows": faker.createRows({images: 3}),
    "error": false
  },
  "Bookmarks": {
    "rows": faker.createRows({images: 3, type: "bookmark"}),
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
    "data": {reverseMenuOptions: false},
    "error": false
  }
};

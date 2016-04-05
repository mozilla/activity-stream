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
  "FrecentHistory": {
    "rows": faker.createRows({images: 3}),
    "error": false
  },
  "Bookmarks": {
    "rows": faker.createRows({images: 3, type: "bookmark"}),
    "error": false
  },
  "Search": {
    "currentEngine": {
      "name": "Google",
      "placeholder": "Search With Google",
      "iconBuffer": {}
    }
  },
  "Blocked": {
    "urls": new Set()
  }
};

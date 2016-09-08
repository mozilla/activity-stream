"use strict";

const {normalizeUrl} = require("addon/task-queue/utils");

const INVALID_URL = "htp:/invalid";

// The first URL for every list should always be the normalized version
const URL_GROUPS = [
  [
    "http://www.example.com/",
    "http://www.example.com",
    "http://www.eXamPle.com",
    "http://www.example.com?"
  ],
  [
    "http://www.example.com/?arg=1&bar=2&foo=3",
    "http://www.example.com/?bar=2&arg=1&foo=3",
    "http://www.example.com/?foo=3&arg=1&bar=2"
  ],
  [
    "http://www.example.com/?q=This%20is%20a%20query",
    "http://www.example.com/?q=This+is+a+query",
    "http://www.example.com/?q=This is a query",
    "http://www.example.com/?q=This is%20a+query"
  ],
  [
    "http://www.example.com/?q=%3F%2B%3A",
    "http://www.example.com/?q=%3f%2b%3a",
    "http://www.example.com/?q=%3F%2b%3A"
  ]
];

exports["test url normalization"] = function(assert) {
  assert.equal(normalizeUrl(INVALID_URL), "", "Invalid url returns undefined");

  for (let urls of URL_GROUPS) {
    const normalized = urls.map(url => normalizeUrl(url));
    assert.ok(normalized.every((curr, i, array) => curr === urls[0]));
  }
};

require("sdk/test").run(exports);

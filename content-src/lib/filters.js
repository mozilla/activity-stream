const urlParse = require("url-parse");

const TEMP_MAX_LENGTH = 100;
const ALLOWED_PROTOCOLS = new Set([
  "http:",
  "https:"
]);
const DISALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0"
]);

function createFilter(definition) {
  return function(item) {
    let result = true;
    const url = item && item.url && urlParse(item.url) || {};
    definition.forEach(test => {
      if (!test(item, url)) {
        result = false;
      }
    });
    return result;
  };
}

const URL_FILTERS = [
  (item) => !!item.url,
  // This is temporary, until we can use POST-style requests
  // see https://github.com/mozilla/embedly-proxy/issues/1
  (item) => item.url && item.url.length < TEMP_MAX_LENGTH,
  (item, url) => ALLOWED_PROTOCOLS.has(url.protocol),
  (item, url) => !DISALLOWED_HOSTS.has(url.hostname)
];

const DATA_FILTERS = [
  item => !(item.error_code || item.error_message)
];

module.exports = {
  createFilter,
  urlFilter: createFilter(URL_FILTERS),
  siteFilter: createFilter(DATA_FILTERS)
};

const {log} = require("lib/logger");

const ALLOWED_PROTOCOLS = new Set([
  "http:",
  "https:"
]);
const DISALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0"
]);

function createFilter(definition, name) {
  return function(item) {
    let result = true;
    definition.forEach((test, i) => {
      if (!test(item)) {
        log(`omitting ${item.url}\nbecause it failed test #${i} of ${name}`);
        result = false;
      }
    });
    return result;
  };
}

const URL_FILTERS = [
  (item) => !!item.url,
  (item) => !!item.parsedUrl,
  (item) => item.parsedUrl && ALLOWED_PROTOCOLS.has(item.parsedUrl.protocol),
  (item) => item.parsedUrl && !DISALLOWED_HOSTS.has(item.parsedUrl.hostname)
];

const DATA_FILTERS = [
  item => !(item.error_code || item.error_message)
];

module.exports = {
  createFilter,
  urlFilter: createFilter(URL_FILTERS, "URL_FILTERS"),
  siteFilter: createFilter(DATA_FILTERS, "DATA_FILTERS")
};

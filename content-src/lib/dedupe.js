const {prettyUrl} = require("lib/utils");
const dedupe = require("fancy-dedupe");
const urlParse = require("url-parse");

function createDedupeKey(site) {
  if (!site.url) {
    return null;
  }
  const parsed = site.parsedUrl || urlParse(site.url, false);
  const host = prettyUrl(parsed.host);
  const pathname = parsed.pathname.replace(/\/$/, "");
  const query = parsed.query || "";
  return host + pathname + query;
}

dedupe.defaults.createKey = createDedupeKey;

module.exports = dedupe;
module.exports.createDedupeKey = createDedupeKey;

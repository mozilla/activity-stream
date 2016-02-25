const {log} =  require("lib/logger");
const {prettyUrl} = require("lib/utils");

function createDedupeKey(site) {
  const parsed = site.parsedUrl;
  if (!parsed) {
    return null;
  }
  const host = prettyUrl(parsed.host);
  const pathname = parsed.pathname.replace(/\/$/, "");
  const query = parsed.query;
  return host + pathname + query;
}

module.exports = {
  createDedupeKey,
  innerDedupe(sites) {
    const urlMap = new Map();
    sites.forEach(site => {
      const key = createDedupeKey(site);
      if (!key) {
        log(`omitting ${site.url} because could not create key`);
        return;
      }
      if (!urlMap.has(key)) {
        urlMap.set(key, site);
      } else {
        log(`omitting ${site.url} because ${key} already exists`);
      }
    });
    return Array.from(urlMap.values());
  }
};

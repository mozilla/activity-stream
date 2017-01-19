const urlParse = require("url-parse");
const {prettyUrl} = require("lib/utils");

function selectSiteProperties(site) {
  const favicon = site.favicon_url;
  const parsedUrl = site.parsedUrl || urlParse(site.url || "");
  const {hostname} = parsedUrl;

  // Remove the eTLD (e.g., com, net) and the preceding period from the hostname
  const eTLDLength = (site.eTLD || "").length || (hostname.match(/\.com$/) && 3);
  const eTLDExtra = eTLDLength > 0 ? -(eTLDLength + 1) : Infinity;
  const label = prettyUrl(hostname).slice(0, eTLDExtra);

  return {favicon, parsedUrl, label};
}

module.exports.selectSiteProperties = selectSiteProperties;

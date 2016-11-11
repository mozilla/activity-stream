const urlParse = require("url-parse");
const {prettyUrl} = require("lib/utils");

function selectSiteProperties(site) {
  const metadataFavicon = site.favicons && site.favicons[0] && site.favicons[0].url;
  const favicon = site.favicon_url || metadataFavicon || site.favicon;
  const parsedUrl = site.parsedUrl || urlParse(site.url || "");

  // Remove the eTLD (e.g., com, net) and the preceding period from the hostname
  const eTLDLength = (site.eTLD || "").length;
  const eTLDExtra = eTLDLength > 0 ? -(eTLDLength + 1) : Infinity;
  const label = prettyUrl(parsedUrl.hostname).slice(0, eTLDExtra);

  return {favicon, parsedUrl, label};
}

module.exports.selectSiteProperties = selectSiteProperties;

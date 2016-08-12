const urlParse = require("url-parse");
const {createSelector} = require("reselect");
const getBestImage = require("lib/getBestImage");
const getVideoPreview = require("lib/getVideoPreview");
const {prettyUrl} = require("lib/utils");

function selectSiteProperties(site) {
  const metadataFavicon = site.favicons && site.favicons[0] && site.favicons[0].url;
  const favicon = site.favicon_url || metadataFavicon || site.favicon;
  const parsedUrl = site.parsedUrl || urlParse(site.url || "");
  const label = prettyUrl(parsedUrl.hostname);
  return {favicon, parsedUrl, label};
}

const selectSitePreview = createSelector(
  site => site,
  site => {
    const type = site.media ? site.media.type : null;
    let thumbnail = null;
    let previewURL = null;
    if (type) {
      thumbnail = getBestImage(site.images);
      if (type === "video") {
        previewURL = getVideoPreview(site.url);
      }
    }

    return {
      type,
      thumbnail,
      previewURL
    };
  }
);

module.exports.selectSitePreview = selectSitePreview;
module.exports.selectSiteProperties = selectSiteProperties;

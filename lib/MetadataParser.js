/* globals Task */

"use strict";

const {getMetadata} = require("lib/vendor.bundle").PageMetadataParser;
const {resolve} = require("lib/vendor.bundle").url;
const {Cc, Ci, Cu} = require("chrome");
const {Page} = require("sdk/page-worker");

Cu.import("resource://gre/modules/Task.jsm");
Cu.importGlobalProperties(["URL"]);

function getDocumentObject(text) {
  const parser = Cc["@mozilla.org/xmlextras/domparser;1"]
                .createInstance(Ci.nsIDOMParser);
  return parser.parseFromString(text, "text/html");
}

function createCacheKey(url) {
  url = new URL(url);
  let key = url.host.replace(/www\.?/, "");
  key = key + url.pathname + (url.search || "");
  return key.toString();
}

function tempFixUrls(data, baseUrl) {
  function resolveUrl(url) {
    if (!url) {
      return url;
    }
    url = resolve(baseUrl, url);
    return url.replace(/^\/\//, "https://");
  }
  data.image_url = resolveUrl(data.image_url);
  data.icon_url = resolveUrl(data.icon_url);
  data.url = resolveUrl(data.url || baseUrl);
  return data;
}

// The metadata parser is a different format right now
// we need to temporarily convert it
function tempToEmbedlyFormat(data, url) {
  const {title, type, description, icon_url, image_url} = tempFixUrls(data, url);
  return {

    // These are needed for MetadataStore
    places_url: url,
    cache_key: createCacheKey(url),

    title,
    type,
    description,
    images: image_url ? [{url: image_url, height: 300, width: 300}] : [],
    favicon_url: icon_url,
    url
  };
}

function parseHTMLText(raw, url) {
  return new Promise(resolve => {
    const doc = getDocumentObject(raw);
    resolve(tempToEmbedlyFormat(getMetadata(doc), url));
  });
}

const parseByURL = Task.async(function*(url) {
  let page;
  const text = yield new Promise((resolve, reject) => {
    page = Page({
      contentScript: "self.postMessage(document.body.innerHTML);",
      contentURL: url,
      contentScriptWhen: "ready",
      onMessage(message) {
        resolve(message);
      }
    });
  });
  page.destroy();

  return yield parseHTMLText(text, url);
});

module.exports = Object.assign(module.exports, {
  parseHTMLText,
  parseByURL,
  getDocumentObject,

  // Temp stuff
  tempFixUrls,
  tempToEmbedlyFormat
});

/* globals require, exports */
"use strict";

const {getMetadata} = require("addon/vendor.bundle").PageMetadataParser;
const {resolve} = require("addon/vendor.bundle").url;
const {Cc, Ci} = require("chrome");

function MetadataParser(previewProvider) {
  this._previewProvider = previewProvider;
}

MetadataParser.prototype = {
  /**
   * Parse the outerHTML
   */
  _getDocumentObject(text) {
    const parser = Cc["@mozilla.org/xmlextras/domparser;1"]
                  .createInstance(Ci.nsIDOMParser);
    return parser.parseFromString(text, "text/html");
  },

  /**
   * Fix any formatting issues with urls
   */
  _fixUrl(url, baseUrl) {
    if (!url) {
      return url;
    }
    let fixedUrl = resolve(baseUrl, url);
    return fixedUrl.replace(/^\/\//, "https://");
  },

  /**
   * Format the data so the metadata DB receives it
   */
  _formatData(data, url) {
    data.images = data.image_url ? [{url: this._fixUrl(data.image_url, url), height: 300, width: 300}] : [];
    data.favicon_url = this._fixUrl(data.icon_url, url);
    data.url = url;
    delete data.image_url;
    delete data.icon_url;
    return this._previewProvider.processLinks([data]);
  },

  /**
   * Parse HTML, get the metadata from it, and format it
   */
  parseHTMLText(raw, url) {
    return new Promise(resolve => {
      const doc = this._getDocumentObject(raw);
      resolve(this._formatData(getMetadata(doc), url));
    });
  }
};

exports.MetadataParser = MetadataParser;

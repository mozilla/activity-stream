/* globals require, exports */
"use strict";

const {getMetadata} = require("page-metadata-parser");
const {Cc, Ci} = require("chrome");

function MetadataParser() {
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
   * Format the data so the metadata DB receives it
   */
  _formatData(data, url) {
    const images = data.image_url ? [{url: data.image_url}] : [];
    const formattedData = {
      url,
      images,
      provider_name: data.provider,
      original_url: data.original_url,
      title: data.title,
      description: data.description,
      favicon_url: data.icon_url
    };
    return formattedData;
  },

  /**
   * Parse HTML, get the metadata from it, and format it
   */
  parseHTMLText(raw, url) {
    const doc = this._getDocumentObject(raw);
    return this._formatData(getMetadata(doc, url), url);
  }
};

exports.MetadataParser = MetadataParser;

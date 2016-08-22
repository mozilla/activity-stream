/* globals require, exports */
"use strict";

const {getMetadata} = require("common/vendor")("PageMetadataParser");
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
   * Format the data so the metadata DB receives it
   */
  _formatData(data, url) {
    data.images = data.image_url ? [{url: data.image_url, height: 500, width: 500}] : [];
    data.favicon_url = data.icon_url ? data.icon_url : "";
    data.url = url;
    delete data.image_url;
    delete data.icon_url;
    let link = this._previewProvider.processLinks([data]);
    return link;
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

"use strict";
const absolute = relPath => require("path").join(__dirname, relPath);

module.exports = {
  entry: {"vendor": absolute("common/vendor-src.js")},
  output: {
    path: absolute("common"),
    filename: "vendor.js",
    libraryTarget: "commonjs2"
  },
  module: {loaders: [{test: /\.json$/, loader: "json"}]}
};

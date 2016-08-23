"use strict";
const webpack = require("webpack");
const absolute = relPath => require("path").join(__dirname, relPath);

module.exports = {
  entry: {"vendor": absolute("addon/vendor-src.js")},
  output: {
    path: absolute("addon"),
    filename: "vendor.bundle.js"
  },
  module: {loaders: [{test: /\.json$/, loader: "json"}]},
  plugins: [
    new webpack.BannerPlugin("const platform_require = require; let platform_exports = exports;\n", {raw: true})
  ]
};

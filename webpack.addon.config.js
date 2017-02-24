"use strict";
const absolute = relPath => require("path").join(__dirname, relPath);
const webpack = require("webpack");

module.exports = {
  entry: {"vendor": absolute("common/vendor-src.js")},
  output: {
    path: absolute("common"),
    filename: "vendor.js",
    libraryTarget: "commonjs2"
  },
  plugins: [
    new webpack.DefinePlugin({ADDON: true}),
    new webpack.BannerPlugin({banner: "let platform_require = require;\n", raw: true})
  ]
};

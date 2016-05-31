"use strict";
const WebpackNotifierPlugin = require("webpack-notifier");
const webpack = require("webpack");
const path = require("path");

module.exports = {
  entry: {
    "vendor": path.join(__dirname, "./addon-src/vendor.js")
  },
  output: {
    path: path.join(__dirname, "lib"),
    filename: "vendor.bundle.js"
  },
  module: {
    loaders: [
      {test: /\.json$/, loader: "json"}
    ]
  },
  devtool: null,
  plugins: [
    new WebpackNotifierPlugin(),
    new webpack.BannerPlugin("const platform_require = require; let platform_exports = exports;\n", {
      raw: true
    })
  ]
};

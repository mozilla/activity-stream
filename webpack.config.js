"use strict";
const webpack = require("webpack");
const webpack_common = require("./webpack.common");
const path = require("path");
const absolute = relPath => path.join(__dirname, relPath);

const srcPath = absolute("./content-src/main.js");
const outputDir = absolute("./data/content");
const outputFilename = "bundle.js";

let env = process.env.NODE_ENV || "development";

if (env !== "test") {
  webpack_common.plugins.push(
    new webpack.optimize.CommonsChunkPlugin({name: "vendor", filename: "vendor.bundle.js"}));
}

module.exports = {
  entry: {
    app: srcPath,
    vendor: [
      "react",
      "react-dom",
      "react-redux",
      "redux"
    ]
  },
  output: {
    path: outputDir,
    filename: outputFilename
  },
  node: {Buffer: true, url: false},
  target: "web",
  module: webpack_common.module,
  devtool: env === "production" ? false : "eval", // This is for Firefox
  plugins: webpack_common.plugins,
  resolve: {
    extensions: webpack_common.resolve.extensions,
    alias: Object.assign({}, webpack_common.resolve.alias, {
      // this is so we can use external dependencies in common files
      // without importing the pre-built version
      "common/vendor": absolute("./common/vendor-src")
    })
  }
};

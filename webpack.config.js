"use strict";
const webpack = require("webpack");
const {plugins, resolve} = require("./webpack.common");
const path = require("path");
const absolute = (relPath) => path.join(__dirname, relPath);

const srcPath = absolute("./content-src/main.js");
const outputDir = absolute("./data/content");
const outputFilename = "bundle.js";

let env = process.env.NODE_ENV || "development";

if (env !== "test") {
  plugins.push(new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.bundle.js"));
}

module.exports = {
  entry: {
    app: srcPath,
    vendor: [
      "react",
      "react-dom",
      "moment"
    ]
  },
  output: {
    path: outputDir,
    filename: outputFilename,
  },
  target: "web",
  module: {
    loaders: [
      {test: /\.json$/, loader: "json"},
      {
        test: /\.jsx?$/,
        include: /.\/(common|content-src|content-test)\//,
        loader: "babel"
      }
    ]
  },
  devtool: env === "production" ? null : "eval-sourcemap", // This is for Firefox
  plugins: plugins,
  resolve: resolve
};

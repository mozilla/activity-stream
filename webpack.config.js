"use strict";
const WebpackNotifierPlugin = require("webpack-notifier");
const webpack = require("webpack");
const path = require("path");
const absolute = (relPath) => path.join(__dirname, relPath);
const webpackConfig = require("./bin/webpack-config");

const srcPath = absolute("./content-src/main.js");
const outputDir = absolute("./data/content");
const outputFilename = "bundle.js";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_TEST = process.env.NODE_ENV === "test";

let plugins =  [
  new WebpackNotifierPlugin(),
  new webpack.DefinePlugin(webpackConfig(IS_PRODUCTION))
];

if (!IS_TEST) {
  plugins.push(new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.bundle.js"));
}

if (IS_PRODUCTION) {
  plugins = plugins.concat([
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      test: /vendor/,
      compress: {
        warnings: false
      }
    }),
    new webpack.optimize.DedupePlugin()
  ]);
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
  resolve: {
    extensions: ["", ".js", ".jsx"],
    alias: {
      "components": absolute("./content-src/components"),
      "reducers": absolute("./content-src/reducers"),
      "actions": absolute("./content-src/actions"),
      "lib": absolute("./content-src/lib"),
      "strings": absolute("./strings"),
      "test": absolute("./content-test")
    }
  },
  module: {
    loaders: [
      {test: /\.json$/, loader: "json"},
      {
        test: /\.jsx?$/,
        include: /.\/(content-src|content-test)\//,
        loader: "babel"
      }
    ]
  },
  devtool: IS_PRODUCTION ? null : "eval", // This is for Firefox
  plugins
};

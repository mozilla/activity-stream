"use strict";
const WebpackNotifierPlugin = require("webpack-notifier");
const webpack = require("webpack");
const path = require("path");
const yaml = require("yamljs");
const absolute = (relPath) => path.join(__dirname, relPath);

const srcPath = absolute("./content-src/main.js");
const outputDir = absolute("./data/content");
const outputFilename = "bundle.js";

let config = yaml.load("config.default.yml");
try {
  // Load user config if it exists
  config = Object.assign({}, config, yaml.load("config.yml"));
} catch (e) {}

module.exports = {
  entry: srcPath,
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
  devtool: "eval", // This is for Firefox
  plugins: [
    new WebpackNotifierPlugin(),
    new webpack.DefinePlugin({__CONFIG__: JSON.stringify(config)})
  ]
};

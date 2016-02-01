"use strict";
const WebpackNotifierPlugin = require("webpack-notifier");
const webpack = require("webpack");
const path = require("path");
const yaml = require("yamljs");
const absolute = (relPath) => path.join(__dirname, relPath);

const srcDir = absolute("./src");
const srcPath = absolute("./src/main.js");
const outputDir = absolute("./data");
const outputFilename = "bundle.js"

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
  resolve: {
    extensions: ["", ".js", ".jsx"],
    alias: {
      "components": absolute("./src/components"),
      "reducers": absolute("./src/reducers"),
      "actions": absolute("./src/actions"),
      "lib": absolute("./src/lib"),
      "strings": absolute("./strings"),
      "test": absolute("./test")
    }
  },
  module: {
    loaders: [
      {test: /\.json$/, loader: "json"},
      {
        test: /\.jsx?$/,
        include: /.\/(src)\//,
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

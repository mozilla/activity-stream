"use strict";
const WebpackNotifierPlugin = require("webpack-notifier");
const webpack = require("webpack");
const path = require("path");
const absolute = (relPath) => path.join(__dirname, relPath);
const EnvLoaderPlugin = require("webpack-env-loader-plugin");

const srcPath = absolute("./content-src/main.js");
const outputDir = absolute("./data/content");
const outputFilename = "bundle.js";

let env = process.env.NODE_ENV || "development";

let plugins =  [
  new WebpackNotifierPlugin(),
  new EnvLoaderPlugin({
    env,
    filePattern: "config.{env}.yml",
    loadLocalOverride: env === "development" ? "config.yml" : null,
    reactEnv: true
  })
];

if (env !== "test") {
  plugins.push(new webpack.optimize.CommonsChunkPlugin("vendor", "vendor.bundle.js"));
}

if (env === "production") {
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
      "moment",
      "l20n"
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
      "common": absolute("./common"),
      "components": absolute("./content-src/components"),
      "reducers": absolute("./content-src/reducers"),
      "actions": absolute("./content-src/actions"),
      "selectors": absolute("./content-src/selectors"),
      "lib": absolute("./content-src/lib"),
      "strings": absolute("./strings"),
      "test": absolute("./content-test"),
      "l20n": absolute("./node_modules/l20n/dist/compat/web/l20n.js")
    }
  },
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
  devtool: env === "production" ? null : "eval", // This is for Firefox
  plugins
};

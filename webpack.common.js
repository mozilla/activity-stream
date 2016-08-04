"use strict";
const WebpackNotifierPlugin = require("webpack-notifier");
const webpack = require("webpack");
const path = require("path");
const absolute = (relPath) => path.join(__dirname, relPath);
const EnvLoaderPlugin = require("webpack-env-loader-plugin");

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
      "test": absolute("./content-test")
    }
  },
  plugins: plugins
};

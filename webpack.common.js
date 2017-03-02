"use strict";
const WebpackNotifierPlugin = require("webpack-notifier");
const webpack = require("webpack");
const path = require("path");
const absolute = relPath => path.join(__dirname, relPath);
const EnvLoaderPlugin = require("webpack-env-loader-plugin");

let env = process.env.NODE_ENV || "development";

let plugins = [
  new EnvLoaderPlugin({
    env,
    filePattern: "config.{env}.yml",
    loadLocalOverride: env === "development" ? "config.yml" : null,
    reactEnv: true,
    log: false
  }),
  new webpack.DefinePlugin({ADDON: false}),
  // Allows us to use requrie("common/vendor") as a way to import depdendencies in both addon/content code
  new webpack.NormalModuleReplacementPlugin(/common\/vendor/, absolute("./common/vendor-src.js"))
];

// Skip notifying for terminals that can't handle it
if (!process.env.DISABLE_NOTIFY) {
  plugins.push(new WebpackNotifierPlugin());
}

if (env === "production") {
  plugins = plugins.concat([
    new webpack.optimize.UglifyJsPlugin({
      test: /vendor/,
      compress: {warnings: false}
    })
  ]);
}

module.exports = {
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  resolve: {
    extensions: [".js", ".jsx"],
    alias: {
      "common": absolute("./common"),
      "components": absolute("./content-src/components"),
      "reducers": absolute("./content-src/reducers"),
      "actions": absolute("./content-src/actions"),
      "selectors": absolute("./content-src/selectors"),
      "lib": absolute("./content-src/lib"),
      "strings": absolute("./strings"),
      "test": absolute("./content-test"),
      "addon": absolute("./addon")
    }
  },
  plugins
};

"use strict";
const absolute = relPath => require("path").join(__dirname, relPath);
const webpack = require("webpack");

module.exports = {
  entry: {"main": absolute("addon/main.src.js")},
  output: {
    filename: "main.js",
    libraryTarget: "commonjs2",
    path: absolute("addon")
  },
  plugins: [
    new webpack.ExternalsPlugin("commonjs", [
      "chrome",
      /^sdk/,
      /^@loader/
    ])
  ],
  resolve: {
    alias: {
      "addon": absolute("./addon"),
      "common": absolute("./common"),
      "strings": absolute("./strings")
    }
  }
};

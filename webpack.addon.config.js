"use strict";
const absolute = relPath => require("path").join(__dirname, relPath);
const webpack = require("webpack");

module.exports = {
  entry: {"main": absolute("addon/main.src.js")},
  output: {
    path: absolute("addon"),
  },
  plugins: [
    new ExternalsPlugin("commonjs", [
      "chrome",
      /^sdk/,
      /^\@loader/
    ])
  ]
};

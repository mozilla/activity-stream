"use strict";
const webpack = require("webpack");
const resolve = require("../webpack.config").resolve;

module.exports = {
  resolve,
  module: {
    loaders: [
      {test: /\.json$/, loader: "json"}
    ]
  }
};

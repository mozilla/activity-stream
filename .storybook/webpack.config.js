"use strict";
const webpack = require("webpack");
const resolve = require("../webpack.config").resolve;
const path = require("path");

module.exports = {
  resolve,
  module: {
    loaders: [
      {test: /\.json$/, loader: "json"},
      {
        test: /\.css?$/,
        loaders: [ 'style', 'raw' ],
        include: path.resolve(__dirname, '../')
      }
    ]
  }
};

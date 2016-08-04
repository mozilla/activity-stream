"use strict";
const webpack = require("webpack");
const {plugins, resolve} = require("../webpack.common");
const path = require("path");

module.exports = {
  resolve,
  module: {
    loaders: [
      {test: /\.json$/, loader: "json"},
      {
        test: /\.css?$/,
        loaders: ['style', 'raw'],
        include: path.resolve(__dirname, '../')
      }
    ]
  },
  devtool: "eval-sourcemap",
  plugins: plugins
};

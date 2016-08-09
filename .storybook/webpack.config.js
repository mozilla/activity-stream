"use strict";
const webpack = require("webpack");
const {plugins, resolve} = require("../webpack.common");
const path = require("path");

module.exports = storybookBaseConfig => {
  return Object.assign(storybookBaseConfig, {
    resolve,
    module: {
      loaders: [
        {test: /\.json$/, loader: "json"},
        {
          test: /\.css?$/,
          loaders: ['style', 'raw'],
          include: path.resolve(__dirname, '../')
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: "babel"
        }
      ]
    },
    devtool: "eval-sourcemap",
    plugins: storybookBaseConfig.plugins.concat(plugins)
  });
};

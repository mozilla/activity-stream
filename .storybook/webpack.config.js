"use strict";
const webpack = require("webpack");
const {plugins, resolve} = require("../webpack.config");
const path = require("path");

// XXX note that currently, we need to make sure that CommonsChunkPlugin is not
// included in plugins, so we assume that NODE_ENV has been set to "test" in 
// the storybook script in package.json.  We should do something less fragile...

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

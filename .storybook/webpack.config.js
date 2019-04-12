// you can use this file to add your custom webpack plugins, loaders and anything you like.
// This is just the basic way to add additional webpack configurations.
// For more information refer the docs: https://storybook.js.org/configurations/custom-webpack-config

// IMPORTANT
// When you add this file, we won't add the default configurations which is similar
// to "React Create App". This only has babel loader to load JavaScript.

"use strict";

const path = require("path");
const webpack = require("webpack");

const baseWebpackConfig = require("../webpack.system-addon.config.js")();

module.exports = async ({config, mode}) => {
  let newConfig = Object.assign(config, {
    module: baseWebpackConfig.module,
    resolve: baseWebpackConfig.resolve,
    devtool: "eval-sourcemap",
    //plugins: config.plugins.concat([reactProvider, reactDomProvider]),
    //plugins: webpack_common.plugins,
    //externals: baseWebpackConfig.externals
  });


  const cssLoader = {
    test: /\.css$/,
    use: ["style-loader", "raw-loader"],
    include: path.resolve(__dirname, "../"),
  };

  newConfig.module.rules = newConfig.module.rules.concat(cssLoader);

  //console.log("newConfig: \n", newConfig);

  console.log("rules:", JSON.stringify(newConfig.module.rules));
  return newConfig;
};

"use strict";
const webpack_common = require("../webpack.common");
const path = require("path");

module.exports = storybookBaseConfig => {
  let newConfig = {};

  // Tweak the basic storybook config a bit
  Object.assign(newConfig, storybookBaseConfig, {
    module: Object.assign({}, webpack_common.module),
    resolve: webpack_common.resolve,
    devtool: "eval-sourcemap",
    plugins: storybookBaseConfig.plugins.concat(webpack_common.plugins),
    externals: {
      // enzyme needs these for some reason
      "react/addons": true,
      "react/lib/ReactContext": true,
      "react/lib/ExecutionEnvironment": true
    }
  });

  // As of this writing CSS is not handled by webpack, so to get CSS changes to
  // be visible to storybook, we need to add a CSS loader that can notice
  // when main.css has changed (i.e. been rebuilt):
  let cssLoader = {
    test: /\.css?$/,
    loaders: ["style", "raw"],
    include: path.resolve(__dirname, "../")
  };
  newConfig.module.loaders = newConfig.module.loaders.concat(cssLoader);

  return newConfig;
};

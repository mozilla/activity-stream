"use strict";
const webpack_common = require("../webpack.common");

module.exports = storybookBaseConfig =>
  Object.assign(storybookBaseConfig, {
    module: webpack_common.module,
    resolve: webpack_common.resolve,
    devtool: "eval-sourcemap",
    plugins: storybookBaseConfig.plugins.concat(webpack_common.plugins)
  });

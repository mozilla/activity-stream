const path = require("path");
const webpackConfig = require("./webpack.system-addon.config");

module.exports = Object.assign({}, webpackConfig, {
  target: "node",
  devtool: "sourcemap",
  entry: path.join(__dirname, "system-addon/content-src/activity-stream-prerender.jsx"),
  output: {
    path: path.join(__dirname, "bin"),
    filename: "prerender.js",
    libraryTarget: "commonjs2"
  },
  externals: {
    "react": "commonjs react",
    "react-dom": "commonjs react-dom"
  }
});

const path = require("path");
const absolute = relPath => path.join(__dirname, "system-addon", relPath);

const resourcePathRegEx = /^resource:\/\/activity-stream\//;

module.exports = {
  entry: absolute("content-src/activity-stream.jsx"),
  output: {
    path: absolute("data/content"),
    filename: "activity-stream.bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {presets: ["react"]}
      },
      {
        test: /\.jsm$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        // Converts .jsm files into common-js modules
        options: {plugins: [["jsm-to-commonjs", {basePath: resourcePathRegEx, replace: true}]]}
      }
    ]
  },
  // This resolve config allows us to import with paths relative to the system-addon/ directory, e.g. "lib/ActivityStream.jsm"
  resolve: {
    extensions: [".js", ".jsx"],
    modules: [
      "node_modules",
      "system-addon"
    ]
  },
  externals: {
    "prop-types": "PropTypes",
    "react": "React",
    "react-dom": "ReactDOM",
    "react-intl": "ReactIntl",
    "redux": "Redux",
    "react-redux": "ReactRedux"
  }
};

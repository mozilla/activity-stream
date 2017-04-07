const path = require("path");
const absolute = relPath => path.join(__dirname, "system-addon", relPath);

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
    "react": "React",
    "react-dom": "ReactDOM"
  }
};

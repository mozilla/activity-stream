const path = require("path");

module.exports = {
  entry: path.join(__dirname, "content-src/activity-stream.js"),
  output: {
    path: path.join(__dirname, "data/content"),
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
    modules: [
      __dirname,
      "node_modules"
    ]
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM"
  }
};

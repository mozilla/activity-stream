const webpack = require("./webpack.config");
const path = require("path");

module.exports = function(config) {
  config.set({
    singleRun: true,
    browsers: ["Firefox"],
    frameworks: ["mocha"],
    reporters: ["mocha", "coverage"],
    coverageReporter: {
      dir: "logs/reports/coverage",
      reporters: [
        {
          type: "lcov",
          subdir: "lcov"
        },
        {
          type: "html",
          subdir: "html"
        },
        {
          type: "text",
          subdir: ".",
          file: "text.txt"
        },
        {
          type: "text-summary",
          subdir: ".",
          file: "text-summary.txt"
        }
      ]
    },
    files: [
      "content-test/index.js",
      {pattern: "data/content/favicons/**/*", watched: false, included: false, served: true}
    ],
    proxies: {
      "/favicons/": "/base/data/content/favicons/"
    },
    preprocessors: {
      "content-test/**/*.js": ["webpack", "sourcemap"]
    },
    webpack: {
      devtool: "inline-source-map",
      resolve: webpack.resolve,
      module: {
        loaders: webpack.module.loaders,
        postLoaders: [{
          test: /\.js$/,
          loader: "istanbul-instrumenter",
          include: [path.join(__dirname, "/src")]
        }]
      },
      plugins: webpack.plugins
    },
    webpackMiddleware: {
      noInfo: true
    }
  });
};

const webpack = require("./webpack.config");
const path = require("path");

module.exports = function (config) {
  config.set({
    singleRun: true,
    browsers: ["FirefoxNightly"],
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
      "test/index.js"
    ],
    preprocessors: {
      "test/**/*.js": ["webpack", "sourcemap"]
    },
    webpack: {
      devtool: "inline-source-map",
      resolve: webpack.resolve,
      module: {
        loaders: webpack.module.loaders,
        postLoaders: [{
          test: /\.js$/,
          loader: 'istanbul-instrumenter',
          include: [path.join(__dirname, '/src')]
        }]
      },
      plugins: webpack.plugins
    },
    webpackMiddleware: {
      noInfo: true
    }
  });
};

const webpack = require("./webpack.config");
const path = require("path");

const reporters = ["mocha", "coverage"];
if (process.env.TRAVIS) {
  reporters.push("coveralls");
}

module.exports = function(config) {
  config.set({
    singleRun: true,
    browsers: ["Firefox"],
    frameworks: ["mocha", "sinon", "chai"],
    reporters,
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
    proxies: {"/favicons/": "/base/data/content/favicons/"},
    preprocessors: {"content-test/**/*.js": ["webpack", "sourcemap"]},
    webpack: {
      devtool: "inline-source-map",
      resolve: {
        extensions: webpack.resolve.extensions,
        alias: Object.assign({}, webpack.resolve.alias, {
          "shims": path.join(__dirname, "shims"),
          // This is necessary in order to be able to import
          // files from the addon side.
          "chrome": "shims/chrome.js",
          "sdk": "shims/sdk"
        })
      },
      resolveLoader: {alias: {inject: path.join(__dirname, "loaders/inject-loader")}},
      module: {
        loaders: webpack.module.loaders,
        postLoaders: [{
          test: /\.js$/,
          loader: "istanbul-instrumenter",
          include: [
            path.join(__dirname, "content-src"),
            path.join(__dirname, "common"),
            path.join(__dirname, "addon")
          ],
          exclude: [
            /DebugPage/,
            /\.test\.js$/,
            path.join(__dirname, "addon/ActivityStreams.js"),
            path.join(__dirname, "addon/AppURLHider.js"),
            path.join(__dirname, "addon/ColorAnalyzer.js"),
            path.join(__dirname, "addon/ColorAnalyzerProvider.js"),
            path.join(__dirname, "addon/main.js"),
            path.join(__dirname, "addon/MetadataStore.js"),
            path.join(__dirname, "addon/MetadataStoreMigration.js"),
            path.join(__dirname, "addon/PlacesProvider.js"),
            path.join(__dirname, "addon/PreviewProvider.js"),
            path.join(__dirname, "addon/SearchProvider.js"),
            path.join(__dirname, "addon/ShareManifests.js"),
            path.join(__dirname, "addon/ShareProvider.js"),
            path.join(__dirname, "addon/TabTracker.js"),
            path.join(__dirname, "addon/TelemetrySender.js"),
            path.join(__dirname, "addon/TippyTopProvider.js")
          ]
        }]
      },
      plugins: webpack.plugins
    },
    webpackMiddleware: {noInfo: true}
  });
};

// Note:
// DO NOT import this file directly, as it needs to be processed by webpack.
// Instead, import depdencies like this:
// require("common/vendor")("my-dependency");

if (typeof platform_require !== "undefined") {
  const {setTimeout, clearTimeout} = platform_require("sdk/timers");
  global.setTimeout = setTimeout;
  global.clearTimeout = clearTimeout;
}

const vendorModules = {
  "redux": require("redux"),
  "redux-thunk": require("redux-thunk"),
  "reselect": require("reselect"),
  "url-parse": require("url-parse"),
  "PageMetadataParser": require("page-metadata-parser"),
  "redux-watch": require("redux-watch"),
  "lodash.debounce": require("lodash.debounce")
};

module.exports = function vendor(moduleName) {
  if (!vendorModules[moduleName]) {
    throw new Error(`Tried to import '${moduleName}' but it was not defined in common/vendor-src.js. Maybe you need to add it?`);
  }
  return vendorModules[moduleName];
};

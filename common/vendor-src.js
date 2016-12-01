/* globals ADDON */

// Note:
// DO NOT import this file directly, as it needs to be processed by webpack.
// Instead, import depdencies like this:
// require("common/vendor")("my-dependency");

if (typeof platform_require !== "undefined") {
  const {setTimeout, clearTimeout} = platform_require("sdk/timers");
  global.setTimeout = setTimeout;
  global.clearTimeout = clearTimeout;
}

// Shared between both addon and content
const vendorModules = {
  "redux": require("redux"),
  "redux-thunk": require("redux-thunk"),
  "reselect": require("reselect"),
  "url-parse": require("url-parse")
};

// Addon-only modules. Also needed for tests
if (ADDON || process.env.NODE_ENV === "test") {
  Object.assign(vendorModules, {
    "page-metadata-parser": require("page-metadata-parser"),
    "redux-watch": require("redux-watch"),
    "lodash.debounce": require("lodash.debounce"),
    "tippy-top-sites": require("tippy-top-sites")
  });
}

module.exports = function vendor(moduleName) {
  if (!vendorModules[moduleName]) {
    throw new Error(`Tried to import '${moduleName}' but it was not defined in common/vendor-src.js. Maybe you need to add it?`);
  }
  return vendorModules[moduleName];
};

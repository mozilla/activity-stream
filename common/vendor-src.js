// Note:
// DO NOT import this file directly, as it needs to be processed by webpack.
// Instead, import depdencies like this:
// require("common/vendor")("my-dependency");

const vendorModules = {
  "deep-diff": require("deep-diff"),
  "redux": require("redux"),
  "redux-thunk": require("redux-thunk"),
  "seedrandom": require("seedrandom"),
  "url-parse": require("url-parse"),
  "DoublyLinkedList": require("DoublyLinkedList/doubly-linked-list").DoublyLinkedList,
  "PageMetadataParser": require("page-metadata-parser"),
  "redux-watch": require("redux-watch")
};

module.exports = function vendor(moduleName) {
  if (!vendorModules[moduleName]) {
    throw new Error(`Tried to import '${moduleName}' but it was not defined in common/vendor-src.js. Maybe you need to add it?`);
  }
  return vendorModules[moduleName];
};

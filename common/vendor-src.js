// Note:
// DO NOT import this file directly, as it needs to be processed by webpack.
// Instead, import depdencies like this:
// require("common/vendor")("my-dependency");

const vendorModules = {
  "redux": require("redux"),
  "redux-thunk": require("redux-thunk"),
  "seedrandom": require("seedrandom"),
  "url-parse": require("url-parse"),
  "DoublyLinkedList": require("DoublyLinkedList/doubly-linked-list").DoublyLinkedList
};

module.exports = function vendor(moduleName) {
  if (!vendorModules[moduleName]) {
    throw new Error(`Tried to import '${moduleName}' but it was not defined in common/vendor-src.js. Maybe you need to add it?`);
  }
  return vendorModules[moduleName];
};

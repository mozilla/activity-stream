// Note:
// DO NOT import this file directly, as it needs to be processed by webpack.
// Instead, import depdencies like this:
// require("common/vendor")("my-dependency");

const vendorModules = {
  "seedrandom": require("seedrandom"),
  "url-parse": require("url-parse"),
  "DoublyLinkedList": require("DoublyLinkedList/doubly-linked-list").DoublyLinkedList
};

module.exports = function vendor(moduleName) {
  return vendorModules[moduleName];
};

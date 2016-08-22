// Note:
// DO NOT import this file directly, as it needs to be processed by webpack.
// Instead, import the bundle like this:
// require("addon/vendor.bundle");
try {
  platform_exports; // eslint-disable-line no-unused-expressions
} catch (e) {
  throw new Error("You are trying to import the wrong file. Import addon/vendor.bundle.js instead of addon/vendor-src.js");
}

platform_exports = Object.assign(platform_exports, {
  SeedRandom: require("seedrandom"),
  urlParse: require("url-parse"),
  DoublyLinkedList: require("DoublyLinkedList/doubly-linked-list").DoublyLinkedList,
  PageMetadataParser: require("page-metadata-parser"),
  url: require("url")
});

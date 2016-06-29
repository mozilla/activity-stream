// Note:
// DO NOT import this file directly, as it needs to be processed by webpack.
// Instead, import the bundle like this:
// require("lib/vendor.bundle");
try {
  platform_exports;
} catch (e) {
  throw new Error("You are trying to import the wrong file. Import lib/vendor.bundle.js instead of lib/vendor-src.js");
}

platform_exports = Object.assign(platform_exports, {
  SeedRandom: require("seedrandom")
});

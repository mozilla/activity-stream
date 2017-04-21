const fs = require("fs");
const path = require("path");

const defaults = require("../pocket-example.json");
const config = {};

Object.keys(defaults).forEach(key => {
  const envVal = process.env[key.toUpperCase()];
  config[key] = typeof envVal !== "undefined" ? envVal : defaults[key];
});

fs.writeFileSync(path.join(__dirname, "../pocket.json"), JSON.stringify(config, null, 2), "utf-8"); // eslint-disable-line no-sync

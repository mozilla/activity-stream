"use strict";
const yaml = require("yamljs");
const colors = require("colors");
const path = require("path");

const DEFAULT_CONFIG_PATH = path.resolve(__dirname, "../config.default.yml");
const PRODUCTION_CONFIG_PATH = path.resolve(__dirname, "../config.production.yml");
const LOCAL_CONFIG_PATH = path.resolve(__dirname, "../config.yml");

function logLoud(text) {
  console.log(colors.yellow(">>>> " + text)); // eslint-disable-line no-console
}

module.exports = (IS_PRODUCTION) => {

  const OVERRIDE_PROD_CONFIG = !!process.env.OVERRIDE_PROD_CONFIG;

  let config = yaml.load(DEFAULT_CONFIG_PATH);

  if (IS_PRODUCTION && !OVERRIDE_PROD_CONFIG) {
    logLoud("Building for production! Loading config.production.yml, skipping local config.yml.\n");
    config = Object.assign({}, config, yaml.load(PRODUCTION_CONFIG_PATH));
  } else {
    try {
      // Load user config if it exists
      config = Object.assign({}, config, yaml.load(LOCAL_CONFIG_PATH));
    } catch (e) {} // eslint-disable-line no-empty
  }

  const defineConfig = {
    "process.env": {NODE_ENV: IS_PRODUCTION ? '"production"' : '"development"'}
  };

  Object.keys(config).forEach(key => {
    let value = config[key];
    if (typeof value === "string") {
      value = `"${value}"`;
    }
    defineConfig["__CONFIG__." + key] = value;
  });

  return defineConfig;
};

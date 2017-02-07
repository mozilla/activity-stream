#! /usr/bin/env node
"use strict";

/* eslint-disable no-console */

/* globals cd, cp, ls, mkdir, rm */
require("shelljs/global");

// Ues the first script argument as the source of localized strings
const [, , stringsPath] = process.argv;
const stringsRepo = require("simple-git")(stringsPath);

// Update strings repository to the latest version
function pullStrings() {
  return new Promise((resolve, reject) => {
    console.log(`Updating L10n repo: ${stringsPath}`);

    // Get the strings revision
    stringsRepo.pull().show(["--format=%H", "--no-patch"], (err, val) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(val.trim());
    });
  });
}

// Replace and update each locale's strings
function updateLocales(revision) {
  return new Promise(resolve => {
    cd("locales");

    console.log("switching to and deleting existing l10n tree under: locales");
    ls().forEach(dir => {
      // Keep en-US as it might have newer strings
      if (dir !== "en-US") {
        rm("-r", dir);
      }
    });

    const l10nPath = `../${stringsPath}/l10n`;
    console.log(`updating l10n tree from: ${l10nPath}`);
    const locales = ls(l10nPath).map(dir => {
      // Convert pontoon locale names to this repo's naming
      const locale = dir.replace("_", "-").replace("templates", "en-US");

      // Skip potentially old template en-US strings
      if (locale !== "en-US") {
        mkdir(locale);
        cp(`${l10nPath}/${dir}/strings.properties`, locale);
      }

      return locale;
    });

    console.log(`
Please check the diffs, add/remove files, and then commit the result. Suggested commit message:
chore(l10n): Update L10n from changeset ${revision}`);

    resolve(revision, locales);
  });
}

pullStrings().then(updateLocales).catch(err => console.log(`Error: ${err}`));

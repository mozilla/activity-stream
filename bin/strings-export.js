#! /usr/bin/env node
"use strict";

/* eslint-disable no-console */

const STRINGS_PATH = "locales/en-US/strings.properties";
const TEMPLATES_PATH = "l10n/templates";

/* globals cp */
require("shelljs/global");

// Get a reference to the local repository
const git = require("simple-git");
const localRepo = git();

if (process.argv.length - 2 < 1) {
  throw Error("Please provide the path to the target strings repository");
}

// Use the first script argument as the target repository of strings
const [, , stringsPath] = process.argv;
const stringsRepo = git(stringsPath);

// Update strings repository to the latest strings
function copyStrings() {
  return new Promise((resolve, reject) => {
    console.log(`Copying strings to L10n repo: ${stringsPath}`);
    cp(STRINGS_PATH, `${stringsPath}/${TEMPLATES_PATH}`);

    // Get the local revision
    localRepo.show(["--format=%H", "--no-patch"], (err, val) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(val.trim());
    });
  });
}

// Commit the strings to the strings repository templates
function commitTemplates(revision) {
  const message = `Merge latest strings from activity-stream changeset ${revision}`;
  console.log(`Committing to strings repository with message: ${message}`);
  stringsRepo.add(TEMPLATES_PATH);
  stringsRepo.commit(message);
}

copyStrings().then(commitTemplates).catch(err => {
  console.log(`Error: ${err}`);
  process.exit(1); // eslint-disable-line no-process-exit
});

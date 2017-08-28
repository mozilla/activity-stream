#! /usr/bin/env node
/* globals cd, sed */
"use strict";

/**
 * Generate update install.rdf.in in the given directory with a version string
 * composed of YYYY.MM.DD.${minuteOfDay}-${github_commit_hash}.
 *
 * @note The github hash is taken from the github repo in the current directory
 * the script is run in.
 *
 * @note The minute of the day was chosen so that the version number is
 * (more-or-less) consistently increasing (modulo clock-skew and builds that
 * happen within a minute of each other), and although it's UTC, it won't likely
 * be confused with something in a readers own time zone.
 *
 * @example generated version string: 2017.08.28.1217-ebda466c
 */
const process = require("process");
require("shelljs/global");
const simpleGit = require("simple-git")(process.cwd());

const time = new Date();
const minuteOfDay = time.getUTCHours() * 60 + time.getUTCMinutes();

// git rev-parse --short HEAD
simpleGit.revparse(["--short", "HEAD"], (err, gitHash) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(`SimpleGit.revparse failed: ${err}`);
    throw new Error(`SimpleGit.revparse failed: ${err}`);
  }

  // eslint-disable-next-line prefer-template
  let versionString = String(time.getUTCFullYear()) +
    "." + String(time.getUTCMonth() + 1).padStart(2, "0") +
    "." + String(time.getUTCDate()).padStart(2, "0") +
    "." + String(minuteOfDay).padStart(4, "0") +
    "-" + gitHash.trim();

  cd(process.argv[2]);
  sed("-i", /(<em:version>).+(<\/em:version>)$/, `$1${versionString}$2`,
      "install.rdf.in");
});

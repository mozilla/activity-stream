#! /usr/bin/env node
"use strict";

/* eslint-disable no-console */
/* this is a node script; primary interaction is via console */

const {sync} = require("glob");
const {cp} = require("shelljs");

function getFiles() {
//  const ignorePatterns = [".git", "dist", "logs", "node_modules"];
    return sync("!(.git|node_modules|logs|dist)**/*", {nodir: true, dot: true});

    //ignore: ignorePatterns });
}

function main() {
  console.log("getFiles: ", getFiles());
  cp("-RP", getFiles(),
    "../mozilla-central/browser/extensions/activity-stream");
}

main();

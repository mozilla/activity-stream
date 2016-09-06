"use strict";

const test = require("sdk/test");
const {ExperimentProvider} = require("addon/ExperimentProvider");
const {getTestActivityStream} = require("./lib/utils");

exports["test ActivityStreams has experimentProvider instance"] = assert => {
  const as = getTestActivityStream({clientID: "k88"});
  assert.ok(as._experimentProvider instanceof ExperimentProvider, "should have _experimentProvider");
  assert.equal(as._experimentProvider._clientID, "k88", "should use clientID");
  as.unload();
};

test.run(exports);

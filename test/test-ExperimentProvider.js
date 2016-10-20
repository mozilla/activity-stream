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

exports["test ActivityStreams doesn't init experimentProvider"] = assert => {
  const as = getTestActivityStream({
    experiments: {
      foo: {
        name: "Foo Test",
        description: "A test about foo",
        control: {
          value: false,
          description: "Foo is 42 by default"
        },
        variant: {
          id: "foo_01",
          value: true,
          threshold: 0.5,
          description: "Twice the foo"
        }
      }
    },
    rng: () => 0.1,
    shield_variant: "test"
  });
  assert.ok(as._experimentProvider instanceof ExperimentProvider, "should have _experimentProvider");
  assert.equal(as._experimentProvider.experimentId, null, "should be null if shield variant set");
  assert.deepEqual(as._experimentProvider.data, {}, "should have empty .data");
  as.unload();
};

test.run(exports);

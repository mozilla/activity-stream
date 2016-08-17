"use strict";

const test = require("sdk/test");
const {ExperimentProvider} = require("addon/ExperimentProvider");
const {getTestActivityStream} = require("./lib/utils");

const DEFAULT_CLIENT_ID = "foo";
const DEFAULT_TEST_EXPERIMENTS = {
  foo: {
    name: "Foo Test",
    description: "A test about foo",
    control: {
      value: 42,
      description: "Foo is 42 by default"
    },
    variant: {
      id: "foo_01",
      value: 84,
      threshold: 0.5,
      description: "Twice the foo"
    }
  }
};

let experimentProvider;

function setup(clientID = DEFAULT_CLIENT_ID, experiments = DEFAULT_TEST_EXPERIMENTS, n) {
  return (experimentProvider = new ExperimentProvider(clientID, experiments, n && (() => n)));
}

exports["test ExperimentProvider"] = assert => {
  setup();
  assert.ok(experimentProvider._clientID, "should have a .clientID property");
  assert.ok(experimentProvider._rng, "should have a ._rng property");
  assert.ok(experimentProvider._data, "should have a ._data property");
};

exports["test ExperimentProvider._rng"] = assert => {
  setup("foo");
  assert.equal(Math.round(experimentProvider._rng() * 100) / 100, 0.73, "seed foo should generate 0.73");
  setup("012j");
  assert.equal(Math.round(experimentProvider._rng() * 100) / 100, 0.08, "seed 012j should generate 0.08");
};

exports["test ExperimentProvider.experimentId"] = assert => {
  setup(undefined, undefined, 0.8);
  assert.equal(experimentProvider.experimentId, null, "should be null for control group");
  setup(undefined, undefined, 0.1);
  assert.equal(experimentProvider.experimentId, "foo_01", "should be foo_01 if in experiment");
};

exports["test ExperimentProvider.data"] = assert => {
  setup("baz");
  assert.equal(experimentProvider.data, experimentProvider._data, ".data should return return this._data");
  assert.deepEqual(experimentProvider.data, {foo: 42}, "clientID 'baz' should result in control being picked");

  setup("012j");
  assert.deepEqual(experimentProvider.data, {foo: 84}, "clientID '012j' should result in variant being picked");
};

exports["test ExperimentProvider only selects one experiment"] = assert => {
  const randomNumber = 0.2;
  setup("foo", {
    kitty: {
      name: "kitty",
      control: {value: false},
      variant: {id: "kitty_01", threshold: 0.2, value: true}
    },
    dachshund: {
      name: "dachshund",
      control: {value: false},
      variant: {id: "dachshund_01", threshold: 0.2, value: true}
    }
  }, randomNumber);
  assert.equal(experimentProvider.data.dachshund, true, "dachshund should be selected");
  assert.equal(experimentProvider.data.kitty, false, "kitty should not be selected");
  assert.equal(experimentProvider.experimentId, "dachshund_01", "the experimentId should be dachshund_01");
};

exports["test ExperimentProvider skips experiments with active = false"] = assert => {
  setup("foo", {
    foo: {
      active: false,
      name: "foo",
      control: {value: "bloo"},
      variant: {
        id: "asdasd",
        threshold: 0.3,
        value: "blah"
      }
    }
  });
  assert.deepEqual(experimentProvider.data, {}, "should have empty .data");
};

exports["test ActivityStreams has experimentProvider instance"] = assert => {
  const as = getTestActivityStream({clientID: "k88"});
  assert.ok(as._experimentProvider instanceof ExperimentProvider, "should have _experimentProvider");
  assert.equal(as._experimentProvider._clientID, "k88", "should use clientID");
  as.unload();
};

test.run(exports);

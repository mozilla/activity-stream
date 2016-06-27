"use strict";

const test = require("sdk/test");
const {ExperimentProvider} = require("lib/ExperimentProvider");
const {ActivityStreams} = require("lib/ActivityStreams");

const DEFAULT_CLIENT_ID = "foo";
const DEFAULT_TEST_EXPERIMENTS = {
  foo: {
    id: "foo_01",
    name: "Foo Test",
    description: "A test about foo",
    control: {
      value: 42,
      description: "Foo is 42 by default"
    },
    variant: {
      value: 84,
      threshold: 0.5,
      description: "Twice the foo"
    }
  }
};

let experimentProvider;

// // Utility for generating an experiment based on a valid definition
// function createExperiment(details = {}) {
//   return Object.assign({}, DEFAULT_TEST_EXPERIMENTS.foo, details);
// }

function setup(clientID = DEFAULT_CLIENT_ID, experiments = DEFAULT_TEST_EXPERIMENTS) {
  return experimentProvider = new ExperimentProvider(clientID, experiments);
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

exports["test ExperimentProvider.data"] = assert => {
  setup("baz");
  assert.equal(experimentProvider.data, experimentProvider._data, ".data should return return this._data");
  assert.deepEqual(experimentProvider.data, {
    foo: {id: "foo_01", value: 42, inExperiment: false}
  }, "clientID 'baz' should result in control being picked");

  setup("012j");
  assert.deepEqual(experimentProvider.data, {
    foo: {id: "foo_01", value: 84, inExperiment: true}
  }, "clientID '012j' should result in variant being picked");
};

// exports["test ExperimentProvider.validateExperiment"] = assert => {
//   assert.throws(
//     () => setup("foo", {foo: createExperiment({id: null})}),
//     /missing an id/, "should throw if id is ommitted");
//   assert.throws(
//     () => setup("foo", {foo: createExperiment({name: null})}),
//     /missing a name/, "should throw if name is ommitted");
//   assert.throws(
//     () => setup("foo", {foo: createExperiment({control: null})}),
//     /missing control/, "should throw if control is ommitted");
//   assert.throws(
//     () => setup("foo", {foo: createExperiment({control: {description: "whatever"}})}),
//     /missing control.value/, "should throw if control.value is ommitted");
//   assert.ok(
//     () => setup("foo", {foo: createExperiment({control: {value: 0}})}),
//     "should not throw for falsey values"
//   );
//   assert.throws(
//     () => setup("foo", {foo: createExperiment({variant: null})}),
//     /missing variant/, "should throw if variant is ommitted");
//   assert.throws(
//     () => setup("foo", {foo: createExperiment({variant: {threshold: 0.1}})}),
//     /missing variant.value/, "should throw if variant.value is ommitted");
//   assert.ok(
//     () => setup("foo", {foo: createExperiment({variant: {value: 0}})}),
//     "should not throw for falsey values"
//   );
//   assert.throws(
//     () => setup("foo", {foo: createExperiment({variant: {value: 123}})}),
//     /missing variant.threshold/, "should throw if variant.threshold is ommitted");
//   assert.throws(
//     () => setup("foo", {foo: createExperiment({variant: {value: 123, threshold: 123}})}),
//     /variant.threshold must be less than 1/, "should throw if variant.threshold is > 1");
// };

exports["test ActivityStreams has experimentProvider instance"] = assert => {
  const as = new ActivityStreams({clientID: "k88"});
  assert.ok(as._experimentProvider instanceof ExperimentProvider, "should have _experimentProvider");
  assert.equal(as._experimentProvider._clientID, "k88", "should use clientID");
  as.unload();
};

test.run(exports);

const {assert} = require("chai");
const Experiments = require("reducers/Experiments");
const definitions = require("../../experiments.json");

describe("Experiments reducer", () => {
  it("should have data, error by default", () => {
    const state = Experiments(undefined, {});
    assert.property(state, "data", "has data property");
    assert.property(state, "error", "has error property");
  });
  it("should start with control values from experiments.json", () => {
    const state = Experiments(undefined, {});
    assert.isObject(state.data);
    Object.keys(definitions).forEach(key => {
      assert.property(state.data, key, `has data.${key}`);
      assert.isObject(state.data[key], `data.${key} is an object`);
      assert.equal(state.data[key].value, definitions[key].control.value, `data.${key}.value is ${definitions[key].control.value}`);
      assert.isFalse(state.data[key].inExperiment, `data.${key}.inExperiment is false`);
    });
  });
  it("should ignore events other than EXPERIMENTS_RESPONSE", () => {
    const prevState = {error: false, data: {}};
    const state = Experiments(prevState, {
      type: "SPOTLIGHT_RESPONSE",
      error: true,
      data: new Error("Whatever")
    });
    assert.equal(state, prevState, "state should equal previous state");
  });
  it("should set .error", () => {
    const testError = new Error("Blah blah");
    const state = Experiments(undefined, {
      type: "EXPERIMENTS_RESPONSE",
      error: true,
      data: testError
    });
    assert.equal(state.error, testError, "state.error should be the error");
  });
  it("should set .data", () => {
    const testData = {foo: {inExperiment: false}};
    const state = Experiments({error: true, data: {}}, {
      type: "EXPERIMENTS_RESPONSE",
      error: false,
      data: testData
    });
    assert.isFalse(state.error, "state.error should be false");
    assert.equal(state.data, testData, "state.data should be the new data");
  });
});

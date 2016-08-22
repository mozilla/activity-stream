const Experiments = require("reducers/Experiments");
const definitions = require("../../experiments.json");

describe("Experiments reducer", () => {
  it("should have data, error by default", () => {
    const state = Experiments(undefined, {});
    assert.property(state, "values", "has values property");
    assert.property(state, "error", "has error property");
  });
  it("should start with control values from experiments.json", () => {
    const state = Experiments(undefined, {});
    assert.isObject(state.values);
    Object.keys(definitions).forEach(key => {
      if (definitions[key].active === false) {
        return;
      }
      assert.property(state.values, key, `has data.${key}`);
      assert.equal(state.values[key], definitions[key].control.value, `data.${key}.value is ${definitions[key].control.value}`);
    });
  });
  it("should ignore experiments with active.false", () => {
    const state = Experiments(undefined, {});
    assert.notProperty(state.values, "sample", "should not have sample, since active=false");
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
  it("should set .values", () => {
    const testData = {foo: false};
    const state = Experiments({error: true, data: {}}, {
      type: "EXPERIMENTS_RESPONSE",
      error: false,
      data: testData
    });
    assert.isFalse(state.error, "state.error should be false");
    assert.equal(state.values, testData, "state.values should be the new data");
  });
});

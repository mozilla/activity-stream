const definitions = require("../experiments.json");
// This is the minimum size of the control group, expressed as a decimal
const MIN_CONTROL = 0.2;

describe("Experiment Definitions", () => {
  let control = 1;
  const variantIDs = new Set();
  Object.keys(definitions).forEach(key => {
    const experiment = definitions[key];
    describe(`experiment: ${key}`, () => {
      after(() => {
        if (experiment.active !== false) {
          control -= experiment.variant.threshold;
        }
        if (experiment.variant && experiment.variant.id) {
          variantIDs.add(experiment.variant.id);
        }
      });
      it("should have .name", () => {
        assert.property(experiment, "name", "exists");
        assert.isString(experiment.name);
      });
      it("should have .description", () => {
        assert.property(experiment, "description", "exists");
        assert.isString(experiment.description);
      });
      it("should have .control", () => {
        assert.property(experiment, "control", "exists");
        assert.isObject(experiment.control);
      });
      it("should have .control.value", () => {
        assert.property(experiment.control, "value", "exists");
      });
      it("should have .control.description", () => {
        assert.property(experiment.control, "description", "exists");
        assert.isString(experiment.control.description);
      });
      it("should have .variant", () => {
        assert.property(experiment, "variant", "exists");
        assert.isObject(experiment.variant);
      });
      it("should have .variant.id", () => {
        assert.property(experiment.variant, "id", "exists");
        assert.ok(!variantIDs.has(experiment.variant.id), "id should be unique");
      });
      it("should have .variant.description", () => {
        assert.property(experiment.variant, "description", "exists");
        assert.isString(experiment.variant.description);
      });
      it("should have .variant.threshold", () => {
        assert.property(experiment.variant, "threshold", "exists");
        assert.isNumber(experiment.variant.threshold);
        assert.isAtMost(experiment.variant.threshold, 1);
        assert.isAtLeast(experiment.variant.threshold, 0);
      });
    });
  });

  it(`should have a control percentage of at least ${MIN_CONTROL}`, () => {
    assert.isAtLeast(control, MIN_CONTROL, `control is at least ${MIN_CONTROL}`);
  });
});

const seedrandom = require("lib/vendor.bundle").SeedRandom;

exports.ExperimentProvider = class ExperimentProvider {
  constructor(clientID, experiments) {
    experiments = experiments || require("experiments.json");
    this._clientID = clientID;
    this._rng = seedrandom(clientID);
    this._data = {};
    Object.keys(experiments).forEach(key => {
      const experiment = experiments[key];
      this.validateExperiment(experiment, key);
      if (experiment.active === false) {
        return;
      }
      const {id, variant, control} = experiment;
      const inExperiment = this._rng() <= variant.threshold;
      this.data[key] = {
        id,
        value: inExperiment ? variant.value : control.value,
        inExperiment
      };
    });
  }
  get data() {
    return this._data;
  }
  validateExperiment(experiment, key) {
    const errors = [];
    if (!experiment.id) {
      errors.push("missing an id");
    }
    if (!experiment.name || typeof experiment.name !== "string") {
      errors.push("missing a name, which should be a string");
    }
    if (!experiment.control || typeof experiment.control !== "object") {
      errors.push("missing control, which should be an object");
    }
    if (experiment.control && typeof experiment.control.value === "undefined") {
      errors.push("missing control.value");
    }
    if (!experiment.variant || typeof experiment.variant !== "object") {
      errors.push("missing variant, which should be an object");
    }
    if (experiment.variant && typeof experiment.variant.value === "undefined") {
      errors.push("missing variant.value");
    }
    if (experiment.variant && typeof experiment.variant.threshold !== "number") {
      errors.push("missing variant.threshold, which should be a number");
    }
    if (experiment.variant && experiment.variant.threshold > 1) {
      errors.push("variant.threshold must be less than 1");
    }
    if (errors.length) {
      const msg = `ExperimentProvider: There were some errors found for the ${key} experiment: ${errors.join(", ")}`;
      console.error(msg); // eslint-disable-line no-console
      throw new Error(msg);
    }
  }
};

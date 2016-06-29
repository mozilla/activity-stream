const seedrandom = require("lib/vendor.bundle").SeedRandom;

exports.ExperimentProvider = class ExperimentProvider {
  constructor(clientID, experiments, rng) {
    experiments = experiments || require("experiments.json");
    this._clientID = clientID;
    this._rng = rng || seedrandom(clientID);
    this._data = {};
    this._experimentId = null;

    const randomNumber = this._rng();
    let floor = 0;

    Object.keys(experiments).forEach(key => {
      const experiment = experiments[key];
      this.validateExperiment(experiment, key);
      if (experiment.active === false) {
        return;
      }
      const {variant, control} = experiment;
      const ceiling = variant.threshold + floor;
      if (ceiling > 1) {
        throw new Error("Your variant cohort sizes should add up to less than 1.");
      }
      const inExperiment = randomNumber >= floor && randomNumber < ceiling;
      if (inExperiment) {
        this._experimentId = variant.id;
      }
      this.data[key] = {
        value: inExperiment ? variant.value : control.value,
        inExperiment
      };
      floor = ceiling;
    });
  }

  // This is an object representing all experiments
  get data() {
    return this._data;
  }

  // This returns null if the user is part of a control group,
  // or an id indicating the experiment/variant if they are part of it.
  get experimentId() {
    return this._experimentId;
  }

  // This is a utility to validate experiment definitions
  validateExperiment(experiment, key) {
    const errors = [];
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
    if (experiment.variant && !experiment.variant.id) {
      errors.push("missing variant.id");
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

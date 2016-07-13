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
      this._data[key] = inExperiment ? variant.value : control.value;
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
};

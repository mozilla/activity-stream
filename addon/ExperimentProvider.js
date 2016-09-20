const seedrandom = require("common/vendor")("seedrandom");
const simplePrefs = require("sdk/simple-prefs");
const OVERRIDE_PREF = "experimentOverrides";

exports.OVERRIDE_PREF = OVERRIDE_PREF;
exports.ExperimentProvider = class ExperimentProvider {
  constructor(clientID, experiments = require("../experiments.json"), rng) {
    this._clientID = clientID;
    this._experiments = experiments;
    this._rng = rng || seedrandom(clientID);
    this._data = {};
    this._experimentId = null;

    this.init();
  }

  init() {
    this.setValues();
    this._onPrefChange = () => this.setValues();
    simplePrefs.on(OVERRIDE_PREF, this._onPrefChange);
  }

  setValues() {
    // Load override pref, if defined
    const overrides = simplePrefs.prefs[OVERRIDE_PREF] && simplePrefs.prefs[OVERRIDE_PREF].split(/,?\s+/);

    const randomNumber = this._rng();
    let floor = 0;

    Object.keys(this._experiments).forEach(key => {
      let inExperiment;
      const experiment = this._experiments[key];
      if (!overrides && experiment.active === false) {
        return;
      }
      const {variant, control} = experiment;

      // If an override pref is defined, use it to determine which
      // experiment values are used. If not, just use our random number generator.
      // Note that no _experimentId is set for manually overridden prefs.
      if (overrides) {
        inExperiment = overrides.includes(key);
      } else {
        const ceiling = variant.threshold + floor;
        if (ceiling > 1) {
          throw new Error("Your variant cohort sizes should add up to less than 1.");
        }
        inExperiment = randomNumber >= floor && randomNumber < ceiling;
        if (inExperiment) {
          this._experimentId = variant.id;
        }
        floor = ceiling;
      }
      this._data[key] = inExperiment ? variant.value : control.value;
    });

    if (overrides) {
      console.log(`The following experiments were turned on via overrides:\n - ${overrides.join("\n - ")}`); // eslint-disable-line no-console
    }
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

  destroy() {
    simplePrefs.removeListener(OVERRIDE_PREF, this._onPrefChange);
    this._data = {};
    this._experimentId = null;
  }
};

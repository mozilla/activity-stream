const {Cu} = require("chrome");
const prefService = require("sdk/preferences/service");
const simplePrefs = require("sdk/simple-prefs");
const {setTimeout} = require("sdk/timers");
const {preferencesBranch} = require("sdk/self");
const PREF_PREFIX = `extensions.${preferencesBranch}.experiments.`;
const EXPERIMENTS_ENDPOINT = "experiments.endpoint";
const EXPERIMENTS_REFRESH_TIMEOUT = 60 * 60 * 1000; // Refresh once per hour

Cu.importGlobalProperties(["fetch"]);
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

exports.ExperimentProvider = class ExperimentProvider {
  constructor(experiments = null, rng) {
    this._testMode = false;
    this._experiments = {};
    this._rng = rng || Math.random;
    this._data = {};
    this._experimentId = null;

    if (experiments) {
      this._testMode = true;
      this._experiments = experiments;
    }
    EventEmitter.decorate(this);
  }

  init() {
    if (this._testMode) {
      this.setupExperiments();
    } else {
      const experimentsEndpoint = simplePrefs.prefs[EXPERIMENTS_ENDPOINT];
      if (experimentsEndpoint) {
        fetch(simplePrefs.prefs[EXPERIMENTS_ENDPOINT])
          .then(response => response.json())
          .then(experiments => {
            this._experiments = {};
            this._data = {};
            experiments.forEach(experiment => {
              this._experiments[experiment.slug] = experiment;
            });
            this.setupExperiments();
            setTimeout(this.init.bind(this), EXPERIMENTS_REFRESH_TIMEOUT);
          })
          .catch(e => {
            Cu.reportError(e);
          });
      }
    }
  }

  setupExperiments() {
    this.setValues();
    Object.keys(this._experiments).forEach(experimentId => {
      Object.defineProperty(this._data, experimentId, {
        get() {
          return prefService.get(PREF_PREFIX + experimentId);
        },
        enumerable: true
      });
    });
  }

  /**
   * This is used to disable all experiments, i.e set all their
   * values to their original control value.
   */
  disableAllExperiments() {
    Object.keys(this._experiments).forEach(experimentId => {
      const experiment = this._experiments[experimentId];
      const {active, control} = experiment;
      if (active) {
        prefService.set(PREF_PREFIX + experimentId, control.value);
      }
    });
  }

  enroll(experimentId, variant) {
    this._experimentId = experimentId;
    prefService.set(PREF_PREFIX + experimentId, variant.value);
    this.emit("experimentEnrolled", {id: experimentId, variant});
  }

  setValues() {
    if (simplePrefs.prefs.experimentsOverridden) {
      console.log(`The following experiments were turned on via overrides:\n`); // eslint-disable-line no-console
      Object.keys(this._experiments).forEach(experimentId => {
        const {variant, control} = this._experiments[experimentId];
        if (prefService.get(PREF_PREFIX + experimentId) === variant.value) {
          console.log(`- ${experimentId} - \n`); // eslint-disable-line no-console
        } else {
          prefService.set(PREF_PREFIX + experimentId, control.value);
        }
      });
      return;
    }

    // if the global pref to disable experiments is on, disable experiments
    if (!prefService.get(`extensions.${preferencesBranch}.activateExperiments`)) {
      this.disableAllExperiments();
      return;
    }

    const randomNumber = this._rng();
    let floor = 0;
    let inExperiment;

    Object.keys(this._experiments).forEach(experimentId => {
      const experiment = this._experiments[experimentId];
      const {variant, control} = experiment;

      if (prefService.get(PREF_PREFIX + experimentId) === variant.value) {
        if (experiment.active) {
          // If the user is already part of an active experiment, set the experiment id.
          this._experimentId = experimentId;
        } else {
          // If the user is part of an inactive experiment,
          // reset that experiment's pref.
          prefService.set(PREF_PREFIX + experimentId, control.value);
          this._experimentId = null;
        }
      }
    });

    Object.keys(this._experiments).forEach(experimentId => {
      const experiment = this._experiments[experimentId];
      const {variant, control} = experiment;
      const ceiling = variant.threshold + floor;

      // If the experiment is not new or not active you will not be assigned to it.
      if (prefService.has(PREF_PREFIX + experimentId) || !experiment.active) {
        return;
      }

      // If the experiment pref is undefined, it's a new experiment. Start
      // by assuming the user will not be in it.
      prefService.set(PREF_PREFIX + experimentId, control.value);

      if (ceiling > 1) {
        throw new Error("Your variant cohort sizes should add up to less than 1.");
      }

      // If you're already in an experiment, you can't be in another one.
      if (this._experimentId) {
        return;
      }

      // If a user is in no experiments and there are new, active experiments,
      // randomly assign them to a variant (or control)
      inExperiment = randomNumber >= floor && randomNumber < ceiling;
      if (inExperiment) {
        this.enroll(experimentId, variant);
      }
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

  destroy() {
    this._experimentId = null;
  }

  clearPrefs() {
    Object.keys(this._experiments).forEach(experimentId => {
      prefService.reset(PREF_PREFIX + experimentId);
    });
    simplePrefs.prefs.experimentsOverridden = false;
  }
};

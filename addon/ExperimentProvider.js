const {Cu} = require("chrome");
const prefService = require("sdk/preferences/service");
const simplePrefs = require("sdk/simple-prefs");
const {setTimeout} = require("sdk/timers");
const {PrefsTarget} = require("sdk/preferences/event-target");
const {preferencesBranch} = require("sdk/self");
const PREF_PREFIX = `extensions.${preferencesBranch}.experiments.`;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

Cu.importGlobalProperties(["fetch"]);

const EXPERIMENTS_ENDPOINT = "experiments.endpoint";
const EXPERIMENTS_REFRESH_TIMEOUT = 60 * 60 * 1000; // Refresh once per hour

exports.ExperimentProvider = class ExperimentProvider {
  constructor(rng) {
    this._experiments = null;
    this._experimentsEndpoint = simplePrefs.prefs[EXPERIMENTS_ENDPOINT];
    this._rng = rng || Math.random;
    this._data = {};
    this._experimentId = null;
    this._target = PrefsTarget();
    EventEmitter.decorate(this);

    this._onPrefChange = this._onPrefChange.bind(this);
  }

  init() {
    if (!this._experimentsEndpoint) {
      return;
    }

    fetch(this._experimentsEndpoint).then(response => response.json()).then(experimentsData => {
      this._experiments = experimentsData;

      this.setValues();

      this._data = {};
      this._experiments.forEach(experiment => {
        this._target.on(PREF_PREFIX + experiment.slug, this._onPrefChange);
        Object.defineProperty(this._data, experiment.slug, {
          get() {
            return prefService.get(PREF_PREFIX + experiment.slug);
          },
          enumerable: true
        });
      });
    })
    .catch(e => {
      Cu.reportError(e);
    });

    setTimeout(this.init.bind(this), EXPERIMENTS_REFRESH_TIMEOUT);
  }

  _onPrefChange(prefName) {
    this.emit("change", prefName);
  }

  /**
   * This is used to disable all experiments, i.e set all their
   * values to their original control value.
   */
  disableAllExperiments() {
    this._experiments.forEach(experiment => {
      if (experiment.active) {
        prefService.set(PREF_PREFIX + experiment.slug, experiment.control.value);
      }
    });
  }

  setValues() {
    if (simplePrefs.prefs.experimentsOverridden) {
      console.log(`The following experiments were turned on via overrides:\n`); // eslint-disable-line no-console
      this._experiments.forEach(experiment => {
        if (prefService.get(PREF_PREFIX + experiment.slug) === experiment.variant.value) {
          console.log(`- ${experiment.slug} - \n`); // eslint-disable-line no-console
        } else {
          prefService.set(PREF_PREFIX + experiment.slug, experiment.control.value);
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

    this._experiments.forEach(experiment => {
      if (prefService.get(PREF_PREFIX + experiment.slug) === experiment.variant.value) {
        if (experiment.active) {
          // If the user is already part of an active experiment, set the experiment id.
          this._experimentId = experiment.slug;
        } else {
          // If the user is part of an inactive experiment,
          // reset that experiment's pref.
          prefService.set(PREF_PREFIX + experiment.slug, experiment.control.value);
          this._experimentId = null;
        }
      }
    });

    this._experiments.forEach(experiment => {
      const ceiling = experiment.variant.threshold + floor;

      // If the experiment is not new or not active you will not be assigned to it.
      if (prefService.has(PREF_PREFIX + experiment.slug) || !experiment.active) {
        return;
      }

      // If the experiment pref is undefined, it's a new experiment. Start
      // by assuming the user will not be in it.
      prefService.set(PREF_PREFIX + experiment.slug, experiment.control.value);

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
        this._experimentId = experiment.slug;
        prefService.set(PREF_PREFIX + experiment.slug, experiment.variant.value);
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
    this._experiments.forEach(experiment => {
      this._target.removeListener(PREF_PREFIX + experiment.slug, this._onPrefChange);
    });
  }

  clearPrefs() {
    this._experiments.forEach(experiment => {
      prefService.reset(PREF_PREFIX + experiment.slug);
    });
    simplePrefs.prefs.experimentsOverridden = false;
  }
};

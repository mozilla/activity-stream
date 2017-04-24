/* global XPCOMUtils, EventEmitter */

const {Cu} = require("chrome");
const prefService = require("sdk/preferences/service");
const simplePrefs = require("sdk/simple-prefs");
const {PrefsTarget} = require("sdk/preferences/event-target");
const {preferencesBranch} = require("sdk/self");
const PREF_PREFIX = `extensions.${preferencesBranch}.experiments.`;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGetter(this, "EventEmitter", () => {
  const {EventEmitter} = Cu.import("resource://devtools/shared/event-emitter.js", {});
  return EventEmitter;
});

exports.ExperimentProvider = class ExperimentProvider {
  constructor(experiments = require("../experiments.json"), rng) {
    this._experiments = experiments;
    this._rng = rng || Math.random;
    this._data = {};
    this._experimentId = null;
    this._target = PrefsTarget();
    EventEmitter.decorate(this);

    this._onPrefChange = this._onPrefChange.bind(this);
  }

  init() {
    this.setValues();
    Object.keys(this._experiments).forEach(experimentName => {
      this._target.on(PREF_PREFIX + experimentName, this._onPrefChange);
      Object.defineProperty(this._data, experimentName, {
        get() {
          return prefService.get(PREF_PREFIX + experimentName);
        },
        enumerable: true
      });
    });
  }

  _onPrefChange(prefName) {
    this.overrideExperimentPrefs(prefName);
    this.emit("change", prefName);
  }

  /**
   * This is called when experiment prefs are changed so
   * that users are pulled out of all experiment reporting.
   */
  overrideExperimentPrefs(prefName) {
    simplePrefs.prefs.experimentsOverridden = true;
    this._experimentId = null;
  }

  /**
   * This is used to disable all experiments, i.e set all their
   * values to their original control value.
   */
  disableAllExperiments() {
    Object.keys(this._experiments).forEach(key => {
      const experiment = this._experiments[key];
      const {active, control} = experiment;
      if (active) {
        prefService.set(PREF_PREFIX + key, control.value);
      }
    });
  }

  enroll(experimentId, variant) {
    this._experimentId = variant.id;
    prefService.set(PREF_PREFIX + experimentId, variant.value);
    if (experimentId === "pocket") {
      simplePrefs.prefs.showPocket = true;
    }
    this.emit("experimentEnrolled", {id: experimentId, variant});
  }

  setValues() {
    if (simplePrefs.prefs.experimentsOverridden) {
      console.log(`The following experiments were turned on via overrides:\n`); // eslint-disable-line no-console
      Object.keys(this._experiments).forEach(experimentName => {
        const {variant, control} = this._experiments[experimentName];
        if (prefService.get(PREF_PREFIX + experimentName) === variant.value) {
          console.log(`- ${experimentName} - \n`); // eslint-disable-line no-console
        } else {
          prefService.set(PREF_PREFIX + experimentName, control.value);
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

    Object.keys(this._experiments).forEach(key => {
      const experiment = this._experiments[key];
      const {variant, control} = experiment;

      if (prefService.get(PREF_PREFIX + key) === variant.value) {
        if (experiment.active) {
          // If the user is already part of an active experiment, set the experiment id.
          this._experimentId = variant.id;
        } else {
          // If the user is part of an inactive experiment,
          // reset that experiment's pref.
          prefService.set(PREF_PREFIX + key, control.value);
          this._experimentId = null;
        }
      }
    });

    Object.keys(this._experiments).forEach(key => {
      const experiment = this._experiments[key];
      const {variant, control} = experiment;
      const ceiling = variant.threshold + floor;

      // If the experiment is not new or not active you will not be assigned to it.
      if (prefService.has(PREF_PREFIX + key) || !experiment.active) {
        return;
      }

      // If the experiment pref is undefined, it's a new experiment. Start
      // by assuming the user will not be in it.
      prefService.set(PREF_PREFIX + key, control.value);

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
        this.enroll(key, variant);
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
    Object.keys(this._experiments).forEach(experimentName => {
      this._target.removeListener(PREF_PREFIX + experimentName, this._onPrefChange);
    });
  }

  clearPrefs() {
    Object.keys(this._experiments).forEach(experimentName => {
      prefService.reset(PREF_PREFIX + experimentName);
    });
    simplePrefs.prefs.experimentsOverridden = false;
  }
};

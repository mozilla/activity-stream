class PrefService {
  constructor() {
    this.prefs = {};
  }

  setPrefs(prefs) {
    this.prefs = prefs;
  }

  get(prefName) {
    return this.prefs[prefName];
  }

  set(prefName, prefVal) {
    this.prefs[prefName] = prefVal;
  }

  has(prefName) {
    return this.prefs[prefName] !== undefined;
  }

  reset() {
    this.prefs = {};
  }
}

module.exports = new PrefService();
module.exports.PrefService = PrefService;

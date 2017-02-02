const {PrefsTarget} = require("sdk/preferences/event-target");
const {findClosestLocale, getPreferedLocales} = require("sdk/l10n/locale");
const Feed = require("../lib/Feed");
const am = require("../../common/action-manager");

const STRINGS = require("../../data/locales/locales.json");
const AVAILABLE_LOCALES = Object.keys(STRINGS);
const DEFAULT_LOCALE = "en-US";

// These all affect getPreferedLocales
const LOCALE_PREFS = [
  "intl.locale.matchOS",
  "general.useragent.locale",
  "intl.accept_languages"
];

class LocalizationFeed extends Feed {
  constructor(options) {
    super(options);
    this.availableLocales = options.availableLocales || AVAILABLE_LOCALES;
    this.prefsTarget = PrefsTarget();
    this.onPrefChange = this.onPrefChange.bind(this);
  }
  onPrefChange(pref) {
    this.refresh(`${pref} pref was updated`);
  }
  addListeners() {
    LOCALE_PREFS.forEach(pref => this.prefsTarget.on(pref, this.onPrefChange));
  }
  removeListeners() {
    LOCALE_PREFS.forEach(pref => this.prefsTarget.removeListener(pref, this.onPrefChange));
  }
  getData() {
    let locale = findClosestLocale(this.availableLocales, getPreferedLocales());
    const strings = STRINGS[locale] || STRINGS[DEFAULT_LOCALE];
    return Promise.resolve(am.actions.Response("LOCALE_UPDATED", {locale, strings}));
  }
  onAction(state, action) {
    switch (action.type) {
      case am.type("APP_INIT"):
        this.addListeners();
        this.refresh("app was initializing");
        break;
      case am.type("APP_UNLOAD"):
        this.removeListeners();
    }
  }
}

LocalizationFeed.AVAILABLE_LOCALES = AVAILABLE_LOCALES;
LocalizationFeed.LOCALE_PREFS = LOCALE_PREFS;

module.exports = LocalizationFeed;

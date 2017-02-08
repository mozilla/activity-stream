const {PrefsTarget} = require("sdk/preferences/event-target");
const {findClosestLocale, getPreferedLocales} = require("sdk/l10n/locale");
const Feed = require("../lib/Feed");
const am = require("../../common/action-manager");
const DEFAULT_LOCALE = "en-US";
const STRINGS = require("../../data/locales/locales.json");
const AVAILABLE_LOCALES = Object.keys(STRINGS);
const RTL_LIST = ["ar", "he", "fa", "ur"];

function getLocalizedStrings(locale, allStrings = STRINGS) {
  if (locale === DEFAULT_LOCALE) {
    return allStrings[DEFAULT_LOCALE];
  }
  const strings = allStrings[locale];
  // This will include the English string for any missing ids
  return Object.assign({}, allStrings[DEFAULT_LOCALE], strings || {});
}

function getDirection(locale) {
  return (RTL_LIST.indexOf(locale.split("-")[0]) >= 0) ? "rtl" : "ltr";
}

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
    const strings = getLocalizedStrings(locale);
    const direction = getDirection(locale);
    return Promise.resolve(am.actions.Response("LOCALE_UPDATED", {locale, strings, direction}));
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

LocalizationFeed.DEFAULT_LOCALE = DEFAULT_LOCALE;
LocalizationFeed.AVAILABLE_LOCALES = AVAILABLE_LOCALES;
LocalizationFeed.LOCALE_PREFS = LOCALE_PREFS;
LocalizationFeed.getLocalizedStrings = getLocalizedStrings;
LocalizationFeed.getDirection = getDirection;

module.exports = LocalizationFeed;

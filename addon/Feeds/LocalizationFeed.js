const {readURI} = require("sdk/net/url");
const {data} = require("sdk/self");
const {PrefsTarget} = require("sdk/preferences/event-target");
const {findClosestLocale, getPreferedLocales} = require("sdk/l10n/locale");
const Feed = require("addon/lib/Feed");
const am = require("common/action-manager");

const AVAILABLE_LOCALES = ["en-US"];

// These all affect getPreferedLocales
const LOCALE_PREFS = [
  "intl.locale.matchOS",
  "general.useragent.locale",
  "intl.accept_languages"
];

class LocalizationFeed extends Feed {
  constructor(options) {
    super(options);
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
    const locale = findClosestLocale(AVAILABLE_LOCALES, getPreferedLocales());
    return readURI(data.url(`locales/${locale}/strings.json`))
      .then(strings => JSON.parse(strings))
      .then(strings => am.actions.Response("LOCALE_UPDATED", {locale, strings}));
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

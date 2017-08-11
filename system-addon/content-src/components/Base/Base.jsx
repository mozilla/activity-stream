const React = require("react");
const {connect} = require("react-redux");
const {addLocaleData, IntlProvider} = require("react-intl");
const TopSites = require("content-src/components/TopSites/TopSites");
const Search = require("content-src/components/Search/Search");
const ConfirmDialog = require("content-src/components/ConfirmDialog/ConfirmDialog");
const ManualMigration = require("content-src/components/ManualMigration/ManualMigration");
const PreferencesPane = require("content-src/components/PreferencesPane/PreferencesPane");
const Sections = require("content-src/components/Sections/Sections");

// Locales that should be displayed RTL
const RTL_LIST = ["ar", "he", "fa", "ur"];

// Add the locale data for pluralization and relative-time formatting for now,
// this just uses english locale data. We can make this more sophisticated if
// more features are needed.
function addLocaleDataForReactIntl({locale}) {
  addLocaleData([{locale, parentLocale: "en"}]);
  document.documentElement.lang = locale;
  document.documentElement.dir = RTL_LIST.indexOf(locale.split("-")[0]) >= 0 ? "rtl" : "ltr";
}

class Base extends React.Component {
  componentDidMount() {
    // Also wait for the preloaded page to show, so the tab's title and favicon updates
    addEventListener("visibilitychange", () => {
      this.updateTitle(this.props.App);
      document.getElementById("favicon").href += "#";
    }, {once: true});
  }
  componentWillUpdate({App}) {
    // Early loads might not have locale yet, so wait until we do
    if (App.locale && App.locale !== this.props.App.locale) {
      addLocaleDataForReactIntl(App);
      this.updateTitle(App);
    }
  }

  updateTitle({strings}) {
    if (strings) {
      document.title = strings.newtab_page_title;
    }
  }

  render() {
    const props = this.props;
    const {locale, strings, initialized} = props.App;
    const prefs = props.Prefs.values;
    if (!initialized || !strings) {
      return null;
    }

    return (<IntlProvider key={locale} locale={locale} messages={strings}>
        <div className="outer-wrapper">
          <main>
            {prefs.showSearch && <Search />}
            {!prefs.migrationExpired && <ManualMigration />}
            {prefs.showTopSites && <TopSites />}
            <Sections />
            <ConfirmDialog />
          </main>
          <PreferencesPane />
        </div>
      </IntlProvider>);
  }
}

module.exports = connect(state => ({App: state.App, Prefs: state.Prefs}))(Base);

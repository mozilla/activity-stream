const React = require("react");
const {connect} = require("react-redux");
const {addLocaleData, IntlProvider} = require("react-intl");
const TopSites = require("content-src/components/TopSites/TopSites");
const Search = require("content-src/components/Search/Search");
const ConfirmDialog = require("content-src/components/ConfirmDialog/ConfirmDialog");
const ManualMigration = require("content-src/components/ManualMigration/ManualMigration");
const PreferencesPane = require("content-src/components/PreferencesPane/PreferencesPane");
const Sections = require("content-src/components/Sections/Sections");
const {actionTypes: at, actionCreators: ac} = require("common/Actions.jsm");

// Add the locale data for pluralization and relative-time formatting for now,
// this just uses english locale data. We can make this more sophisticated if
// more features are needed.
function addLocaleDataForReactIntl({locale, textDirection}) {
  addLocaleData([{locale, parentLocale: "en"}]);
  document.documentElement.lang = locale;
  document.documentElement.dir = textDirection;
}

class Base extends React.Component {
  componentWillMount() {
    this.sendNewTabRehydrated(this.props.App);
  }

  componentDidMount() {
    // Request state AFTER the first render to ensure we don't cause the
    // prerendered DOM to be unmounted. Otherwise, NEW_TAB_STATE_REQUEST is
    // dispatched right after the store is ready.
    if (this.props.isPrerendered) {
      this.props.dispatch(ac.SendToMain({type: at.NEW_TAB_STATE_REQUEST}));
    }

    // Also wait for the preloaded page to show, so the tab's title and favicon updates
    addEventListener("visibilitychange", () => {
      this.updateTitle(this.props.App);
      document.getElementById("favicon").href += "#";
    }, {once: true});
  }

  componentWillUpdate({App}) {
    this.sendNewTabRehydrated(App);

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

  // The NEW_TAB_REHYDRATED event is used to inform feeds that their
  // data has been consumed e.g. for counting the number of tabs that
  // have rendered that data.
  sendNewTabRehydrated(App) {
    if (App && App.initialized && !this.renderNotified) {
      this.props.dispatch(ac.SendToMain({type: at.NEW_TAB_REHYDRATED, data: {}}));
      this.renderNotified = true;
    }
  }

  render() {
    const props = this.props;
    const {locale, strings, initialized} = props.App;
    const prefs = props.Prefs.values;

    if (!props.isPrerendered && !initialized) {
      return null;
    }

    // Note: the key on IntlProvider must be static in order to not blow away
    // all elements on a locale change (such as after preloading).
    // See https://github.com/yahoo/react-intl/issues/695 for more info.
    return (<IntlProvider key="STATIC" locale={locale} messages={strings}>
        <div className="outer-wrapper">
          <main>
            {prefs.showSearch && <Search />}
            {!prefs.migrationExpired && <ManualMigration />}
            {prefs.showTopSites && <TopSites />}
            <Sections />
            <ConfirmDialog />
          </main>
          {initialized && <PreferencesPane />}
        </div>
      </IntlProvider>);
  }
}

module.exports = connect(state => ({App: state.App, Prefs: state.Prefs}))(Base);
module.exports._unconnected = Base;

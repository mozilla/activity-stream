import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {addLocaleData, IntlProvider} from "react-intl";
import {ConfirmDialog} from "content-src/components/ConfirmDialog/ConfirmDialog";
import {connect} from "react-redux";
import {ManualMigration} from "content-src/components/ManualMigration/ManualMigration";
import {PreferencesPane} from "content-src/components/PreferencesPane/PreferencesPane";
import {PrerenderData} from "common/PrerenderData.jsm";
import React from "react";
import {Search} from "content-src/components/Search/Search";
import {Sections} from "content-src/components/Sections/Sections";
import {TopSites} from "content-src/components/TopSites/TopSites";

// Add the locale data for pluralization and relative-time formatting for now,
// this just uses english locale data. We can make this more sophisticated if
// more features are needed.
function addLocaleDataForReactIntl(locale) {
  addLocaleData([{locale, parentLocale: "en"}]);
}

export class _Base extends React.PureComponent {
  componentWillMount() {
    const {App, locale} = this.props;
    this.sendNewTabRehydrated(App);
    addLocaleDataForReactIntl(locale);
  }

  componentDidMount() {
    // Request state AFTER the first render to ensure we don't cause the
    // prerendered DOM to be unmounted. Otherwise, NEW_TAB_STATE_REQUEST is
    // dispatched right after the store is ready.
    if (this.props.isPrerendered) {
      this.props.dispatch(ac.SendToMain({type: at.NEW_TAB_STATE_REQUEST}));
      this.props.dispatch(ac.SendToMain({type: at.PAGE_PRERENDERED}));
    }
  }

  componentWillUpdate({App}) {
    this.sendNewTabRehydrated(App);
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
    const {App, locale, strings} = props;
    const {initialized} = App;
    const prefs = props.Prefs.values;

    const shouldBeFixedToTop = PrerenderData.arePrefsValid(name => prefs[name]);

    const outerClassName = `outer-wrapper${shouldBeFixedToTop ? " fixed-to-top" : ""}`;

    if (!props.isPrerendered && !initialized) {
      return null;
    }

    return (<IntlProvider locale={locale} messages={strings}>
        <div className={outerClassName}>
          <main>
            {prefs.showSearch && <Search />}
            <div className={`body-wrapper${(initialized ? " on" : "")}`}>
              {!prefs.migrationExpired && <ManualMigration />}
              {prefs.showTopSites && <TopSites />}
              <Sections />
            </div>
            <ConfirmDialog />
          </main>
          {initialized && <PreferencesPane />}
        </div>
      </IntlProvider>);
  }
}

export const Base = connect(state => ({App: state.App, Prefs: state.Prefs}))(_Base);

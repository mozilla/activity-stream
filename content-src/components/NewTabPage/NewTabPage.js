const React = require("react");
const {connect} = require("react-redux");
const {selectNewTabSites} = require("common/selectors/selectors");
const TopSites = require("components/TopSites/TopSites");
const Bookmarks = require("components/Bookmarks/Bookmarks");
const VisitAgain = require("components/VisitAgain/VisitAgain");
const PocketStories = require("components/PocketStories/PocketStories");
const Search = require("components/Search/Search");
const Loader = require("components/Loader/Loader");
const PreferencesPane = require("components/PreferencesPane/PreferencesPane");
const {actions} = require("common/action-manager");
const setFavicon = require("lib/set-favicon");
const PAGE_NAME = "NEW_TAB";
const {
  TOP_SITES_DEFAULT_LENGTH,
  TOP_SITES_SHOWMORE_LENGTH, POCKET_STORIES_LENGTH,
  BOOKMARKS_DISPLAYED_LENGTH, VISITAGAIN_DISPLAYED_LENGTH
} = require("common/constants");
const {injectIntl} = require("react-intl");

const NewTabPage = React.createClass({
  getInitialState() {
    return {showSettingsMenu: false};
  },
  _getNewTabStats() {
    let stats = {
      topsitesSize: 0,
      topsitesTippytop: 0,
      topsitesScreenshot: 0,
      topsitesLowResIcon: 0
    };
    if (this.props.isReady) {
      const {showTopSites} = this.props.Prefs.prefs;
      if (showTopSites) {
        const topSites = this.props.TopSites.rows;
        stats.topsitesSize = topSites.length;
        topSites.forEach(row => {
          if (row && row.screenshot) {
            stats.topsitesScreenshot++;
          } else if (row && row.metadata_source === "TippyTopProvider") {
            stats.topsitesTippytop++;
          } else if (row && !row.hasHighResIcon && !row.screenshot) {
            stats.topsitesLowResIcon++;
          }
        });
      }
    }
    return stats;
  },
  componentDidMount() {
    document.title = this.props.intl.formatMessage({id: "newtab_page_title"});
    setFavicon("newtab-icon.svg");

    // Note that data may or may not be complete, depending on
    // the state of the master store, as well as if all the selectors
    // have finished (in which case the "Welcome" dialog maybe be being shown
    // without any actual images).
    this.props.dispatch(actions.NotifyPerf("NEWTAB_RENDER"));

    if (!this.props.isReady) {
      this.loaderShownAt = Date.now();
      this.props.dispatch(actions.NotifyUndesiredEvent({
        event: "SHOW_LOADER",
        source: PAGE_NAME,
        value: this.loaderShownAt
      }));
    } else {
      this.props.dispatch(actions.NotifyNewTabStats(this._getNewTabStats()));
    }
  },
  componentDidUpdate(prevProps) {
    if (this.props.isReady && this.loaderShownAt) {
      this.props.dispatch(actions.NotifyNewTabStats(this._getNewTabStats()));
      this.props.dispatch(actions.NotifyUndesiredEvent({
        event: "HIDE_LOADER",
        source: PAGE_NAME,
        value: Date.now() - this.loaderShownAt
      }));
      delete this.loaderShownAt;
    }
  },
  render() {
    const props = this.props;
    const {showSearch, showTopSites, showPocket, showBookmarks, showVisitAgain, showMoreTopSites} = props.Prefs.prefs;

    return (<main className="new-tab">
      <div className="new-tab-wrapper">
        {showSearch &&
          <section>
            <Search />
          </section>
        }
        <Loader
          className="loading-notice"
          show={!this.props.isReady}
          title="welcome_title"
          body="welcome_body"
          label="welcome_label"
          defaultLabel="default_label_loading" />
        <div className="show-on-init on">
          {showTopSites &&
            <TopSites placeholder={!this.props.isReady} page={PAGE_NAME}
              sites={props.TopSites.rows} showNewStyle={true}
              length={showMoreTopSites ? TOP_SITES_SHOWMORE_LENGTH : TOP_SITES_DEFAULT_LENGTH}
              prefs={props.Prefs.prefs} />
          }
          {showPocket &&
            <PocketStories placeholder={!this.props.isReady} page={PAGE_NAME}
              length={POCKET_STORIES_LENGTH} stories={props.PocketStories.rows}
              topics={props.PocketTopics.rows} prefs={props.Prefs.prefs} />
          }
          {showBookmarks &&
            <Bookmarks placeholder={!this.props.isReady} page={PAGE_NAME}
                       length={BOOKMARKS_DISPLAYED_LENGTH} sites={props.Bookmarks.rows}
                       prefs={props.Prefs.prefs} />
          }
          {showVisitAgain &&
            <VisitAgain placeholder={!this.props.isReady} page={PAGE_NAME}
                       length={VISITAGAIN_DISPLAYED_LENGTH} sites={props.VisitAgain.rows}
                       prefs={props.Prefs.prefs} />
          }
        </div>
      </div>
      <PreferencesPane Prefs={props.Prefs} />
    </main>);
  }
});

NewTabPage.propTypes = {
  TopSites: React.PropTypes.object.isRequired,
  PocketStories: React.PropTypes.object.isRequired,
  Bookmarks: React.PropTypes.object.isRequired,
  Experiments: React.PropTypes.object.isRequired,
  Prefs: React.PropTypes.object.isRequired,
  isReady: React.PropTypes.bool.isRequired,
  dispatch: React.PropTypes.func.isRequired
};

module.exports = connect(selectNewTabSites)(injectIntl(NewTabPage));
module.exports.NewTabPage = NewTabPage;

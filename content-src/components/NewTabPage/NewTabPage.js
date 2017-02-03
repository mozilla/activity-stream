const React = require("react");
const {connect} = require("react-redux");
const {selectNewTabSites} = require("common/selectors/selectors");
const TopSites = require("components/TopSites/TopSites");
const Spotlight = require("components/Spotlight/Spotlight");
const Search = require("components/Search/Search");
const Loader = require("components/Loader/Loader");
const {actions} = require("common/action-manager");
const setFavicon = require("lib/set-favicon");
const PAGE_NAME = "NEW_TAB";
const {HIGHLIGHTS_LENGTH} = require("common/constants");
const classNames = require("classnames");
const {injectIntl} = require("react-intl");

const NewTabPage = React.createClass({
  getInitialState() {
    return {showSettingsMenu: false};
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
    }
  },
  componentDidUpdate(prevProps) {
    if (this.props.isReady && this.loaderShownAt) {
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

    const topSitesExperimentIsOn = props.Experiments.values.screenshots;

    return (<main className={classNames("new-tab", {"top-sites-new-style": topSitesExperimentIsOn})}>
      <div className="new-tab-wrapper">
        <section>
          <Search />
        </section>
        <Loader
          className="loading-notice"
          show={!this.props.isReady}
          title="welcome_title"
          body="welcome_body"
          label="welcome_label"
          defaultLabel="default_label_loading" />
        <div className="show-on-init on">
          <section>
            <TopSites placeholder={!this.props.isReady} page={PAGE_NAME}
              sites={props.TopSites.rows} showNewStyle={topSitesExperimentIsOn} />
          </section>

          <section>
            <Spotlight placeholder={!this.props.isReady} page={PAGE_NAME}
              length={HIGHLIGHTS_LENGTH} sites={props.Highlights.rows} />
          </section>
        </div>
      </div>
    </main>);
  }
});

NewTabPage.propTypes = {
  TopSites: React.PropTypes.object.isRequired,
  Highlights: React.PropTypes.object.isRequired,
  Experiments: React.PropTypes.object.isRequired,
  dispatch: React.PropTypes.func.isRequired
};

module.exports = connect(selectNewTabSites)(injectIntl(NewTabPage));
module.exports.NewTabPage = NewTabPage;

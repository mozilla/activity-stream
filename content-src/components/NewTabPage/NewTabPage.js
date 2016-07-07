const React = require("react");
const {connect} = require("react-redux");
const {selectNewTabSites} = require("selectors/selectors");
const TopSites = require("components/TopSites/TopSites");
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");
const Search = require("components/Search/Search");
const Loader = require("components/Loader/Loader");
const ContextMenu = require("components/ContextMenu/ContextMenu");
const {actions} = require("common/action-manager");
const {Link} = require("react-router");
const setFavicon = require("lib/set-favicon");
const classNames = require("classnames");
const MAX_TOP_ACTIVITY_ITEMS = 10;
const PAGE_NAME = "NEW_TAB";

const NewTabPage = React.createClass({
  getInitialState() {
    return {
      showSettingsMenu: false,
      renderedOnce: false
    };
  },
  toggleRecommendation() {
    this.props.dispatch(actions.NotifyEvent({
      event: "TOGGLE_RECOMMENDATION",
      page: PAGE_NAME
    }));
    this.props.dispatch(actions.NotifyToggleRecommendations());
    this.props.dispatch(actions.RequestHighlightsLinks());
  },
  componentDidMount() {
    document.title = "New Tab";
    setFavicon("newtab-icon.svg");
  },
  componentDidUpdate() {
    if (this.props.isReady && !this.state.renderedOnce) {
      this.props.dispatch(actions.NotifyPerf("NEWTAB_RENDER"));
      this.setState({renderedOnce: true});
    }
  },
  render() {
    const props = this.props;
    let recommendationLabel = "Show Trending Highlights";
    let recommendationIcon = this.props.Spotlight.recommendationShown ? "check" : "   ";
    let showRecommendationOption = props.showRecommendationOption;
    return (<main className="new-tab">
      <div className="new-tab-wrapper">
        <section>
          <Search/>
        </section>

        <Loader
          className="loading-notice"
          show={!this.props.isReady}
          label="Hang on tight! We are analyzing your history to personalize your experience"
          centered
        />

        <div className={classNames("show-on-init", {on: this.props.isReady})}>
          <section>
            <TopSites page={PAGE_NAME} sites={props.TopSites.rows} />
          </section>

          <section>
            <Spotlight page={PAGE_NAME} sites={props.Spotlight.rows} />
          </section>

          <section>
            <h3 ref="title" className="section-title">Recent Activity</h3>
            <GroupedActivityFeed sites={props.TopActivity.rows} length={MAX_TOP_ACTIVITY_ITEMS} page={PAGE_NAME} />
          </section>

          <section className="bottom-links-container">
            <Link className="bottom-link" to="/timeline"><span className="icon icon-spacer icon-activity-stream" /> See all activity</Link>
            <span className="link-wrapper-right">
              <a
                ref="settingsLink"
                className={classNames("bottom-link expand", {active: this.state.showSettingsMenu})}
                onClick={() => this.setState({showSettingsMenu: !this.state.showSettingsMenu})} >
                  <span className="icon icon-spacer icon-settings" /> <span className="text">Settings</span>
              </a>
              <ContextMenu
                ref="settingsMenu"
                visible={this.state.showSettingsMenu && showRecommendationOption}
                onUpdate={showSettingsMenu => this.setState({showSettingsMenu})}
                options={[
                  {icon: `${recommendationIcon}`, label: `${recommendationLabel}`, onClick: this.toggleRecommendation}
                ]} />
            </span>
          </section>
        </div>
      </div>

      <Link className="debug-link" to="/debug">debug</Link>
    </main>);
  }
});

NewTabPage.propTypes = {
  TopSites: React.PropTypes.object.isRequired,
  Spotlight: React.PropTypes.object.isRequired,
  TopActivity: React.PropTypes.object.isRequired,
  dispatch: React.PropTypes.func.isRequired
};

module.exports = connect(selectNewTabSites)(NewTabPage);
module.exports.NewTabPage = NewTabPage;

const React = require("react");
const {connect} = require("react-redux");
const {selectNewTabSites} = require("selectors/selectors");
const TopSites = require("components/TopSites/TopSites");
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");
const SpotlightFeed = require("components/Spotlight/SpotlightFeed");
const Search = require("components/Search/Search");
const Loader = require("components/Loader/Loader");
const ContextMenu = require("components/ContextMenu/ContextMenu");
const {actions} = require("common/action-manager");
const {Link} = require("react-router");
const setFavicon = require("lib/set-favicon");
const classNames = require("classnames");
const PAGE_NAME = "NEW_TAB";

let renderedOnce = false;

const {MAX_TOP_ACTIVITY_ITEMS} = require("common/constants");

const NewTabPage = React.createClass({
  getInitialState() {
    return {
      showSettingsMenu: false,
      showRecommendations: true
    };
  },
  toggleRecommendation() {
    this.props.dispatch(actions.NotifyEvent({
      event: "TOGGLE_RECOMMENDATION",
      page: PAGE_NAME,
      showRecommendations: !this.state.showRecommendations
    }));
    this.props.dispatch(actions.NotifyToggleRecommendations());
    this.props.dispatch(actions.RequestHighlightsLinks());
    this.setState({showRecommendations: !this.state.showRecommendations});
  },
  componentDidMount() {
    document.title = "New Tab";
    setFavicon("newtab-icon.svg");
  },
  componentDidUpdate() {
    // Note that isReady is set in the newTabPage selector (check the selectors/ folder)
    // and it is possible it never fires, if responses are not received.
    if (!renderedOnce && this.props.isReady) {
      this.props.dispatch(actions.NotifyPerf("NEWTAB_RENDER"));
      renderedOnce = true;
    }
  },
  _renderGroupedFeed() {
    if (this.props.Spotlight.weightedHighlights) {
      return (<section>
        <SpotlightFeed sites={this.props.Spotlight.rows} page={PAGE_NAME} />
      </section>);
    }

    return (<section>
      <h3 ref="title" className="section-title">Recent Activity</h3>
      <GroupedActivityFeed sites={this.props.TopActivity.rows} length={MAX_TOP_ACTIVITY_ITEMS} page={PAGE_NAME}
        maxPreviews={1} />
    </section>);
  },
  render() {
    const props = this.props;
    const recommendationLabel = "Show Trending Highlights";
    const recommendationIcon = props.Spotlight.recommendationShown ? "check" : "   ";
    const showRecommendationOption = props.showRecommendationOption;

    return (<main className="new-tab">
      <div className="new-tab-wrapper">
        <section>
          <Search />
        </section>

        <Loader
          className="loading-notice"
          show={!this.props.isReady}
          label="Hang on tight! We are analyzing your history to personalize your experience"
          centered={true} />

        <div className={classNames("show-on-init", {on: this.props.isReady})}>
          <section>
            <TopSites page={PAGE_NAME} sites={props.TopSites.rows} />
          </section>

          <section>
            <Spotlight page={PAGE_NAME} showRating={props.Spotlight.metadataRating} sites={props.Spotlight.rows} />
          </section>

          {this._renderGroupedFeed()}

          <section className="bottom-links-container">
            <Link className="bottom-link" to="/timeline"><span className="icon icon-spacer icon-activity-stream" /> See all activity</Link>
            <span className="link-wrapper-right">
              <a
                ref="settingsLink"
                hidden={!showRecommendationOption}
                className={classNames("bottom-link expand", {active: this.state.showSettingsMenu})}
                onClick={() => this.setState({showSettingsMenu: !this.state.showSettingsMenu})} >
                  <span className="icon icon-spacer icon-settings" /> <span className="text">Settings</span>
              </a>
              <ContextMenu
                ref="settingsMenu"
                visible={this.state.showSettingsMenu}
                onUpdate={showSettingsMenu => this.setState({showSettingsMenu})}
                options={[
                  {icon: recommendationIcon, label: recommendationLabel, onClick: this.toggleRecommendation}
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

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
  onSearch(value) {
    this.props.dispatch(actions.NotifyPerformSearch(value));
    this.props.dispatch(actions.NotifyEvent({
      event: "SEARCH",
      page: PAGE_NAME
    }));
  },
  getInitialState() {
    return {
      showSettingsMenu: false
    };
  },
  resetBlockList() {
    this.props.dispatch(actions.NotifyEvent({
      event: "UNBLOCK_ALL",
      page: PAGE_NAME
    }));
    this.props.dispatch(actions.NotifyUnblockAll());
  },
  componentDidMount() {
    document.title = "New Tab";
    setFavicon("newtab-icon.svg");
  },
  componentDidUpdate() {
    if (this.props.isReady) {
      this.props.dispatch(actions.NotifyPerf("NEWTAB_RENDER"));
    }
  },
  render() {
    const props = this.props;
    return (<main className="new-tab">
      <div className="new-tab-wrapper">
        <section>
          <Search onSearch={this.onSearch} />
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
            <GroupedActivityFeed title="Recent Activity" sites={props.TopActivity.rows} length={MAX_TOP_ACTIVITY_ITEMS} page={PAGE_NAME} />
          </section>

          <section className="bottom-links-container">
            <Link className="bottom-link" to="/timeline"><span className="icon timeline" /> See all activity</Link>
            <span className="link-wrapper-right">
              <a
                ref="settingsLink"
                className={classNames("bottom-link expand", {active: this.state.showSettingsMenu})}
                onClick={() => this.setState({showSettingsMenu: !this.state.showSettingsMenu})} >
                  <span className="icon settings" /> <span className="text">Settings</span>
              </a>
              <ContextMenu
                ref="settingsMenu"
                visible={this.state.showSettingsMenu}
                onUpdate={showSettingsMenu => this.setState({showSettingsMenu})}
                options={[
                  {label: "Reset Block List", onClick: this.resetBlockList}
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

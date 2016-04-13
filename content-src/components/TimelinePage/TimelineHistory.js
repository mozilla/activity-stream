const React = require("react");
const {connect} = require("react-redux");
const {selectSpotlight} = require("selectors/selectors");
const {RequestMoreRecentLinks, NotifyEvent} = require("common/action-manager").actions;
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");
const LoadMore = require("components/LoadMore/LoadMore");

const PAGE_NAME = "TIMELINE_ALL";

const TimelineHistory = React.createClass({
  getMore() {
    const history = this.props.History.rows;
    if (!history.length) {
      return;
    }
    const beforeDate = history[history.length - 1].lastVisitDate;
    this.props.dispatch(RequestMoreRecentLinks(beforeDate));
    this.props.dispatch(NotifyEvent({
      event: "LOAD_MORE",
      page: "TIMELINE_ALL",
      source: "ACTIVITY_FEED"
    }));
  },
  render() {
    const props = this.props;
    return (<div className="wrapper">
      <Spotlight page={PAGE_NAME} sites={props.Spotlight.rows} />
      <GroupedActivityFeed title="Just now" sites={props.History.rows} page={PAGE_NAME} />
      <LoadMore loading={props.History.isLoading} hidden={!props.History.canLoadMore || !props.History.rows.length} onClick={this.getMore}
        label="See more activity"/>
    </div>);
  }
});

TimelineHistory.propTypes = {
  Spotlight: React.PropTypes.object.isRequired,
  History: React.PropTypes.object.isRequired
};

module.exports = connect(state => {
  return {
    Spotlight: selectSpotlight(state),
    History: state.History
  };
})(TimelineHistory);

module.exports.TimelineHistory = TimelineHistory;

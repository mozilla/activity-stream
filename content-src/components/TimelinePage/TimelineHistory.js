const React = require("react");
const {connect} = require("react-redux");
const {selectSpotlight} = require("selectors/selectors");
const {RequestMoreRecentLinks} = require("common/action-manager").actions;
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");
const LoadMore = require("components/LoadMore/LoadMore");

const TimelineHistory = React.createClass({
  getMore() {
    const history = this.props.History.rows;
    if (!history.length) {
      return;
    }
    const beforeDate = history[history.length - 1].lastVisitDate;
    this.props.dispatch(RequestMoreRecentLinks(beforeDate));
  },
  render() {
    const props = this.props;
    return (<div className="wrapper">
      <Spotlight sites={props.Spotlight.rows} />
      <GroupedActivityFeed data-l10n-id="timeline-history-feed-title" title="Just now" sites={props.History.rows} />
      <LoadMore loading={props.History.isLoading} hidden={!props.History.canLoadMore || !props.History.rows.length} onClick={this.getMore}
        data-l10n-id="timeline-history-load-more" label="See more activity"/>
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

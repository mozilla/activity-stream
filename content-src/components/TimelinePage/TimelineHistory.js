const React = require("react");
const {connect} = require("react-redux");
const {selectHistory} = require("selectors/selectors");
const {RequestMoreRecentLinks} = require("common/action-manager").actions;
const TimelineFeed = require("./TimelineFeed");

const TimelineHistory = React.createClass({
  render() {
    const props = this.props;
    return (<TimelineFeed
      loadMoreAction={RequestMoreRecentLinks}
      dateKey={"lastVisitDate"}
      pageName={"TIMELINE_ALL"}
      Feed={props.History}
      Filter={props.Filter}
      Spotlight={props.Spotlight} />);
  }
});

TimelineHistory.propTypes = {
  Spotlight: React.PropTypes.object.isRequired,
  Filter: React.PropTypes.object.isRequired,
  History: React.PropTypes.object.isRequired
};
module.exports = connect(selectHistory)(TimelineHistory);
module.exports.TimelineHistory = TimelineHistory;

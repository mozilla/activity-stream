const React = require("react");
const {connect} = require("react-redux");
const {dedupedSites} = require("selectors/selectors");

const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");

const TimelineHistory = React.createClass({
  render() {
    const props = this.props;
    return (<div className="wrapper">
      <Spotlight sites={props.Spotlight.rows} />
      <GroupedActivityFeed title="Just now" sites={props.History.rows} length={20} />
    </div>);
  }
});

module.exports = connect(dedupedSites)(TimelineHistory);
module.exports.TimelineHistory = TimelineHistory;

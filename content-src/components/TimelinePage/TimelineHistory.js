const React = require("react");
const {connect} = require("react-redux");
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");

const TimelineHistory = React.createClass({
  render() {
    const {History} = this.props;
    return (<div className="wrapper">
      <Spotlight sites={History.rows} />
      <GroupedActivityFeed title="Just now" sites={History.rows} length={20} />
    </div>);
  }
});

module.exports = connect(({History}) => ({History}))(TimelineHistory);
module.exports.TimelineHistory = TimelineHistory;

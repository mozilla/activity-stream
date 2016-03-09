const React = require("react");
const {connect} = require("react-redux");
const {selectSpotlight} = require("selectors/selectors");

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

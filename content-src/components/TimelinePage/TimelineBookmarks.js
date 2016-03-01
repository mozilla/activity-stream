const React = require("react");
const {connect} = require("react-redux");
const {GroupedActivityFeed} = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");

const TimelineBookmarks = React.createClass({
  render() {
    const props = this.props;
    return (<div className="wrapper">
      <Spotlight sites={props.Bookmarks.rows} />
      <GroupedActivityFeed title="Just now" sites={props.Bookmarks.rows} length={20} />
    </div>);
  }
});

module.exports = connect(({History, Bookmarks}) => ({History, Bookmarks}))(TimelineBookmarks);
module.exports.TimelineBookmarks = TimelineBookmarks;

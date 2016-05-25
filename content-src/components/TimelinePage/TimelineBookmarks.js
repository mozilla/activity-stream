const React = require("react");
const {connect} = require("react-redux");
const {selectBookmarks} = require("selectors/selectors");
const {RequestMoreBookmarks} = require("common/action-manager").actions;
const TimelineFeed = require("./TimelineFeed");

const TimelineBookmarks = React.createClass({
  render() {
    const props = this.props;
    return (<TimelineFeed
      loadMoreAction={RequestMoreBookmarks}
      dateKey={"bookmarkDateCreated"}
      pageName={"TIMELINE_BOOKMARKS"}
      Feed={props.Bookmarks}
    />);
  }
});

TimelineBookmarks.propTypes = {
  Bookmarks: React.PropTypes.object.isRequired
};

module.exports = connect(selectBookmarks)(TimelineBookmarks);

module.exports.TimelineBookmarks = TimelineBookmarks;

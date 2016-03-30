const React = require("react");
const {connect} = require("react-redux");
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const {RequestMoreBookmarks, NotifyEvent} = require("common/action-manager").actions;
const LoadMore = require("components/LoadMore/LoadMore");

const TimelineBookmarks = React.createClass({
  getMore() {
    const bookmarks = this.props.Bookmarks.rows;
    if (!bookmarks.length) {
      return;
    }
    const beforeDate = bookmarks[bookmarks.length - 1].lastModified;
    this.props.dispatch(RequestMoreBookmarks(beforeDate));
    this.props.dispatch(NotifyEvent({
      event: "LOAD_MORE",
      page: "TIMELINE_BOOKMARKS",
      source: "ACTIVITY_FEED"
    }));
  },
  render() {
    const props = this.props;
    return (<div className="wrapper">
      <GroupedActivityFeed title="Just now" sites={props.Bookmarks.rows} length={20} dateKey="bookmarkDateCreated" />
      <LoadMore
        loading={props.Bookmarks.isLoading}
        hidden={!props.Bookmarks.canLoadMore || !props.Bookmarks.rows.length}
        onClick={this.getMore}
        label="See more activity"/>
    </div>);
  }
});

TimelineBookmarks.propTypes = {
  Bookmarks: React.PropTypes.object.isRequired
};

module.exports = connect(state => {
  return {
    Bookmarks: state.Bookmarks
  };
})(TimelineBookmarks);

module.exports.TimelineBookmarks = TimelineBookmarks;

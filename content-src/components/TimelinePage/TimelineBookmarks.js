const React = require("react");
const {connect} = require("react-redux");
const {selectBookmarks} = require("selectors/selectors");
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const {RequestMoreBookmarks, NotifyEvent} = require("common/action-manager").actions;
const LoadMore = require("components/LoadMore/LoadMore");
const classNames = require("classnames");

const PAGE_NAME = "TIMELINE_BOOKMARKS";

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
    return (<div className={classNames("wrapper", "show-on-init", {on: props.Bookmarks.init})}>
      <GroupedActivityFeed
        title="Just now"
        sites={props.Bookmarks.rows}
        length={20}
        dateKey="bookmarkDateCreated"
        page={PAGE_NAME}
        showDateHeadings={true}
         />
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

module.exports = connect(selectBookmarks)(TimelineBookmarks);

module.exports.TimelineBookmarks = TimelineBookmarks;

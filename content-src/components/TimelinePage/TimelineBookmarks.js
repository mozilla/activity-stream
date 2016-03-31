const React = require("react");
const {connect} = require("react-redux");
const {selectSpotlight} = require("selectors/selectors");
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");
const {RequestMoreBookmarks} = require("common/action-manager").actions;
const LoadMore = require("components/LoadMore/LoadMore");

const TimelineBookmarks = React.createClass({
  getMore() {
    const bookmarks = this.props.Bookmarks.rows;
    if (!bookmarks.length) {
      return;
    }
    const beforeDate = bookmarks[bookmarks.length - 1].lastModified;
    this.props.dispatch(RequestMoreBookmarks(beforeDate));
  },
  render() {
    const props = this.props;
    return (<div className="wrapper">
      <Spotlight sites={props.Spotlight.rows} />
      <GroupedActivityFeed data-l10n-id="timeline-bookmarks-feed-title" title="Just now" sites={props.Bookmarks.rows} length={20} dateKey="bookmarkDateCreated" />
      <LoadMore loading={props.Bookmarks.isLoading} hidden={!props.Bookmarks.canLoadMore || !props.Bookmarks.rows.length} onClick={this.getMore}
        data-l10n-id="timeline-bookmarks-load-more" label="See more activity"/>
    </div>);
  }
});

TimelineBookmarks.propTypes = {
  Spotlight: React.PropTypes.object.isRequired,
  Bookmarks: React.PropTypes.object.isRequired
};

module.exports = connect(state => {
  return {
    Spotlight: selectSpotlight(state),
    Bookmarks: state.Bookmarks
  };
})(TimelineBookmarks);

module.exports.TimelineBookmarks = TimelineBookmarks;

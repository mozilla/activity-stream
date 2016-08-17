const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {NotifyEvent} = require("common/action-manager").actions;
const GroupedActivityFeed = require("components/ActivityFeed/ActivityFeed");
const Spotlight = require("components/Spotlight/Spotlight");
const Loader = require("components/Loader/Loader");
const classNames = require("classnames");
const {INFINITE_SCROLL_THRESHOLD, SCROLL_TOP_OFFSET} = require("common/constants");
const debounce = require("lodash.debounce");

const TimelineFeed = React.createClass({
  loadMore() {
    const items = this.props.Feed.rows;
    if (!items.length) {
      return;
    }
    const beforeDate = items[items.length - 1][this.props.dateKey];
    this.props.dispatch(this.props.loadMoreAction(beforeDate));
    this.props.dispatch(NotifyEvent({
      event: "LOAD_MORE_SCROLL",
      page: this.props.pageName,
      source: "ACTIVITY_FEED"
    }));
  },
  windowHeight: null,
  maybeLoadMoreData(values) {
    const {Feed} = this.props;
    const {scrollTop, scrollHeight} = values;

    if (!Feed.canLoadMore || Feed.isLoading) {
      return;
    }

    if (!this.windowHeight) {
      this.windowHeight = window.innerHeight;
    }

    if (scrollHeight - (scrollTop + this.windowHeight - SCROLL_TOP_OFFSET) < INFINITE_SCROLL_THRESHOLD) {
      this.loadMore();
    }
  },
  onResize: debounce(function() {
    this.windowHeight = window.innerHeight;

    // After resizing, check if we can fit in more data.
    this.loadMoreDataIfNeeded();
  }, 100),
  loadMoreDataIfNeeded: debounce(function() {
    this.maybeLoadMoreData({
      scrollHeight: this.refs.scrollElement.scrollHeight,
      scrollTop: this.refs.scrollElement.scrollTop
    });
  }, 100),
  componentDidUpdate(prevProps) {
    // Firefox will emit a scroll event if we don't do this
    // There is a weird behaviour that makes the scroll bar stick in a lower
    // position sometimes if we set scrollTop to 0 instead of 1
    if (!prevProps.Feed.init && this.props.Feed.init) {
      this.refs.scrollElement.scrollTop = 1;
    }

    // After loading data, check if we can fit in even more data.
    this.loadMoreDataIfNeeded();
  },
  componentDidMount() {
    window.addEventListener("resize", this.onResize);

    // Check if we can fit in more data. This is needed for the case of switching
    // routes (for example, from history to bookmarks).
    this.loadMoreDataIfNeeded();
  },
  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize);
  },
  render() {
    const props = this.props;
    return (<section className="content" ref="scrollElement" onScroll={!props.Feed.isLoading && props.Feed.canLoadMore && this.loadMoreDataIfNeeded}>
      <div ref="wrapper" className={classNames("wrapper", "show-on-init", {on: props.Feed.init})}>
        {props.Spotlight ? <Spotlight page={this.props.pageName} sites={props.Spotlight.rows} /> : null}
        <GroupedActivityFeed
          sites={props.Feed.rows}
          page={props.pageName}
          dateKey={props.dateKey}
          showDateHeadings={true} />
        <Loader className="infinite-scroll" ref="loader" show={props.Feed.isLoading} />
      </div>
    </section>);
  }
});

TimelineFeed.propTypes = {
  Spotlight: React.PropTypes.object,
  Feed: React.PropTypes.object.isRequired,
  pageName: React.PropTypes.string.isRequired,
  loadMoreAction: React.PropTypes.func.isRequired,
  dateKey: React.PropTypes.string.isRequired
};

module.exports = connect(justDispatch)(TimelineFeed);
module.exports.TimelineFeed = TimelineFeed;

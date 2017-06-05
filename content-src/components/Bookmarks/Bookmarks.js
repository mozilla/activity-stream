const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");
const {FormattedMessage} = require("react-intl");
const {SpotlightItem} = require("components/Spotlight/Spotlight");
const getBestImage = require("common/getBestImage");

const PlaceholderBookmarks = React.createClass({
  render() {
    return (<div className="bookmarks-placeholder">
      <FormattedMessage id="header_bookmarks_placeholder" />
    </div>);
  }
});

const Bookmarks = React.createClass({
  getDefaultProps() {
    return {
      length: 3,
      page: "NEW_TAB",
      placeholder: false
    };
  },
  getInitialState() {
    return {isAnimating: false};
  },
  onClickFactory(index, site) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "BOOKMARKS",
        action_position: index,
        highlight_type: site.type,
        metadata_source: site.metadata_source
      };
      this.props.dispatch(actions.NotifyEvent(payload));
    };
  },
  // XXX factor out into a stateless component
  renderSiteList() {
    const sites = this.props.sites.filter(site => site.bookmarkGuid)
                                  .slice(0, this.props.length);

    return sites.map((site, i) =>
      <SpotlightItem
        index={i}
        key={site.guid || site.cache_key || i}
        page={this.props.page}
        source="BOOKMARKS"
        bestImage={getBestImage(site.images)}
        onClick={this.onClickFactory(i, site)}
        dispatch={this.props.dispatch}
        {...site}
        prefs={this.props.prefs} />
    );
  },
  handleHeaderClick() {
    this.setState({isAnimating: true});
    this.props.dispatch(actions.NotifyPrefChange("collapseBookmarks", !this.props.prefs.collapseBookmarks));
  },
  handleTransitionEnd() {
    this.setState({isAnimating: false});
  },
  render() {
    const isCollapsed = this.props.prefs.collapseBookmarks;
    const isAnimating = this.state.isAnimating;
    const sites = this.props.sites.filter(site => site.bookmarkGuid);
    // If placeholder is true or we have no items to show.
    const showPlaceholder = this.props.placeholder || (sites.length === 0);

    return (<section className="section-container">
      <h3 className="section-title" ref="section-title" onClick={this.handleHeaderClick}>
        <FormattedMessage id="header_bookmarks" />
        <span className={classNames("icon", {"icon-arrowhead-down": !isCollapsed, "icon-arrowhead-up": isCollapsed})} />
      </h3>
      <ul ref="bookmarks-list" className={classNames("bookmarks-list", {"collapsed": isCollapsed, "animating": isAnimating})} onTransitionEnd={this.handleTransitionEnd}>
        {showPlaceholder ? <PlaceholderBookmarks /> : this.renderSiteList()}
      </ul>
    </section>);
  }
});

Bookmarks.propTypes = {
  page: React.PropTypes.string.isRequired,
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number,
  prefs: React.PropTypes.object
};

module.exports = connect(justDispatch)(Bookmarks);
module.exports.Bookmarks = Bookmarks;
module.exports.PlaceholderBookmarks = PlaceholderBookmarks;

const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {actions} = require("common/action-manager");
const {FormattedMessage} = require("react-intl");
const {SpotlightItem} = require("components/Spotlight/Spotlight");
const CollapsibleSection = require("components/CollapsibleSection/CollapsibleSection");
const getBestImage = require("common/getBestImage");

// Displaying fewer bookmarks than actually requesting.
const BOOKMARKS_TO_DISPLAY = 3;

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
      length: BOOKMARKS_TO_DISPLAY,
      page: "NEW_TAB",
      placeholder: false
    };
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
  render() {
    const sites = this.props.sites.filter(site => site.bookmarkGuid);
    // If placeholder is true or we have no items to show.
    const showPlaceholder = this.props.placeholder || (sites.length === 0);

    return (<CollapsibleSection className="section-container" icon="icon-bookmark" titleId="header_bookmarks"
                                prefName="collapseBookmarks" prefs={this.props.prefs}>
        {showPlaceholder ? <PlaceholderBookmarks /> : this.renderSiteList()}
      </CollapsibleSection>);
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

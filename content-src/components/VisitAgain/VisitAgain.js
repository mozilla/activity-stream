const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {actions} = require("common/action-manager");
const {SpotlightItem} = require("components/Spotlight/Spotlight");
const CollapsibleSection = require("components/CollapsibleSection/CollapsibleSection");
const getBestImage = require("common/getBestImage");
const {VISITAGAIN_DISPLAYED_LENGTH} = require("common/constants");

const VisitAgain = React.createClass({
  getDefaultProps() {
    return {
      length: VISITAGAIN_DISPLAYED_LENGTH,
      page: "NEW_TAB",
      placeholder: false
    };
  },
  onClickFactory(index, site) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "VISITAGAIN",
        action_position: index,
        highlight_type: site.type,
        metadata_source: site.metadata_source
      };
      this.props.dispatch(actions.NotifyEvent(payload));
    };
  },
  // XXX factor out into a stateless component
  renderSiteList() {
    const sites = this.props.sites.slice(0, this.props.length);

    return sites.map((site, i) =>
      <SpotlightItem
        index={i}
        key={site.guid || site.cache_key || i}
        page={this.props.page}
        source="VISITAGAIN"
        bestImage={getBestImage(site.images)}
        onClick={this.onClickFactory(i, site)}
        dispatch={this.props.dispatch}
        {...site}
        prefs={this.props.prefs} />
    );
  },
  render() {
    const shouldRender = !this.props.placeholder && (this.props.sites.length !== 0);

    if (!shouldRender) {
      return null;
    }

    return (<CollapsibleSection className="recent-bookmarks" icon="icon-history" titleId="header_visit_again"
                                prefName="collapseVisitAgain" prefs={this.props.prefs}>
      <ul ref="visitagain-list" className="spotlight-list">
        {this.renderSiteList()}
      </ul>
    </CollapsibleSection>);
  }
});

VisitAgain.propTypes = {
  page: React.PropTypes.string.isRequired,
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number,
  prefs: React.PropTypes.object
};

module.exports = connect(justDispatch)(VisitAgain);
module.exports.VisitAgain = VisitAgain;

const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");

const TopSitesEdit = require("./TopSitesEdit");
const {TopSite, TopSitePlaceholder} = require("./TopSite");
const CollapsibleSection = require("content-src/components/CollapsibleSection/CollapsibleSection");
const ComponentPerfTimer = require("content-src/components/ComponentPerfTimer/ComponentPerfTimer");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {MIN_RICH_FAVICON_SIZE, MIN_CORNER_FAVICON_SIZE} = require("./TopSitesConstants");

/**
 * Iterates through TopSites and counts types of images.
 * @param acc Accumulator for reducer.
 * @param topsite Entry in TopSites.
 */
function countTopSitesIconsTypes(topSites) {
  const countTopSitesTypes = (acc, link) => {
    if (link.tippyTopIcon) {
      acc.tippytop++;
    } else if (link.faviconSize >= MIN_RICH_FAVICON_SIZE) {
      acc.rich_icon++;
    } else if (link.screenshot && link.faviconSize >= MIN_CORNER_FAVICON_SIZE) {
      acc.screenshot_with_icon++;
    } else if (link.screenshot) {
      acc.screenshot++;
    } else {
      acc.no_image++;
    }

    return acc;
  };

  return topSites.reduce(countTopSitesTypes, {
    "screenshot_with_icon": 0,
    "screenshot": 0,
    "tippytop": 0,
    "rich_icon": 0,
    "no_image": 0
  });
}

class TopSites extends React.PureComponent {
  /**
   * Dispatch session statistics about the quality of TopSites icons.
   */
  _storeTopSitesIconStats() {
    const realTopSites = this.props.TopSites.rows.slice(0, this.props.TopSitesCount);

    const topSitesIconsStats = countTopSitesIconsTypes(realTopSites);
    // Dispatch telemetry event with the count of TopSites images types.
    this.props.dispatch(ac.SendToMain({
      type: at.SAVE_SESSION_PERF_DATA,
      data: {topsites_icon_stats: topSitesIconsStats}
    }));
  }

  componentDidUpdate() {
    this._storeTopSitesIconStats();
  }

  componentDidMount() {
    this._storeTopSitesIconStats();
  }

  render() {
    const props = this.props;
    const realTopSites = props.TopSites.rows.slice(0, props.TopSitesCount);

    const placeholderCount = props.TopSitesCount - realTopSites.length;
    const infoOption = {
      header: {id: "settings_pane_topsites_header"},
      body: {id: "settings_pane_topsites_body"}
    };
    return (<ComponentPerfTimer id="topsites" initialized={props.TopSites.initialized} dispatch={props.dispatch}>
      <CollapsibleSection className="top-sites" icon="topsites" title={<FormattedMessage id="header_top_sites" />} infoOption={infoOption} prefName="collapseTopSites" Prefs={props.Prefs} dispatch={props.dispatch}>
        <ul className="top-sites-list">
          {realTopSites.map((link, index) => link && <TopSite
            key={link.guid || link.url}
            dispatch={props.dispatch}
            link={link}
            index={index}
            intl={props.intl} />)}
          {placeholderCount > 0 && [...Array(placeholderCount)].map((_, i) => <TopSitePlaceholder key={i} />)}
        </ul>
        <TopSitesEdit {...props} />
      </CollapsibleSection>
    </ComponentPerfTimer>);
  }
}

module.exports = connect(state => ({TopSites: state.TopSites, Prefs: state.Prefs, TopSitesCount: state.Prefs.values.topSitesCount}))(TopSites);
module.exports._unconnected = TopSites;

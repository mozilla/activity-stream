const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const {PlaceholderSiteIcon, SiteIcon} = require("components/SiteIcon/SiteIcon");
const Hint = require("components/Hint/Hint");
const {selectSiteProperties} = require("common/selectors/siteMetadataSelectors");

const DEFAULT_LENGTH = 6;
const TOP_SITES_HINT_TEXT = "Get right to the sites you visit most: click on a tile to open or hover to share, bookmark or delete.";

const TopSitesItem = React.createClass({
  getInitialState() {
    return {
      showContextMenu: false,
      activeTile: null
    };
  },
  getDefaultProps() {
    return {onClick() {}};
  },
  render() {
    const site = this.props;
    const index = site.index;
    const isActive = this.state.showContextMenu && this.state.activeTile === index;
    const screenshot = site.screenshot;

    // The top-corner class puts the site icon in the top corner, overlayed over the screenshot.
    const siteIconClasses = classNames("tile-img-container", {"top-corner": screenshot});

    const {label} = selectSiteProperties(site);

    return (<div className={classNames("tile-outer", {active: isActive})} key={site.guid || site.cache_key || index}>
      <a onClick={() => this.props.onClick(index)} className="tile" href={site.url} ref="topSiteLink">
        <div className="inner-border" />
        {screenshot && <div ref="screenshot" className="screenshot" style={{backgroundImage: `url(${screenshot})`}} />}
        <SiteIcon
          ref="icon"
          className={siteIconClasses}
          site={site} faviconSize={32}
          showTitle={!screenshot} />

        {screenshot && <div ref="title" className="site-title">{label}</div>}
      </a>
      <LinkMenuButton onClick={() => this.setState({showContextMenu: true, activeTile: index})} />
      <LinkMenu
        visible={isActive}
        onUpdate={val => this.setState({showContextMenu: val})}
        site={site}
        page={this.props.page}
        source="TOP_SITES"
        index={index} />
  </div>);
  }
});

TopSitesItem.propTypes = {
  page: React.PropTypes.string,
  index: React.PropTypes.number,
  url: React.PropTypes.string.isRequired,
  favicon_url: React.PropTypes.string,
  onClick: React.PropTypes.func
};

const PlaceholderTopSitesItem = React.createClass({
  render() {
    return (
      <div className="tile-outer placeholder">
        <a className="tile">
          <PlaceholderSiteIcon />
        </a>
        <div className="inner-border" />
      </div>
    );
  }
});

const TopSites = React.createClass({
  getDefaultProps() {
    return {
      length: DEFAULT_LENGTH,
      // This is for event reporting
      page: "NEW_TAB"
    };
  },
  onClickFactory(index, site) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "TOP_SITES",
        action_position: index,
        metadata_source: site.metadata_source
      };
      this.props.dispatch(actions.NotifyEvent(payload));
    };
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);
    return (<section className="top-sites">
      <h3 className="section-title">Top Sites <Hint id="top_sites_hint" title="Top Sites" body={TOP_SITES_HINT_TEXT} /></h3>
      <div className="tiles-wrapper">
        {sites.map((site, i) => {
          // if this is a placeholder, we want all the widgets to render empty
          if (this.props.placeholder) {
            return (
              <PlaceholderTopSitesItem key={site.guid || site.cache_key || i} />
            );
          }

          return (<TopSitesItem
            index={i}
            key={site.guid || site.cache_key || i}
            page={this.props.page}
            onClick={this.onClickFactory(i, site)}
            {...site} />
          );
        })}
      </div>
    </section>);
  }
});

TopSites.propTypes = {
  length: React.PropTypes.number,
  page: React.PropTypes.string.isRequired,
  showHint: React.PropTypes.bool,
  sites: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      url: React.PropTypes.string.isRequired,
      title: React.PropTypes.string,
      provider_name: React.PropTypes.string,
      parsedUrl: React.PropTypes.object
    })
  ).isRequired,

  /**
   * Only display a placeholder version (ie just outlines/shapes), for use
   * before sufficient data is available to display.
   */
  placeholder: React.PropTypes.bool
};

module.exports = connect(justDispatch)(TopSites);
module.exports.TopSites = TopSites;
module.exports.TopSitesItem = TopSitesItem;
module.exports.PlaceholderTopSitesItem = PlaceholderTopSitesItem;

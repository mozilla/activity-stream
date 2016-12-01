const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const getHighlightContextFromSite = require("common/selectors/getHighlightContextFromSite");
const {selectSiteProperties} = require("common/selectors/siteMetadataSelectors");
const {actions} = require("common/action-manager");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const HighlightContext = require("components/HighlightContext/HighlightContext");
const Hint = require("components/Hint/Hint");
const classNames = require("classnames");

const HIGHLIGHTS_HINT_TEXT = "Find your way back to the great articles, videos, and other pages you’ve discovered on the web.";

const SpotlightItem = React.createClass({
  getInitialState() {
    return {
      showContextMenu: false,
      hover: false
    };
  },
  getDefaultProps() {
    return {
      onClick() {},
      bestImage: {}
    };
  },
  onMouseIn(site) {
    if (site.recommended) {
      this.setState({hover: true});
    }
  },
  onMouseOut(site) {
    if (site.recommended) {
      this.setState({hover: false});
    }
  },
  render() {
    const site = this.props;
    const image = site.bestImage;
    const imageUrl = image.url;
    const description = site.description || site.url;
    const isPortrait = image.height > image.width;

    // We may want to reconsider this as part of
    // https://github.com/mozilla/activity-stream/issues/1473
    const {label} = selectSiteProperties(site);
    const style = {};

    if (imageUrl) {
      style.backgroundImage = `url(${imageUrl})`;
    } else {
      style.backgroundColor = site.backgroundColor;
    }
    return (<li className={classNames("spotlight-item", {active: this.state.showContextMenu})}>
      <a onClick={this.props.onClick} href={site.url} ref="link">
        <div className={classNames("spotlight-image", {portrait: isPortrait})} style={style} ref="image">
          <SiteIcon className="spotlight-icon" height={40} width={40} site={site} ref="icon" showBackground={true} border={false} faviconSize={32} />
        </div>
        <div className="spotlight-details">
          <div className="spotlight-info">
            <div className="spotlight-text">
              <div ref="label" className="spotlight-label">
                {label}
              </div>
              <h4 ref="title" className="spotlight-title">{site.title}</h4>
              <p className="spotlight-description" ref="description">{description}</p>
            </div>
            <HighlightContext {...getHighlightContextFromSite(site)} />
          </div>
        </div>
        <div className="inner-border" />
      </a>
      <LinkMenuButton onClick={() => this.setState({showContextMenu: true})} />
      <LinkMenu
        visible={this.state.showContextMenu}
        onUpdate={val => this.setState({showContextMenu: val})}
        site={site}
        page={this.props.page}
        index={this.props.index}
        source={this.props.source} />
    </li>);
  }
});

SpotlightItem.propTypes = {
  page: React.PropTypes.string,
  source: React.PropTypes.string,
  index: React.PropTypes.number,
  url: React.PropTypes.string.isRequired,
  bestImage: React.PropTypes.object,
  favicon_url: React.PropTypes.string,
  title: React.PropTypes.string.isRequired,
  description: React.PropTypes.string,
  onClick: React.PropTypes.func
};

const Spotlight = React.createClass({
  getDefaultProps() {
    return {
      length: 3,
      page: "NEW_TAB"
    };
  },
  onClickFactory(index, site) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "FEATURED",
        action_position: index,
        highlight_type: site.type,
        metadata_source: site.metadata_source
      };
      if (site.recommended) {
        payload.url = site.url;
        payload.recommender_type = site.recommender_type;
      }
      this.props.dispatch(actions.NotifyEvent(payload));
      if (site.recommended) {
        this.props.dispatch(actions.NotifyBlockRecommendation(site.url));
      }
    };
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);

    return (<section className="spotlight">
      <h3 className="section-title">Highlights <Hint id="highlights_hint" title="Highlights" body={HIGHLIGHTS_HINT_TEXT} /></h3>
      <ul className="spotlight-list">
        {sites.map((site, i) => <SpotlightItem
          index={i}
          key={site.guid || site.cache_key || i}
          page={this.props.page}
          source="FEATURED"
          onClick={this.onClickFactory(i, site)}
          {...site} />)}
      </ul>
    </section>);
  }
});

Spotlight.propTypes = {
  page: React.PropTypes.string.isRequired,
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number
};

module.exports = connect(justDispatch)(Spotlight);
module.exports.Spotlight = Spotlight;
module.exports.SpotlightItem = SpotlightItem;

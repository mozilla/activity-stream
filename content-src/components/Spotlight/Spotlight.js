const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const getHighlightContextFromSite = require("common/selectors/getHighlightContextFromSite");
const {prettyUrl} = require("lib/utils");
const {actions} = require("common/action-manager");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const {HighlightContext, PlaceholderHighlightContext} = require("components/HighlightContext/HighlightContext");
const classNames = require("classnames");
const {FormattedMessage} = require("react-intl");

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
  render() {
    const site = this.props;
    const image = site.bestImage;
    const imageUrl = image.url;
    const description = site.description || site.url;
    const isPortrait = image.height > image.width;

    // We may want to reconsider this as part of
    // https://github.com/mozilla/activity-stream/issues/1473
    const label = prettyUrl(site);
    const style = {};

    if (imageUrl) {
      style.backgroundImage = `url(${imageUrl})`;
    } else if (site.screenshot) {
      style.backgroundImage = `url(${site.screenshot})`;
    } else {
      style.backgroundColor = site.backgroundColor;
      this.props.dispatch(actions.NotifyUndesiredEvent({
        event: "MISSING_IMAGE",
        source: "HIGHLIGHTS"
      }));
      style.display = "none";
    }
    return (<li className={classNames("spotlight-item", {active: this.state.showContextMenu, screenshot: site.screenshot})}>
      <a onClick={this.props.onClick} className="spotlight-inner" href={site.url} ref="link">
        <div className={classNames("spotlight-image", {portrait: isPortrait})} style={style} ref="image" />
        <div className="spotlight-details">
          <div className="spotlight-info">
            <div className={classNames("spotlight-text", {"spotlight-text-max": !imageUrl && !site.screenshot})}>
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
        source={this.props.source}
        prefs={this.props.prefs} />
    </li>);
  }
});

const PlaceholderSpotlightItem = React.createClass({
  render() {
    return (
      <li className="spotlight-item placeholder">
        <a>
          <div className="spotlight-image portrait" ref="image" />
          <div className="inner-border" />
        </a>
        <PlaceholderHighlightContext />
      </li>
    );
  }
});

SpotlightItem.propTypes = {
  page: React.PropTypes.string,
  source: React.PropTypes.string,
  index: React.PropTypes.number,
  url: React.PropTypes.string.isRequired,
  bestImage: React.PropTypes.object,
  title: React.PropTypes.string.isRequired,
  description: React.PropTypes.string,
  onClick: React.PropTypes.func,
  dispatch: React.PropTypes.func.isRequired,
  prefs: React.PropTypes.object
};

function renderPlaceholderList() {
  const PLACEHOLDER_SITE_LIST_LENGTH = 3;

  let placeholders = [];
  for (let i = 0; i < PLACEHOLDER_SITE_LIST_LENGTH; i++) {
    placeholders.push(<PlaceholderSpotlightItem key={i} />);
  }

  return placeholders;
}

const Spotlight = React.createClass({
  getDefaultProps() {
    return {
      length: 3,
      page: "NEW_TAB",
      placeholder: false
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
          source="FEATURED"
          onClick={this.onClickFactory(i, site)}
          dispatch={this.props.dispatch}
          {...site}
          prefs={this.props.prefs} />
      );
  },

  render() {
    return (<section className="spotlight">
      <h3 className="section-title"><FormattedMessage id="header_highlights" /></h3>
      <ul className="spotlight-list">
        {this.props.placeholder ? renderPlaceholderList() : this.renderSiteList()}
      </ul>
    </section>);
  }
});

Spotlight.propTypes = {
  page: React.PropTypes.string.isRequired,
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number,
  prefs: React.PropTypes.object
};

module.exports = connect(justDispatch)(Spotlight);
module.exports.Spotlight = Spotlight;
module.exports.SpotlightItem = SpotlightItem;
module.exports.PlaceholderSpotlightItem = PlaceholderSpotlightItem;
module.exports.renderPlaceholderList = renderPlaceholderList;

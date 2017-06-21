const React = require("react");
const getHighlightContextFromSite = require("common/selectors/getHighlightContextFromSite");
const {prettyUrl} = require("lib/utils");
const {actions} = require("common/action-manager");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const {HighlightContext, PlaceholderHighlightContext} = require("components/HighlightContext/HighlightContext");
const classNames = require("classnames");

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
    const description = site.description || site.url;
    let isPortrait;
    let imageUrl;

    // We may want to reconsider this as part of
    // https://github.com/mozilla/activity-stream/issues/1473
    const label = prettyUrl(site);
    const style = {};

    if (image) {
      imageUrl = image.url;
      isPortrait = image.height > image.width;
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

module.exports.SpotlightItem = SpotlightItem;
module.exports.PlaceholderSpotlightItem = PlaceholderSpotlightItem;
module.exports.renderPlaceholderList = renderPlaceholderList;

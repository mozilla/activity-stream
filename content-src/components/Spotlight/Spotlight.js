const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const moment = require("moment");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const DeleteMenu = require("components/DeleteMenu/DeleteMenu");
const classNames = require("classnames");
const {FIRST_RUN_TYPE} = require("lib/first-run-data");

const DEFAULT_LENGTH = 3;

const SpotlightItem = React.createClass({
  getInitialState() {
    return {
      showContextMenu: false
    };
  },
  getDefaultProps() {
    return {
      onClick: function() {},
      bestImage: {}
    };
  },
  render() {
    const site = this.props;
    const image = site.bestImage;
    const imageUrl = image.url;
    const description = site.description || site.url;
    const isPortrait = image.height > image.width;

    let contextMessage;
    if (site.context_message) {
      contextMessage = site.context_message;
    } else if (site.bookmarkDateCreated) {
      contextMessage = `Bookmarked ${moment(site.bookmarkDateCreated).fromNow()}`;
    } else if (site.lastVisitDate) {
      contextMessage = `Visited ${moment(site.lastVisitDate).fromNow()}`;
    } else if (site.type === "bookmark") {
      contextMessage = "Bookmarked recently";
    } else {
      contextMessage = "Visited recently";
    }

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
              <h4 ref="title" className="spotlight-title">{site.title}</h4>
              <p className="spotlight-description" ref="description">{description}</p>
            </div>
            <div className="spotlight-context" ref="contextMessage">{contextMessage}</div>
          </div>
        </div>
        <div className="inner-border" />
      </a>
      <div
        hidden={site.type === FIRST_RUN_TYPE}
        className="tile-close-icon" ref="delete"
        onClick={() => this.setState({showContextMenu: true})} />
      <DeleteMenu
        visible={this.state.showContextMenu}
        onUpdate={val => this.setState({showContextMenu: val})}
        url={site.url}
        page={this.props.page}
        index={this.props.index}
        source={this.props.source}
        />
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
      length: DEFAULT_LENGTH,
      page: "NEW_TAB"
    };
  },
  onClickFactory(index) {
    return () => {
      this.props.dispatch(actions.NotifyEvent({
        event: "CLICK",
        page: this.props.page,
        source: "FEATURED",
        action_position: index
      }));
    };
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);
    const blankSites = [];
    for (let i = 0; i < (this.props.length - sites.length); i++) {
      blankSites.push(<li className="spotlight-item spotlight-placeholder" key={`blank-${i}`} />);
    }
    return (<section className="spotlight">
      <h3 className="section-title">Highlights</h3>
      <ul className="spotlight-list">
        {sites.map((site, i) => <SpotlightItem
          index={i}
          key={site.guid || site.cacheKey || i}
          page={this.props.page}
          source="FEATURED"
          onClick={this.onClickFactory(i)}
          {...site} />)}
        {blankSites}
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

const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const moment = require("moment");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const classNames = require("classnames");

const DEFAULT_LENGTH = 3;

const SpotlightItem = React.createClass({
  getDefaultProps() {
    return {
      onDelete: function() {}
    };
  },
  render() {
    const site = this.props;
    const image = site.bestImage;
    const imageUrl = image.url;
    const description = site.description;
    const isPortrait = image.height > image.width;

    let contextMessage;
    if (site.bookmarkDateCreated) {
      contextMessage = `Bookmarked ${moment(site.bookmarkDateCreated).fromNow()}`;
    } else if (site.lastVisitDate) {
      contextMessage = `Visited ${moment(site.lastVisitDate).fromNow()}`;
    } else if (site.type === "bookmark") {
      contextMessage = "Bookmarked recently";
    } else {
      contextMessage = "Visited recently";
    }

    return (<li className="spotlight-item">
      <a href={site.url} ref="link">
        <div className={classNames("spotlight-image", {portrait: isPortrait})} style={{backgroundImage: `url(${imageUrl})`}} ref="image">
          <SiteIcon className="spotlight-icon" site={site} ref="icon" showBackground={false} faviconSize={32} />
        </div>
        <div className="spotlight-details">
          <div className="spotlight-info">
            <h4 ref="title" className="spotlight-title">
              {site.title}
            </h4>
            <p className="spotlight-description" ref="description">{description}</p>
            <div className="spotlight-context" ref="contextMessage">{contextMessage}</div>
          </div>
        </div>
        <div className="inner-border" />
      </a>
      <div className="tile-close-icon" ref="delete" onClick={() => this.props.onDelete(site.url)}></div>
    </li>);
  }
});

SpotlightItem.propTypes = {
  url: React.PropTypes.string.isRequired,
  bestImage: React.PropTypes.object.isRequired,
  favicon_url: React.PropTypes.string,
  title: React.PropTypes.string.isRequired,
  description: React.PropTypes.string.isRequired,
  onDelete: React.PropTypes.func
};

const Spotlight = React.createClass({
  getDefaultProps() {
    return {length: DEFAULT_LENGTH};
  },
  onDelete(url) {
    this.props.dispatch(actions.BlockUrl(url));
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);
    const blankSites = [];
    for (let i = 0; i < (this.props.length - sites.length); i++) {
      blankSites.push(<li className="spotlight-item spotlight-placeholder" key={`blank-${i}`} />);
    }
    return (<section className="spotlight">
      <h3 className="section-title">Highlights</h3>
      <ul>
        {sites.map(site => <SpotlightItem key={site.url} onDelete={this.onDelete} {...site} />)}
        {blankSites}
      </ul>
    </section>);
  }
});

Spotlight.propTypes = {
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number
};

module.exports = connect(justDispatch)(Spotlight);
module.exports.Spotlight = Spotlight;
module.exports.SpotlightItem = SpotlightItem;

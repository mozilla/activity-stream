const React = require("react");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const {prettyUrl} = require("lib/utils");

const DEFAULT_LENGTH = 3;
const ICON_SIZE = 40;

const ActivityFeedItem = React.createClass({
  render() {
    const site = this.props;
    const title = site.bookmarkTitle || site.title;
    return (<li className="feed-item">
      <SiteIcon ref="icon" className="feed-icon" site={site} width={ICON_SIZE} height={ICON_SIZE} />
      <div className="feed-details">
        <div className="feed-description">
          <h4 className="feed-title" ref="title">{title}</h4>
          <a className="feed-link" href={site.url} ref="link">{prettyUrl(site.url)}</a>
        </div>
        <div className="feed-stats">
          <div>1:26pm</div>
          <div>...</div>
        </div>
      </div>
    </li>);
  }
});

ActivityFeedItem.propTypes = {
  url: React.PropTypes.string.isRequired,
  images: React.PropTypes.array,
  title: React.PropTypes.string,
  bookmarkTitle: React.PropTypes.string,
  type: React.PropTypes.string
};

const ActivityFeed = React.createClass({
  getDefaultProps() {
    return {length: DEFAULT_LENGTH};
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);
    return (<ul className="activity-feed">
      {sites.map(site => <ActivityFeedItem key={site.url} {...site} />)}
    </ul>);
  }
});

ActivityFeed.propTypes = {
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number
};

module.exports = ActivityFeed;
module.exports.ActivityFeedItem = ActivityFeedItem;

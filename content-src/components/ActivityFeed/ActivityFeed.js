const React = require("react");

const ActivityFeedItem = React.createClass({
  render() {
    const site = this.props;
    return (<li className="feed-item">
      <div className="feed-icon" style={{backgroundImage: `url(${site.image})`}} ref="icon" />
      <div className="feed-details">
        <div className="feed-description">
          <h4 className="feed-title" ref="title">{site.title}</h4>
          <a className="feed-link" href={site.url} ref="link">{site.url}</a>
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
  image: React.PropTypes.string, // TODO: Have fallback for this, change to icon
  title: React.PropTypes.string.isRequired
};

const ActivityFeed = React.createClass({
  render() {
    const {props} = this;
    return (<ul className="activity-feed">
      {props.sites.map(site => <ActivityFeedItem key={site.url} {...site} />)}
    </ul>);
  }
});

ActivityFeed.propTypes = {
  sites: React.PropTypes.array.isRequired
};

module.exports = ActivityFeed;
module.exports.ActivityFeedItem = ActivityFeedItem;

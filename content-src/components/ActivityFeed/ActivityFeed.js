const React = require("react");

class ActivityFeedItem extends React.Component {
  static get propTypes() {
    return {
      image: React.PropTypes.string, // TODO: Have fallback for this, change to icon
      title: React.PropTypes.string.isRequired,
      url: React.PropTypes.string.isRequired
    };
  }

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
}

class ActivityFeed extends React.Component {
  static get propTypes() {
    return {
      sites: React.PropTypes.array.isRequired
    };
  }

  render() {
    const props = this.props;
    return (<ul className="activity-feed">
      {props.sites.map(site => <ActivityFeedItem key={site.url} {...site} />)}
    </ul>);
  }
}

module.exports = ActivityFeed;
module.exports.ActivityFeedItem = ActivityFeedItem;

const React = require("react");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const {prettyUrl} = require("lib/utils");
const moment = require("moment");

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
          <div>{site.lastVisitDate && moment(site.lastVisitDate / 1000).format("h:mma")}</div>
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

function groupSitesByDate(sites) {
  let groupedSites = new Map();
  for (let site of sites) {
    if (!Number.isInteger(site.lastVisitDate)) {
      continue;
    }

    let day = moment(site.lastVisitDate / 1000).startOf("day").format();
    if (!groupedSites.has(day)) {
      groupedSites.set(day, []);
    }
    groupedSites.get(day).push(site);
  }
  return groupedSites;
}

const GroupedActivityFeed = React.createClass({
  getDefaultProps() {
    return {length: DEFAULT_LENGTH};
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);
    const groupedSites = groupSitesByDate(sites);
    return (<div className="grouped-activity-feed">
      {this.props.title &&
        <h3 className="section-title">{this.props.title}</h3>
      }
      {Array.from(groupedSites.keys()).map(date => {
        let dateLabel = moment(date).calendar(null, {
          sameDay: "[Today]",
          lastDay: "[Yesterday]",
          lastWeek: "[Last] dddd",
          sameElse: "DD/MM/YYYY"
        });
        return (<div key={date}>
          {dateLabel !== "Today" &&
            <h3 className="section-title">{dateLabel}</h3>
          }
          <ActivityFeed key={date} sites={groupedSites.get(date)} length={groupedSites.get(date).length} />
        </div>);
      })}
    </div>);
  }
});

GroupedActivityFeed.propTypes = {
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number,
  title: React.PropTypes.string
};

module.exports = ActivityFeed;
module.exports.ActivityFeedItem = ActivityFeedItem;
module.exports.GroupedActivityFeed = GroupedActivityFeed;

const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("actions/action-manager");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const {prettyUrl} = require("lib/utils");
const moment = require("moment");
const classNames = require("classnames");

const DEFAULT_LENGTH = 3;
const ICON_SIZE = 40;

const ActivityFeedItem = React.createClass({
  getDefaultProps() {
    return {
      onDelete: function() {}
    };
  },
  render() {
    const site = this.props;
    const title = site.title;
    const date = site.dateDisplay;

    return (<li className={classNames("feed-item", {bookmark: site.bookmarkGuid})}>
      <SiteIcon ref="icon" className="feed-icon" site={site} width={ICON_SIZE} height={ICON_SIZE} />
      <div className="feed-details">
        <div className="feed-description">
          <h4 className="feed-title" ref="title">{title}</h4>
          <a className="feed-link" href={site.url} ref="link">{prettyUrl(site.url)}</a>
        </div>
        <div className="feed-stats">
          <div ref="lastVisit">{date && moment(date).format("h:mma")}</div>
        </div>
      </div>
      <div className="action-items-container">
        <div className="action-item icon-delete" ref="delete" onClick={() => this.props.onDelete(site.url)}></div>
        <div className="action-item icon-share" onClick={() => alert("Sorry. We are still working on this feature.")}></div>
        <div className="action-item icon-more" onClick={() => alert("Sorry. We are still working on this feature.")}></div>
      </div>
    </li>);
  }
});

ActivityFeedItem.propTypes = {
  url: React.PropTypes.string.isRequired,
  images: React.PropTypes.array,
  title: React.PropTypes.string,
  bookmarkTitle: React.PropTypes.string,
  type: React.PropTypes.string,
  dateDisplay: React.PropTypes.number
};

const ActivityFeed = React.createClass({
  getDefaultProps() {
    return {
      length: DEFAULT_LENGTH,
      onDelete: function() {}
    };
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);
    return (<ul className="activity-feed">
      {sites.map(site => <ActivityFeedItem key={site.url} onDelete={this.props.onDelete} {...site} />)}
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
    const date = site.dateDisplay;
    if (!Number.isInteger(date)) {
      continue;
    }

    let day = moment(date).startOf("day").format();
    if (!groupedSites.has(day)) {
      groupedSites.set(day, []);
    }
    groupedSites.get(day).push(site);
  }
  return groupedSites;
}

const GroupedActivityFeed = React.createClass({
  getDefaultProps() {
    return {
      length: DEFAULT_LENGTH,
      dateKey: "lastVisitDate"
    };
  },
  onDelete(url) {
    this.props.dispatch(actions.NotifyHistoryDelete(url));
  },
  render() {
    const sites = this.props.sites
      .slice(0, this.props.length)
      .map(site => {
        return Object.assign({}, site, {dateDisplay: site[this.props.dateKey]});
      });
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
          <ActivityFeed key={date} onDelete={this.onDelete} sites={groupedSites.get(date)} length={groupedSites.get(date).length} />
        </div>);
      })}
    </div>);
  }
});

GroupedActivityFeed.propTypes = {
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number,
  title: React.PropTypes.string,
  dateKey: React.PropTypes.string
};

module.exports = connect(justDispatch)(GroupedActivityFeed);
module.exports.ActivityFeedItem = ActivityFeedItem;
module.exports.ActivityFeed = ActivityFeed;
module.exports.GroupedActivityFeed = GroupedActivityFeed;

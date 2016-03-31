const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const {prettyUrl, getRandomFromTimestamp, l10n} = require("lib/utils");
const moment = require("moment");
const classNames = require("classnames");

const ICON_SIZE = 16;
const TOP_LEFT_ICON_SIZE = 20;
const SESSION_DIFF = 600000;

const ActivityFeedItem = React.createClass({
  getDefaultProps() {
    return {
      onDelete: function() {},
      showDate: false
    };
  },
  render() {
    const site = this.props;
    const title = site.title || site.provider_display || (site.parsedUrl && site.parsedUrl.hostname);
    const date = site.dateDisplay;

    let icon;
    const iconProps = {
      ref: "icon",
      className: "feed-icon",
      site,
      iconSize: ICON_SIZE
    };
    if (site.showImage && site.images && site.images[0]) {
      icon = (<div className="feed-icon-image" style={{backgroundImage: `url(${site.images[0].url})`}}>
        <SiteIcon {...iconProps} width={TOP_LEFT_ICON_SIZE} height={TOP_LEFT_ICON_SIZE} />
      </div>);
    } else {
      icon = (<SiteIcon {...iconProps} />);
    }

    let dateLabel = "";
    if (date && this.props.showDate) {
      // TODO how to implement this in L20n?
      // See http://momentjs.com/docs/#/displaying/calendar-time/
      dateLabel = moment(date).calendar();
    } else if (date) {
      // TODO use Intl's DateTimeFormat
      dateLabel = moment(date).format("h:mm A");
    }

    return (<li className={classNames("feed-item", {bookmark: site.bookmarkGuid})}>
      <a href={site.url} ref="link">
        {icon}
        <div className="feed-details">
          <div className="feed-description">
            <h4 className="feed-title" ref="title">{title}</h4>
            <span className="feed-url" ref="url">{prettyUrl(site.url)}</span>
          </div>
          <div className="feed-stats">
            <div ref="lastVisit">{dateLabel}</div>
          </div>
        </div>
      </a>
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
  dateDisplay: React.PropTypes.number,
  provider_display: React.PropTypes.string,
  parsedUrl: React.PropTypes.shape({
    hostname: React.PropTypes.string
  })
};

const ActivityFeed = React.createClass({
  getDefaultProps() {
    return {
      onDelete: function() {}
    };
  },
  render() {
    const sites = this.props.sites.slice(0, this.props.length);
    return (<ul className="activity-feed">
      {sites.map((site, i) => <ActivityFeedItem key={i}
        onDelete={this.props.onDelete}
        showImage={getRandomFromTimestamp(0.2, site)}
        showDate={this.props.showDate && i === 0}
        {...site} />)}
    </ul>);
  }
});

ActivityFeed.propTypes = {
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number,
  showDate: React.PropTypes.bool
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
  groupedSites.forEach((value, key) => {
    const sessions = groupSitesBySession(value);
    groupedSites.set(key, sessions);
  });
  return groupedSites;
}

function groupSitesBySession(sites) {
  const sessions = [[]];
  sites.forEach((site, i) => {
    const currentSession = sessions[sessions.length - 1];
    const nextSite = sites[i + 1];
    currentSession.push(site);
    if (nextSite && Math.abs(site.dateDisplay - nextSite.dateDisplay) > SESSION_DIFF) {
      sessions.push([]);
    }
  });
  return sessions;
}

const GroupedActivityFeed = React.createClass({
  getDefaultProps() {
    return {
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
      {sites.length > 0 && this.props.title && this.props["data-l10n-id"] &&
        <h3 className="section-title" {...l10n(this.props)}>{this.props.title}</h3>
      }
      {Array.from(groupedSites.keys()).map(date => {
        return (<div key={date}>
          {groupedSites.get(date).map((sites, i) => {
            return (<ActivityFeed
              key={date + "-session-" + i}
              onDelete={this.onDelete}
              sites={sites}
              length={sites.length}
              showDate={i === 0} />);
          })}
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
module.exports.groupSitesBySession = groupSitesBySession;

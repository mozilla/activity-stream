const React = require("react");
const {connect} = require("react-redux");
const {justDispatch, selectSitePreview} = require("selectors/selectors");
const {actions} = require("common/action-manager");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const MediaPreview = require("components/MediaPreview/MediaPreview");
const {prettyUrl, getRandomFromTimestamp} = require("lib/utils");
const moment = require("moment");
const classNames = require("classnames");

const ICON_SIZE = 16;
const TOP_LEFT_ICON_SIZE = 20;
const SESSION_DIFF = 600000;
const CALENDAR_HEADINGS = {
  sameDay: "[Today]",
  nextDay: "[Tomorrow]",
  nextWeek: "dddd",
  lastDay: "[Yesterday]",
  lastWeek: "[Last] dddd",
  sameElse: "dddd MMMM D, YYYY"
};

const ActivityFeedItem = React.createClass({
  getInitialState() {
    return {
      showContextMenu: false
    };
  },
  getDefaultProps() {
    return {
      onShare() {},
      onClick() {},
      showDate: false
    };
  },
  _renderItemMeta() {
    if (this.props.displayMoreHighlights) {
      return (<div>
        <p ref="description">{this.props.description}</p>
      </div>);
    }

    return null;
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
      dateLabel = moment(date).calendar();
    } else if (date) {
      dateLabel = moment(date).format("h:mm A");
    }

    return (<li className={classNames("feed-item", {bookmark: site.bookmarkGuid, active: this.state.showContextMenu})}>
      <a onClick={this.props.onClick} href={site.url} ref="link">
        <span className="star" hidden={!site.bookmarkGuid} />
        {icon}
        <div className="feed-details">
          <div className="feed-description">
            <h4 className="feed-title" ref="title">{title}</h4>
            {this._renderItemMeta()}
            <span className="feed-url" ref="url" data-feed-url={prettyUrl(site.url)}/>
            {this.props.preview && <MediaPreview previewInfo={this.props.preview} />}
          </div>
          <div className="feed-stats">
            <div ref="lastVisit" className="last-visit" data-last-visit={dateLabel} />
          </div>
        </div>
      </a>
      <LinkMenuButton onClick={() => this.setState({showContextMenu: true})} />
      <LinkMenu
        visible={this.state.showContextMenu}
        onUpdate={val => this.setState({showContextMenu: val})}
        allowBlock={this.props.page === "NEW_TAB"}
        site={site}
        page={this.props.page}
        source={this.props.source}
        index={this.props.index} />
    </li>);
  }
});

ActivityFeedItem.propTypes = {
  preview: React.PropTypes.object,
  page: React.PropTypes.string,
  source: React.PropTypes.string,
  index: React.PropTypes.number,
  onShare: React.PropTypes.func,
  onClick: React.PropTypes.func,
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
      dateKey: "lastVisitDate",
      showDateHeadings: false
    };
  },
  onClickFactory(index) {
    return () => {
      this.props.dispatch(actions.NotifyEvent({
        event: "CLICK",
        page: this.props.page,
        source: "ACTIVITY_FEED",
        action_position: index
      }));
    };
  },
  onShareFactory(index) {
    return url => {
      alert("Sorry. We are still working on this feature.");
      this.props.dispatch(actions.NotifyEvent({
        event: "SHARE",
        page: this.props.page,
        source: "ACTIVITY_FEED",
        action_position: index
      }));
    };
  },
  render() {
    if (this.props.displayMoreHighlights) {
      return (<div className="grouped-activity-feed">
        <div className="group">
          <ul className="activity-feed">
            {this.props.sites.map((site, index) => {
              return (<ActivityFeedItem
                displayMoreHighlights={this.props.displayMoreHighlights}
                key={site.guid || index}
                onClick={this.onClickFactory(index)}
                onShare={this.onShareFactory(index)}
                showImage={true}
                index={index}
                page={this.props.page}
                source="ACTIVITY_FEED"
                showDate={false}
                {...site} />);
            })}
          </ul>
        </div>
      </div>);
    }

    let maxPreviews = this.props.maxPreviews;
    const sites = this.props.sites
      .slice(0, this.props.length)
      .map(site => {
        return Object.assign({}, site, {dateDisplay: site[this.props.dateKey]});
      });
    const groupedSites = groupSitesByDate(sites);
    let globalCount = -1;
    return (<div className="grouped-activity-feed">
      {Array.from(groupedSites.keys()).map((date, dateIndex) => {
        return (<div className="group" key={date}>
          {this.props.showDateHeadings &&
            <h3 className="section-title">{moment(date).startOf("day").calendar(null, CALENDAR_HEADINGS)}</h3>
          }
          {groupedSites.get(date).map((sites, outerIndex) => {
            return (<ul key={date + "-" + outerIndex} className="activity-feed">
              {sites.map((site, i) => {
                globalCount++;
                let preview = null;
                if (typeof maxPreviews === "undefined" || maxPreviews > 0) {
                  if (site.media && site.media.type === "video") {
                    preview = selectSitePreview(site);
                  }
                  if (preview && !preview.previewURL) {
                    preview = null;
                  }
                  if (preview && maxPreviews >= 0) {
                    maxPreviews -= 1;
                  }
                }
                return (<ActivityFeedItem
                    displayMoreHighlights={this.props.displayMoreHighlights}
                    key={site.guid || i}
                    onClick={this.onClickFactory(globalCount)}
                    onShare={this.onShareFactory(globalCount)}
                    showImage={getRandomFromTimestamp(0.2, site)}
                    index={globalCount}
                    page={this.props.page}
                    source="ACTIVITY_FEED"
                    showDate={!this.props.showDateHeadings && outerIndex === 0 && i === 0}
                    preview={preview}
                    {...site} />);
              })}
            </ul>);
          })}
        </div>);
      })}
    </div>);
  }
});

GroupedActivityFeed.propTypes = {
  sites: React.PropTypes.array.isRequired,
  length: React.PropTypes.number,
  dateKey: React.PropTypes.string,
  page: React.PropTypes.string,
  showDateHeadings: React.PropTypes.bool
};

module.exports = connect(justDispatch)(GroupedActivityFeed);
module.exports.ActivityFeedItem = ActivityFeedItem;
module.exports.GroupedActivityFeed = GroupedActivityFeed;
module.exports.groupSitesBySession = groupSitesBySession;

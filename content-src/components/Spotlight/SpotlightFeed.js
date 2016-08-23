const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("selectors/selectors");
const getHighlightContextFromSite = require("selectors/getHighlightContextFromSite");
const {actions} = require("common/action-manager");
const SiteIcon = require("components/SiteIcon/SiteIcon");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const HighlightContext = require("components/HighlightContext/HighlightContext");
const classNames = require("classnames");
const {prettyUrl, getRandomFromTimestamp} = require("lib/utils");
const moment = require("moment");

const ICON_SIZE = 20;
const TOP_LEFT_ICON_SIZE = 32;

class SpotlightFeedItem extends React.Component {
  constructor() {
    super();
    this.state ={showContextMenu: false};
  }

  render() {
    const props = this.props;
    const dateLabel = moment(props.lastVisitDate).fromNow() + " ago";
    let icon;
    const iconProps = {
      ref: "icon",
      className: "feed-icon",
      site: props,
      faviconSize: ICON_SIZE,
    };

    if (props.images && props.images[0]) {
      icon = (<div className="feed-icon-image" style={{backgroundImage: `url(${props.images[0].url})`}}>
        <SiteIcon {...iconProps} width={TOP_LEFT_ICON_SIZE} height={TOP_LEFT_ICON_SIZE} />
      </div>);
    } else {
      icon = (<SiteIcon {...iconProps} />);
    }

    return <li className={classNames("feed-item", {active: this.state.showContextMenu})}>
      <a onClick={props.onClick} href={props.url}>
        {icon}
        <div className="feed-details">
          <div className="feed-description">
            <h4 className="feed-title" ref="title">{props.title || props.url}</h4>
            <div className="feed-summary">
              <span className="feed-url" ref="url" data-feed-url={prettyUrl(props.provider_display)} />
              {props.description && <span className="feed-summary-text" ref="description">{props.description}</span>}
            </div>
          </div>
          <div className="feed-stats">
            <div className={classNames("feed-source", {bookmark: props.bookmarkGuid})}>
              <span className="star" hidden={!props.bookmarkGuid} />
            </div>
            <div ref="lastVisit" className="last-visit" data-last-visit={dateLabel} />
          </div>
        </div>
      </a>
      <LinkMenuButton onClick={() => this.setState({showContextMenu: true})} />
      <LinkMenu
        visible={this.state.showContextMenu}
        onUpdate={val => this.setState({showContextMenu: val})}
        allowBlock={props.page === "NEW_TAB"}
        site={props}
        page={props.page}
        source={props.source}
        index={props.index} />
    </li>;
  }
}

SpotlightFeedItem.propTypes = {
  images: React.PropTypes.array,
  lastVisitDate: React.PropTypes.number,
  index: React.PropTypes.number.isRequired,
  onClick: React.PropTypes.func,
  provider_display: React.PropTypes.string,
  description: React.PropTypes.string,
  title: React.PropTypes.string,
  url: React.PropTypes.string.isRequired,
  page: React.PropTypes.string.isRequired,
  source: React.PropTypes.string.isRequired
}

class SpotlightFeed extends React.Component {
  onClickFactory(index) {
    return () => {
      this.props.dispatch(actions.NotifyEvent({
        event: "CLICK",
        page: this.props.page,
        source: "ACTIVITY_FEED",
        action_position: index
      }));
    };
  }

  _renderItem(site, i, dispatch) {
    return <SpotlightFeedItem key={site.guid || i} page={this.props.page}
                              onClick={this.onClickFactory(i)}
                              index={i}
                              source="ACTIVITY_FEED"
                              {...site} />;
  }

  render() {
    return <div className="grouped-highlight-feed">
      <ul className="activity-feed">
        {this.props.sites.map((site, i) => this._renderItem(site, i))}
      </ul>
    </div>;
  }
}

SpotlightFeed.propTypes = {
  sites: React.PropTypes.array.isRequired,
  dispatch: React.PropTypes.func.isRequired,
  page: React.PropTypes.string.isRequired
};

module.exports = connect(justDispatch)(SpotlightFeed);
module.exports.SpotlightFeed = SpotlightFeed;
module.exports.SpotlightFeedItem = SpotlightFeedItem;


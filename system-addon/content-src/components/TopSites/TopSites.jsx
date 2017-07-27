const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");
const shortURL = require("content-src/lib/short-url");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {perfService: perfSvc} = require("common/PerfService.jsm");
const TOP_SITES_SOURCE = "TOP_SITES";
const TOP_SITES_CONTEXT_MENU_OPTIONS = ["CheckPinTopSite", "Separator", "OpenInNewWindow",
  "OpenInPrivateWindow", "Separator", "BlockUrl", "DeleteUrl"];

class TopSite extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showContextMenu: false, activeTile: null};
    this.onLinkClick = this.onLinkClick.bind(this);
    this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
    this.onMenuUpdate = this.onMenuUpdate.bind(this);
  }
  toggleContextMenu(event, index) {
    this.setState({
      activeTile: index,
      showContextMenu: true
    });
  }
  onLinkClick() {
    this.props.dispatch(ac.UserEvent({
      event: "CLICK",
      source: TOP_SITES_SOURCE,
      action_position: this.props.index
    }));
  }
  onMenuButtonClick(event) {
    event.preventDefault();
    this.toggleContextMenu(event, this.props.index);
  }
  onMenuUpdate(showContextMenu) {
    this.setState({showContextMenu});
  }
  render() {
    const {link, index, dispatch} = this.props;
    const isContextMenuOpen = this.state.showContextMenu && this.state.activeTile === index;
    const title = link.pinTitle || shortURL(link);
    const screenshotClassName = `screenshot${link.screenshot ? " active" : ""}`;
    const topSiteOuterClassName = `top-site-outer${isContextMenuOpen ? " active" : ""}`;
    const style = {backgroundImage: (link.screenshot ? `url(${link.screenshot})` : "none")};
    return (<li className={topSiteOuterClassName} key={link.guid || link.url}>
        <a href={link.url} onClick={this.onLinkClick}>
          <div className="tile" aria-hidden={true}>
              <span className="letter-fallback">{title[0]}</span>
              <div className={screenshotClassName} style={style} />
          </div>
          <div className={`title ${link.isPinned ? "pinned" : ""}`}>
            {link.isPinned && <div className="icon icon-pin-small" />}
            <span dir="auto">{title}</span>
          </div>
        </a>
        <button className="context-menu-button" onClick={this.onMenuButtonClick}>
          <span className="sr-only">{`Open context menu for ${title}`}</span>
        </button>
        <LinkMenu
          dispatch={dispatch}
          index={index}
          onUpdate={this.onMenuUpdate}
          options={TOP_SITES_CONTEXT_MENU_OPTIONS}
          site={link}
          source={TOP_SITES_SOURCE}
          visible={isContextMenuOpen} />
    </li>);
  }
}

/**
 * A proxy class that uses double requestAnimationFrame from
 * componentDidMount to dispatch a SAVE_SESSION_PERF_DATA to the main procsess
 * after the paint.
 *
 * This uses two callbacks because, after one callback, this part of the tree
 * may have rendered but not yet reflowed.  This strategy is modeled after
 * https://stackoverflow.com/a/34999925 but uses a double rFA because
 * we want to get to the closest reliable paint for measuring, and
 * setTimeout is often throttled or queued by browsers in ways that could
 * make it lag too long.
 *
 * XXX Should be made more generic by using this.props.children, or potentially
 * even split out into a higher-order component to wrap whatever.
 *
 * @class TopSitesPerfTimer
 * @extends {React.Component}
 */
class TopSitesPerfTimer extends React.Component {
  constructor(props) {
    super(props);
    // Just for test dependency injection:
    this.perfSvc = this.props.perfSvc || perfSvc;

    this._sendPaintedEvent = this._sendPaintedEvent.bind(this);
    this._timestampSent = false;
  }

  componentDidMount() {
    this._maybeSendPaintedEvent();
  }

  componentDidUpdate() {
    this._maybeSendPaintedEvent();
  }

  /**
   * Call the given callback when the subsequent animation frame
   * (not the upcoming one) paints.
   *
   * @param {Function} callback
   *
   * @returns void
   */
  _onNextFrame(callback) {
    requestAnimationFrame(() => {
      requestAnimationFrame(callback);
    });
  }

  _maybeSendPaintedEvent() {
    // If we've already saved a timestamp for this session, don't do so again.
    if (this._timestampSent) {
      return;
    }

    // We don't want this to ever happen, but sometimes it does.  And when it
    // does (typically on the first newtab at startup time calling
    // componentDidMount), the paint(s) we care about will be later (eg
    // in a subsequent componentDidUpdate).
    if (!this.props.TopSites.initialized) {
      // XXX should send bad event
      return;
    }

    this._onNextFrame(this._sendPaintedEvent);
  }

  _sendPaintedEvent() {
    this.perfSvc.mark("topsites_first_painted_ts");

    try {
      let topsites_first_painted_ts = this.perfSvc
        .getMostRecentAbsMarkStartByName("topsites_first_painted_ts");

      this.props.dispatch(ac.SendToMain({
        type: at.SAVE_SESSION_PERF_DATA,
        data: {topsites_first_painted_ts}
      }));
    } catch (ex) {
      // If this failed, it's likely because the `privacy.resistFingerprinting`
      // pref is true.  We should at least not blow up, and should continue
      // to set this._timestampSent to avoid going through this again.
    }

    this._timestampSent = true;
  }
  render() {
    return (<TopSites {...this.props} />);
  }
}

const TopSites = props => (<section>
  <h3 className="section-title"><span className={`icon icon-small-spacer icon-topsites`} /><FormattedMessage id="header_top_sites" /></h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.map((link, index) => link && <TopSite
      key={link.guid || link.url}
      dispatch={props.dispatch}
      link={link}
      index={index} />)}
  </ul>
</section>);

module.exports = connect(state => ({TopSites: state.TopSites}))(TopSitesPerfTimer);
module.exports._unconnected = TopSitesPerfTimer;
module.exports.TopSite = TopSite;
module.exports.TopSites = TopSites;

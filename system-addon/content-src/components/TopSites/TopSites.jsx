const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");
const shortURL = require("content-src/lib/short-url");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");
const {actionCreators: ac} = require("common/Actions.jsm");
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
            <span>{title}</span>
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

const TopSites = props => (<section>
  <h3 className="section-title"><FormattedMessage id="header_top_sites" /></h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.map((link, index) => link && <TopSite
      key={link.guid || link.url}
      dispatch={props.dispatch}
      link={link}
      index={index} />)}
  </ul>
</section>);

module.exports = connect(state => ({TopSites: state.TopSites}))(TopSites);
module.exports._unconnected = TopSites;
module.exports.TopSite = TopSite;

const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage} = require("react-intl");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");

const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");
const TopSitesPerfTimer = require("./TopSitesPerfTimer");
const TopSitesEdit = require("./TopSitesEdit");

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
    this.onDismissButtonClick = this.onDismissButtonClick.bind(this);
    this.onPinButtonClick = this.onPinButtonClick.bind(this);
    this.onEditButtonClick = this.onEditButtonClick.bind(this);
  }
  toggleContextMenu(event, index) {
    this.setState({
      activeTile: index,
      showContextMenu: true
    });
  }
  userEvent(event) {
    this.props.dispatch(ac.UserEvent({
      event,
      source: TOP_SITES_SOURCE,
      action_position: this.props.index
    }));
  }
  onLinkClick(ev) {
    if (this.props.editMode) {
      // Ignore clicks if we are in the edit modal.
      ev.preventDefault();
      return;
    }
    this.userEvent("CLICK");
  }
  onMenuButtonClick(event) {
    event.preventDefault();
    this.toggleContextMenu(event, this.props.index);
  }
  onMenuUpdate(showContextMenu) {
    this.setState({showContextMenu});
  }
  onDismissButtonClick() {
    const {link} = this.props;
    if (link.isPinned) {
      this.props.dispatch(ac.SendToMain({
        type: at.TOP_SITES_UNPIN,
        data: {site: {url: link.url}}
      }));
    }
    this.props.dispatch(ac.SendToMain({
      type: at.BLOCK_URL,
      data: link.url
    }));
    this.userEvent("BLOCK");
  }
  onPinButtonClick() {
    const {link, index} = this.props;
    if (link.isPinned) {
      this.props.dispatch(ac.SendToMain({
        type: at.TOP_SITES_UNPIN,
        data: {site: {url: link.url}}
      }));
      this.userEvent("UNPIN");
    } else {
      this.props.dispatch(ac.SendToMain({
        type: at.TOP_SITES_PIN,
        data: {site: {url: link.url}, index}
      }));
      this.userEvent("PIN");
    }
  }
  onEditButtonClick() {
    this.props.onEdit(this.props.index);
  }
  render() {
    const {link, index, dispatch, editMode} = this.props;
    const isContextMenuOpen = this.state.showContextMenu && this.state.activeTile === index;
    const title = link.label || link.hostname;
    const topSiteOuterClassName = `top-site-outer${isContextMenuOpen ? " active" : ""}`;
    const {tippyTopIcon} = link;
    let imageClassName;
    let imageStyle;
    if (tippyTopIcon) {
      imageClassName = "tippy-top-icon";
      imageStyle = {
        backgroundColor: link.backgroundColor,
        backgroundImage: `url(${tippyTopIcon})`
      };
    } else {
      imageClassName = `screenshot${link.screenshot ? " active" : ""}`;
      imageStyle = {backgroundImage: link.screenshot ? `url(${link.screenshot})` : "none"};
    }
    return (<li className={topSiteOuterClassName} key={link.guid || link.url}>
        <a href={link.url} onClick={this.onLinkClick}>
          <div className="tile" aria-hidden={true}>
              <span className="letter-fallback">{title[0]}</span>
              <div className={imageClassName} style={imageStyle} />
          </div>
          <div className={`title ${link.isPinned ? "pinned" : ""}`}>
            {link.isPinned && <div className="icon icon-pin-small" />}
            <span dir="auto">{title}</span>
          </div>
        </a>
        {!editMode &&
          <div>
            <button className="context-menu-button icon" onClick={this.onMenuButtonClick}>
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
          </div>
        }
        {editMode &&
          <div className="edit-menu">
            <button
              className={`icon icon-${link.isPinned ? "unpin" : "pin"}`}
              title={this.props.intl.formatMessage({id: `edit_topsites_${link.isPinned ? "unpin" : "pin"}_button`})}
              onClick={this.onPinButtonClick} />
            <button
              className="icon icon-edit"
              title={this.props.intl.formatMessage({id: "edit_topsites_edit_button"})}
              onClick={this.onEditButtonClick} />
            <button
              className="icon icon-dismiss"
              title={this.props.intl.formatMessage({id: "edit_topsites_dismiss_button"})}
              onClick={this.onDismissButtonClick} />
          </div>
        }
    </li>);
  }
}

TopSite.defaultProps = {
  editMode: false,
  onEdit() {}
};

const TopSites = props => (<TopSitesPerfTimer><section className="top-sites">
  <h3 className="section-title"><span className={`icon icon-small-spacer icon-topsites`} /><FormattedMessage id="header_top_sites" /></h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.slice(0, props.TopSitesCount).map((link, index) => link && <TopSite
      key={link.guid || link.url}
      dispatch={props.dispatch}
      link={link}
      index={index}
      intl={props.intl} />)}
  </ul>
  <TopSitesEdit {...props} />
</section></TopSitesPerfTimer>);

module.exports = connect(state => ({TopSites: state.TopSites, TopSitesCount: state.Prefs.values.topSitesCount}))(TopSites);
module.exports._unconnected = TopSites;

module.exports.TopSite = TopSite;
module.exports.TopSites = TopSites;

const React = require("react");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");

const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");

const {TOP_SITES_SOURCE, TOP_SITES_CONTEXT_MENU_OPTIONS} = require("./TopSitesConstants");

const TopSiteLink = props => {
  const {link} = props;
  const topSiteOuterClassName = `top-site-outer${props.className ? ` ${props.className}` : ""}`;
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
   <a href={link.url} onClick={props.onClick}>
     <div className="tile" aria-hidden={true}>
         <span className="letter-fallback">{props.title[0]}</span>
         <div className={imageClassName} style={imageStyle} />
     </div>
     <div className={`title ${link.isPinned ? "pinned" : ""}`}>
       {link.isPinned && <div className="icon icon-pin-small" />}
       <span dir="auto">{props.title}</span>
     </div>
   </a>
   {props.children}
  </li>);
};
TopSiteLink.defaultProps = {
  title: "",
  link: {}
};

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
    this.props.onEdit({
      index: this.props.index,
      link: this.props.link
    });
  }
  render() {
    const {props} = this;
    const {link} = props;
    const isContextMenuOpen = this.state.showContextMenu && this.state.activeTile === props.index;
    const title = link.label || link.hostname;
    return (<TopSiteLink {...props} onClick={this.onLinkClick} className={isContextMenuOpen ? "active" : ""} title={title}>
        {!props.editMode &&
          <div>
            <button className="context-menu-button icon" onClick={this.onMenuButtonClick}>
              <span className="sr-only">{`Open context menu for ${title}`}</span>
            </button>
            <LinkMenu
              dispatch={props.dispatch}
              index={props.index}
              onUpdate={this.onMenuUpdate}
              options={TOP_SITES_CONTEXT_MENU_OPTIONS}
              site={link}
              source={TOP_SITES_SOURCE}
              visible={isContextMenuOpen} />
          </div>
        }
        {props.editMode &&
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
    </TopSiteLink>);
  }
}
TopSite.defaultProps = {
  editMode: false,
  link: {},
  onEdit() {}
};

const TopSitePlaceholder = () => <TopSiteLink className="placeholder" />;

module.exports.TopSite = TopSite;
module.exports.TopSiteLink = TopSiteLink;
module.exports.TopSitePlaceholder = TopSitePlaceholder;

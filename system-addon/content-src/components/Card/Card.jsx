const React = require("react");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");
const {FormattedMessage} = require("react-intl");
const cardContextTypes = require("./types");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");

/**
 * Card component.
 * Cards are found within a Section component and contain information about a link such
 * as preview image, page title, page description, and some context about if the page
 * was visited, bookmarked, trending etc...
 * Each Section can make an unordered list of Cards which will create one instane of
 * this class. Each card will then get a context menu which reflects the actions that
 * can be done on this Card.
 */
class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = {showContextMenu: false, activeCard: null};
    this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
    this.onMenuUpdate = this.onMenuUpdate.bind(this);
    this.onLinkClick = this.onLinkClick.bind(this);
  }
  onMenuButtonClick(event) {
    event.preventDefault();
    this.setState({
      activeCard: this.props.index,
      showContextMenu: true
    });
  }
  onLinkClick(event) {
    event.preventDefault();
    const {altKey, button, ctrlKey, metaKey, shiftKey} = event;
    this.props.dispatch(ac.SendToMain({
      type: at.OPEN_LINK,
      data: Object.assign(this.props.link, {event: {altKey, button, ctrlKey, metaKey, shiftKey}})
    }));
    this.props.dispatch(ac.UserEvent({
      event: "CLICK",
      source: this.props.eventSource,
      action_position: this.props.index
    }));
    this.props.dispatch(ac.ImpressionStats({
      source: this.props.eventSource,
      click: 0,
      incognito: true,
      tiles: [{id: this.props.link.guid, pos: this.props.index}]
    }));
  }
  onMenuUpdate(showContextMenu) {
    this.setState({showContextMenu});
  }
  render() {
    const {index, link, dispatch, contextMenuOptions, eventSource} = this.props;
    const isContextMenuOpen = this.state.showContextMenu && this.state.activeCard === index;
    const {icon, intlID} = link.type ? cardContextTypes[link.type] : {};

    return (<li className={`card-outer${isContextMenuOpen ? " active" : ""}`}>
      <a href={link.url} onClick={this.onLinkClick}>
        <div className="card">
          {link.image && <div className="card-preview-image" style={{backgroundImage: `url(${link.image})`}} />}
          <div className={`card-details${link.image ? "" : " no-image"}`}>
            {link.hostname && <div className="card-host-name">{link.hostname}</div>}
            <div className={`card-text${link.image ? "" : " no-image"}${link.hostname ? "" : " no-host-name"}${icon ? "" : " no-context"}`}>
              <h4 className="card-title" dir="auto">{link.title}</h4>
              <p className="card-description" dir="auto">{link.description}</p>
            </div>
            {icon && <div className="card-context">
              <span className={`card-context-icon icon icon-${icon}`} />
              <div className="card-context-label"><FormattedMessage id={intlID} defaultMessage="Visited" /></div>
            </div>}
          </div>
        </div>
      </a>
      <button className="context-menu-button icon"
        onClick={this.onMenuButtonClick}>
        <span className="sr-only">{`Open context menu for ${link.title}`}</span>
      </button>
      <LinkMenu
        dispatch={dispatch}
        index={index}
        source={eventSource}
        onUpdate={this.onMenuUpdate}
        options={link.contextMenuOptions || contextMenuOptions}
        site={link}
        visible={isContextMenuOpen} />
   </li>);
  }
}
module.exports = Card;

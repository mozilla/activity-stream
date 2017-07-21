const React = require("react");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");
const shortURL = require("content-src/lib/short-url");
const {FormattedMessage} = require("react-intl");
const cardContextTypes = require("./types");

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
  }
  onMenuButtonClick(event) {
    event.preventDefault();
    this.setState({
      activeCard: this.props.index,
      showContextMenu: true
    });
  }
  onMenuUpdate(showContextMenu) {
    this.setState({showContextMenu});
  }
  render() {
    const {index, link, dispatch, contextMenuOptions} = this.props;
    const isContextMenuOpen = this.state.showContextMenu && this.state.activeCard === index;
    const hostname = shortURL(link);
    const {icon, intlID} = cardContextTypes[link.type];

    return (<li className={`card-outer${isContextMenuOpen ? " active" : ""}`}>
      <a href={link.url}>
        <div className="card">
          {link.image && <div className="card-preview-image" style={{backgroundImage: `url(${link.image})`}} />}
          <div className="card-details">
            <div className="card-host-name"> {hostname} </div>
            <div className={`card-text${link.image ? "" : " full-height"}`}>
              <h4 className="card-title"> {link.title} </h4>
              <p className="card-description"> {link.description} </p>
            </div>
            <div className="card-context">
              <span className={`card-context-icon icon icon-${icon}`} />
              <div className="card-context-label"><FormattedMessage id={intlID} defaultMessage="Visited" /></div>
            </div>
          </div>
        </div>
      </a>
      <button className="context-menu-button"
        onClick={this.onMenuButtonClick}>
        <span className="sr-only">{`Open context menu for ${link.title}`}</span>
      </button>
      <LinkMenu
        dispatch={dispatch}
        index={index}
        onUpdate={this.onMenuUpdate}
        options={link.context_menu_options || contextMenuOptions}
        site={link}
        visible={isContextMenuOpen} />
   </li>);
  }
}
module.exports = Card;

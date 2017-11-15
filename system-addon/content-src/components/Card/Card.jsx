const React = require("react");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");
const {FormattedMessage} = require("react-intl");
const cardContextTypes = require("./types");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");

// Keep track of pending image loads to only request once
const gImageLoading = new Map();

/**
 * Card component.
 * Cards are found within a Section component and contain information about a link such
 * as preview image, page title, page description, and some context about if the page
 * was visited, bookmarked, trending etc...
 * Each Section can make an unordered list of Cards which will create one instane of
 * this class. Each card will then get a context menu which reflects the actions that
 * can be done on this Card.
 */
class Card extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      activeCard: null,
      imageLoaded: false,
      showContextMenu: false
    };
    this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
    this.onMenuUpdate = this.onMenuUpdate.bind(this);
    this.onLinkClick = this.onLinkClick.bind(this);
  }

  /**
   * Helper to conditionally load an image and update state when it loads.
   */
  async maybeLoadImage() {
    // No need to load if it's already loaded or no image
    const {image} = this.props.link;
    if (!this.state.imageLoaded && image) {
      // Initialize a promise to share a load across multiple card updates
      if (!gImageLoading.has(image)) {
        const loaderPromise = new Promise((resolve, reject) => {
          const loader = new Image();
          loader.addEventListener("load", resolve);
          loader.addEventListener("error", reject);
          loader.src = image;
        });

        // Save and remove the promise only while it's pending
        gImageLoading.set(image, loaderPromise);
        loaderPromise.catch(ex => ex).then(() => gImageLoading.delete(image)).catch();
      }

      // Wait for the image whether just started loading or reused promise
      await gImageLoading.get(image);

      // Only update state if we're still waiting to load the original image
      if (this.props.link.image === image && !this.state.imageLoaded) {
        this.setState({imageLoaded: true});
      }
    }
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
    if (this.props.shouldSendImpressionStats) {
      this.props.dispatch(ac.ImpressionStats({
        source: this.props.eventSource,
        click: 0,
        tiles: [{id: this.props.link.guid, pos: this.props.index}]
      }));
    }
  }
  onMenuUpdate(showContextMenu) {
    this.setState({showContextMenu});
  }
  componentDidMount() {
    this.maybeLoadImage();
  }
  componentDidUpdate() {
    this.maybeLoadImage();
  }
  componentWillReceiveProps(nextProps) {
    // Clear the image state if changing images
    if (nextProps.link.image !== this.props.link.image) {
      this.setState({imageLoaded: false});
    }
  }
  render() {
    const {index, link, dispatch, contextMenuOptions, eventSource, shouldSendImpressionStats} = this.props;
    const {props} = this;
    const isContextMenuOpen = this.state.showContextMenu && this.state.activeCard === index;
    // Display "now" as "trending" until we have new strings #3402
    const {icon, intlID} = cardContextTypes[link.type === "now" ? "trending" : link.type] || {};
    const hasImage = link.image || link.hasImage;
    const imageStyle = {backgroundImage: link.image ? `url(${link.image})` : "none"};

    return (<li className={`card-outer${isContextMenuOpen ? " active" : ""}${props.placeholder ? " placeholder" : ""}`}>
      <a href={link.url} onClick={!props.placeholder && this.onLinkClick}>
        <div className="card">
          {hasImage && <div className="card-preview-image-outer">
            <div className={`card-preview-image${this.state.imageLoaded ? " loaded" : ""}`} style={imageStyle} />
          </div>}
          <div className={`card-details${hasImage ? "" : " no-image"}`}>
            {link.hostname && <div className="card-host-name">{link.hostname}</div>}
            <div className={["card-text",
              icon ? "" : "no-context",
              link.description ? "" : "no-description",
              link.hostname ? "" : "no-host-name",
              hasImage ? "" : "no-image"
            ].join(" ")}>
              <h4 className="card-title" dir="auto">{link.title}</h4>
              <p className="card-description" dir="auto">{link.description}</p>
            </div>
            <div className="card-context">
              {icon && !link.context && <span className={`card-context-icon icon icon-${icon}`} />}
              {link.icon && link.context && <span className="card-context-icon icon" style={{backgroundImage: `url('${link.icon}')`}} />}
              {intlID && !link.context && <div className="card-context-label"><FormattedMessage id={intlID} defaultMessage="Visited" /></div>}
              {link.context && <div className="card-context-label">{link.context}</div>}
            </div>
          </div>
        </div>
      </a>
      {!props.placeholder && <button className="context-menu-button icon"
        onClick={this.onMenuButtonClick}>
        <span className="sr-only">{`Open context menu for ${link.title}`}</span>
      </button>}
      {!props.placeholder && <LinkMenu
        dispatch={dispatch}
        index={index}
        source={eventSource}
        onUpdate={this.onMenuUpdate}
        options={link.contextMenuOptions || contextMenuOptions}
        site={link}
        visible={isContextMenuOpen}
        shouldSendImpressionStats={shouldSendImpressionStats} />}
   </li>);
  }
}
Card.defaultProps = {link: {}};

const PlaceholderCard = () => <Card placeholder={true} />;

module.exports = Card;
module.exports.PlaceholderCard = PlaceholderCard;

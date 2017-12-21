import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {
  MIN_CORNER_FAVICON_SIZE,
  MIN_RICH_FAVICON_SIZE,
  TOP_SITES_CONTEXT_MENU_OPTIONS,
  TOP_SITES_SOURCE
} from "./TopSitesConstants";
import {injectIntl} from "react-intl";
import {LinkMenu} from "content-src/components/LinkMenu/LinkMenu";
import React from "react";

export class TopSiteLink extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onDragEvent = this.onDragEvent.bind(this);
  }

  /*
   * Helper to determine whether the drop zone should allow a drop. We only allow
   * dropping top sites for now.
   */
  _allowDrop(e, index) {
    let draggedIndex = parseInt(e.dataTransfer.getData("text/topsite-index"), 10);
    if (!isNaN(draggedIndex) && draggedIndex !== index) {
      return true;
    }
    return false;
  }
  onDragEvent(event) {
    switch (event.type) {
      case "dragstart":
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/topsite-index", this.props.index);
        event.target.blur();
        this.props.onDragEvent(event, this.props.index, this.props.link, this.props.title);
        break;
      case "dragend":
        this.props.onDragEvent(event);
        break;
      case "dragover":
      case "dragenter":
      case "dragleave":
      case "drop":
        if (this._allowDrop(event, this.props.index)) {
          event.preventDefault();
          this.props.onDragEvent(event, this.props.index);
        }
        break;
    }
  }
  render() {
    const {children, className, isDraggable, link, onClick, title} = this.props;
    const topSiteOuterClassName = `top-site-outer${className ? ` ${className}` : ""}`;
    const {tippyTopIcon, faviconSize} = link;
    const letterFallback = title[0];
    let imageClassName;
    let imageStyle;
    let showSmallFavicon = false;
    let smallFaviconStyle;
    let smallFaviconFallback;
    if (tippyTopIcon || faviconSize >= MIN_RICH_FAVICON_SIZE) {
      // styles and class names for top sites with rich icons
      imageClassName = "top-site-icon rich-icon";
      imageStyle = {
        backgroundColor: link.backgroundColor,
        backgroundImage: `url(${tippyTopIcon || link.favicon})`
      };
    } else {
      // styles and class names for top sites with screenshot + small icon in top left corner
      imageClassName = `screenshot${link.screenshot ? " active" : ""}`;
      imageStyle = {backgroundImage: link.screenshot ? `url(${link.screenshot})` : "none"};

      // only show a favicon in top left if it's greater than 16x16
      if (faviconSize >= MIN_CORNER_FAVICON_SIZE) {
        showSmallFavicon = true;
        smallFaviconStyle = {backgroundImage:  `url(${link.favicon})`};
      } else if (link.screenshot) {
        // Don't show a small favicon if there is no screenshot, because that
        // would result in two fallback icons
        showSmallFavicon = true;
        smallFaviconFallback = true;
      }
    }
    let draggableProps = {};
    if (isDraggable) {
      draggableProps = {
        draggable: true,
        onDragStart: this.onDragEvent,
        onDragEnd: this.onDragEvent
      };
    }
    return (<li className={topSiteOuterClassName} key={link.guid || link.url} onDrop={this.onDragEvent} onDragOver={this.onDragEvent} onDragEnter={this.onDragEvent} onDragLeave={this.onDragEvent} {...draggableProps}>
      <div className="top-site-inner">
         <a href={link.url} onClick={onClick}>
            <div className="tile" aria-hidden={true} data-fallback={letterFallback}>
              <div className={imageClassName} style={imageStyle} />
              {showSmallFavicon && <div
                className="top-site-icon default-icon"
                data-fallback={smallFaviconFallback && letterFallback}
                style={smallFaviconStyle} />}
           </div>
           <div className={`title ${link.isPinned ? "pinned" : ""}`}>
             {link.isPinned && <div className="icon icon-pin-small" />}
              <span dir="auto">{title}</span>
           </div>
         </a>
         {children}
      </div>
    </li>);
  }
}
TopSiteLink.defaultProps = {
  title: "",
  link: {},
  isDraggable: true
};

export class TopSite extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {showContextMenu: false, activeTile: null};
    this.onLinkClick = this.onLinkClick.bind(this);
    this.onMenuButtonClick = this.onMenuButtonClick.bind(this);
    this.onMenuUpdate = this.onMenuUpdate.bind(this);
    this.onDismissButtonClick = this.onDismissButtonClick.bind(this);
    this.onPinButtonClick = this.onPinButtonClick.bind(this);
    this.onEditButtonClick = this.onEditButtonClick.bind(this);
    this.onDragEvent = this.onDragEvent.bind(this);
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
    if (this.props.onEdit) {
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
  onDragEvent(event, index, link, title) {
    if (event.type === "dragstart") {
      this.setState({
        activeTile: null,
        showContextMenu: false
      });
    }
    this.props.onDragEvent(event, index, link, title);
  }
  render() {
    const {props} = this;
    const {link} = props;
    const isContextMenuOpen = this.state.showContextMenu && this.state.activeTile === props.index;
    const title = link.label || link.hostname;
    return (<TopSiteLink {...props} onClick={this.onLinkClick} onDragEvent={this.onDragEvent} className={isContextMenuOpen ? "active" : ""} title={title}>
        {!props.onEdit &&
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
        {props.onEdit &&
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
  link: {},
  onDragStart() {}
};

export class TopSitePlaceholder extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onEditButtonClick = this.onEditButtonClick.bind(this);
  }
  onEditButtonClick() {
    this.props.dispatch({
      type: at.TOP_SITES_EDIT,
      data: {index: this.props.index}
    });
  }
  render() {
    return (<TopSiteLink className="placeholder" isDraggable={false} {...this.props}>
      <div className="edit-menu">
        <button
          className="icon icon-edit"
          title={this.props.intl.formatMessage({id: "edit_topsites_edit_button"})}
          onClick={this.onEditButtonClick} />
      </div>
    </TopSiteLink>);
  }
}

export class _TopSiteList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = this.DEFAULT_STATE = {
      draggedIndex: null,
      draggedSite: null,
      draggedTitle: null,
      topSitesPreview: null
    };
    this.onDragEvent = this.onDragEvent.bind(this);
  }
  componentWillUpdate(nextProps) {
    if (this.state.draggedSite) {
      const prevTopSites = this.props.TopSites && this.props.TopSites.rows;
      const newTopSites = nextProps.TopSites && nextProps.TopSites.rows;
      if (prevTopSites && prevTopSites[this.state.draggedIndex] &&
        prevTopSites[this.state.draggedIndex].url === this.state.draggedSite.url &&
        (!newTopSites[this.state.draggedIndex] || newTopSites[this.state.draggedIndex].url !== this.state.draggedSite.url)) {
        // We got the new order from the redux store via props. We can clear state now.
        this.setState(this.DEFAULT_STATE);
      }
    }
  }
  userEvent(event, index) {
    this.props.dispatch(ac.UserEvent({
      event,
      source: TOP_SITES_SOURCE,
      action_position: index
    }));
  }
  onDragEvent(event, index, link, title) {
    switch (event.type) {
      case "dragstart":
        this.setState({
          draggedIndex: index,
          draggedSite: link,
          draggedTitle: title
        });
        this.userEvent("DRAG", index);
        break;
      case "dragend":
        this.setState(this.DEFAULT_STATE);
        break;
      case "dragenter":
        this.setState({topSitesPreview: this._makeTopSitesPreview(index)});
        break;
      case "dragleave":
        this.setState({topSitesPreview: null});
        break;
      case "drop":
        this.props.dispatch(ac.SendToMain({
          type: at.TOP_SITES_INSERT,
          data: {site: {url: this.state.draggedSite.url, label: this.state.draggedTitle}, index}
        }));
        this.userEvent("DROP", index);
        break;
      default:
        break;
    }
  }
  _getTopSites() {
    return this.props.TopSites.rows.slice(0, this.props.TopSitesCount);
  }

  /**
   * Make a preview of the topsites that will be the result of dropping the currently
   * dragged site at the specified index.
   */
  _makeTopSitesPreview(index) {
    const preview = this._getTopSites();
    this._fillOrLeaveHole(preview, this.state.draggedIndex);
    this._insertSite(preview, Object.assign({}, this.state.draggedSite, {isPinned: true}), index);
    return preview;
  }

  /**
   * Fill in the slot at the specified index with a non pinned site further down the
   * list, if any. Otherwise leave an empty slot.
   */
  _fillOrLeaveHole(sites, index) {
    let slotIndex = index;
    sites[slotIndex] = null;
    for (let i = slotIndex + 1; i < sites.length; i++) {
      const site = sites[i];
      if (site && !site.isPinned) {
        sites[i] = null;
        sites[slotIndex] = site;
        // Update the index to fill to be the spot we just grabbed a site from
        slotIndex = i;
      }
    }
  }

  /**
   * Insert the given site in the slot at the specified index. If the slot is occupied,
   * move it appropriately.
   */
  _insertSite(sites, site, index) {
    const replacedSite = sites[index];
    if (replacedSite && index < this.props.TopSitesCount - 1) {
      if (replacedSite.isPinned) {
        // If the replaced site is pinned, it goes into the next slot no matter what.
        this._insertSite(sites, replacedSite, index + 1);
      } else {
        // If the replaced site isn't pinned, it goes into the next slot that doesn't havea pinned site;
        for (let i = index + 1, l = sites.length; i < l; i++) {
          if (!sites[i] || !sites[i].isPinned) {
            this._insertSite(sites, replacedSite, i);
            break;
          }
        }
      }
    }
    sites[index] = site;
  }
  render() {
    const {props} = this;
    const topSites = this.state.topSitesPreview || this._getTopSites();
    const topSitesUI = [];
    for (let i = 0, l = props.TopSitesCount; i < l; i++) {
      const link = topSites[i];
      topSitesUI.push(!link ? (
        <TopSitePlaceholder
          key={i}
          index={i}
          onDragEvent={this.onDragEvent}
          dispatch={props.dispatch}
          intl={props.intl} />
      ) : (
        <TopSite
          key={i}
          dispatch={props.dispatch}
          link={link}
          index={i}
          intl={props.intl}
          onEdit={props.onEdit}
          onDragEvent={this.onDragEvent} />
      ));
    }
    return (<ul className="top-sites-list">
      {topSitesUI}
    </ul>);
  }
}

export const TopSiteList = injectIntl(_TopSiteList);

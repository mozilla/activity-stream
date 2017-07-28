const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");
const CollapsibleSection = require("components/CollapsibleSection/CollapsibleSection");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const {PlaceholderSiteIcon, SiteIcon} = require("components/SiteIcon/SiteIcon");
const {prettyUrl} = require("lib/utils");
const {injectIntl, FormattedMessage} = require("react-intl");
const {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH} = require("common/constants");
const {FIRST_RUN_TYPE} = require("lib/first-run-data");

const FULL_WIDTH = 96;
const TIPPY_TOP_WIDTH = 80;

// Helper to determine whether the drop zone should allow a drop. We only allow
// dropping top sites for now.
function _allowDrop(e, index) {
  let draggedIndex = parseInt(e.dataTransfer.getData("text/topsite-index"), 10);
  if (!isNaN(draggedIndex) && draggedIndex !== index) {
    return true;
  }
  return false;
}

const TopSitesItem = React.createClass({
  getInitialState() {
    return {
      showContextMenu: false,
      activeTile: null,
      dragOver: false
    };
  },
  getDefaultProps() {
    return {
      onClick() {},
      onEdit() {},
      editMode: false
    };
  },
  _isTippyTop(favicon_url) {
    // If it starts with favicons/images or resource:// then it's a tippy top icon.
    // FIXME: long term we want the metadata parser to pass along where the image came from.
    return favicon_url && (favicon_url.startsWith("favicons/images") || favicon_url.startsWith("resource://"));
  },
  _faviconSize(site, screenshot) {
    let faviconSize = 32;
    if (!screenshot) {
      if (this._isTippyTop(site.favicon_url)) {
        faviconSize = TIPPY_TOP_WIDTH;
      } else {
        // If we have a normal (non tippy top) favicon, we're going to stretch
        // or shrink it to be wall to wall.
        faviconSize = FULL_WIDTH;
      }
    }
    return faviconSize;
  },
  userEvent(event) {
    const {page, source, index, dispatch, metadata_source} = this.props;
    let payload = {
      event,
      page,
      source,
      action_position: index,
      metadata_source
    };
    dispatch(actions.NotifyEvent(payload));
  },
  handleDismiss() {
    const site = this.props;
    if (site.isPinned) {
      this.props.dispatch(actions.NotifyUnpinTopsite({url: site.url}));
    }
    this.props.dispatch(actions.NotifyBlockURL(site.url));
    this.userEvent("BLOCK");
  },
  handleEdit() {
    this.props.onEdit(this.props.index);
  },
  handlePin() {
    const site = this.props;
    if (site.isPinned) {
      this.props.dispatch(actions.NotifyUnpinTopsite({url: site.url}));
      this.userEvent("UNPIN");
    } else {
      this.props.dispatch(actions.NotifyPinTopsite({url: site.url}, site.index));
      this.userEvent("PIN");
    }
  },
  handleDragStart(e) {
    this.isDragging = true;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/topsite-index", this.props.index);
    e.dataTransfer.setData("text/topsite-url", this.props.url);
    e.dataTransfer.setData("text/topsite-title", this.props.pinTitle || prettyUrl(this.props));
    if (this.state.showContextMenu) {
      this.setState({showContextMenu: false});
    }
    this.userEvent("DRAG_TOPSITE");
  },
  handleDragEnd(e) {
    setTimeout(() => {
      // This is to prevent browser from following to the link url when a topsite
      // is dragged onto itself.
      this.isDragging = false;
    }, 1000);
  },
  handleDragOver(e) {
    if (_allowDrop(e, this.props.index)) {
      // prevent default to allow drop
      e.preventDefault();
    }
  },
  handleDragEnter(e) {
    if (_allowDrop(e, this.props.index)) {
      e.preventDefault();
      this.setState({dragOver: true});
    }
  },
  handleDragLeave(e) {
    if (_allowDrop(e, this.props.index)) {
      this.setState({dragOver: false});
    }
  },
  handleDrop(e) {
    if (_allowDrop(e, this.props.index)) {
      e.preventDefault();
      this.setState({dragOver: false});
      this.props.dispatch(actions.RequestDropTopsite(
        e.dataTransfer.getData("text/topsite-url"),
        e.dataTransfer.getData("text/topsite-title"),
        this.props.index));
      this.userEvent("DROP_TOPSITE");
    }
  },
  handleClick(e) {
    if (this.isDragging) {
      // Cancel the link click event if it was being dragged.
      e.preventDefault();
    }
    this.props.onClick(this.props.index, e);
  },
  render() {
    const site = this.props;
    const index = site.index;
    const isActive = this.state.showContextMenu && this.state.activeTile === index;

    const screenshot = site.screenshot;
    const faviconSize = this._faviconSize(site, screenshot);
    const showBackground = faviconSize < FULL_WIDTH;

    // The top-corner class puts the site icon in the top corner, overlayed over the screenshot.
    const siteIconClasses = classNames("tile-img-container", {
      "top-corner": screenshot,
      "full-width": !screenshot && faviconSize === FULL_WIDTH
    });

    const label = site.pinTitle || prettyUrl(site);

    return (<div
        draggable="true"
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        className={classNames("tile-outer", {active: isActive, dragover: this.state.dragOver})} key={site.guid || site.cache_key || index}>
      <a onClick={this.handleClick} className="tile" href={site.url} ref="topSiteLink">
        {screenshot && <div className="inner-border" />}
        {screenshot && <div ref="screenshot" className="screenshot" style={{backgroundImage: `url(${screenshot})`}} />}
        <SiteIcon
          ref="icon"
          className={siteIconClasses}
          site={site} faviconSize={faviconSize}
          showBackground={showBackground}
          border={!!screenshot || this._isTippyTop(site.favicon_url)} />

        <div ref="title" className={classNames("site-title", {pinned: site.isPinned})}>
          {site.isPinned && <div className="icon icon-pin-small" />}
          <div className="label">{label}</div>
        </div>
      </a>
      <div
        className="drop-zone"
        onDragOver={this.handleDragOver}
        onDragEnter={this.handleDragEnter}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop} />
      {!this.props.editMode &&
        <div>
          <div className="hover-menu">
            {site.isPinned &&
              <button
                ref="unpinButton"
                className="icon icon-unpin"
                title={this.props.intl.formatMessage({id: "edit_topsites_unpin_button"})}
                onClick={this.handlePin} />
            }
            <LinkMenuButton onClick={() => this.setState({showContextMenu: true, activeTile: index})} />
          </div>

          <LinkMenu
            visible={isActive}
            onUpdate={val => this.setState({showContextMenu: val})}
            site={site}
            page={this.props.page}
            source="TOP_SITES"
            index={index} />
        </div>
      }
      {this.props.editMode && site.type !== FIRST_RUN_TYPE &&
        <div className="hover-menu">
          {site.isPinned &&
            <button
              ref="unpinButton"
              className="icon icon-unpin"
              title={this.props.intl.formatMessage({id: "edit_topsites_unpin_button"})}
              onClick={this.handlePin} />
          }
          {!site.isPinned &&
            <button
              ref="pinButton"
              className="icon icon-pin"
              title={this.props.intl.formatMessage({id: "edit_topsites_pin_button"})}
              onClick={this.handlePin} />
          }
          <button
            ref="editButton"
            className="icon icon-edit"
            title={this.props.intl.formatMessage({id: "edit_topsites_edit_button"})}
            onClick={this.handleEdit} />
          <button
            ref="dismissButton"
            className="icon icon-dismiss"
            title={this.props.intl.formatMessage({id: "edit_topsites_dismiss_button"})}
            onClick={this.handleDismiss} />
        </div>
      }
  </div>);
  }
});

TopSitesItem.propTypes = {
  page: React.PropTypes.string,
  index: React.PropTypes.number,
  url: React.PropTypes.string.isRequired,
  favicon_url: React.PropTypes.string,
  onClick: React.PropTypes.func,
  onEdit: React.PropTypes.func,
  showNewStyle: React.PropTypes.bool,
  editMode: React.PropTypes.bool,
  isPinned: React.PropTypes.bool
};

const PlaceholderTopSitesItem = React.createClass({
  getInitialState() { return {dragOver: false}; },
  handleDragOver(e) {
    if (_allowDrop(e, this.props.index)) {
      e.preventDefault();
    }
  },
  handleDragEnter(e) {
    if (_allowDrop(e, this.props.index)) {
      e.preventDefault();
      this.setState({dragOver: true});
    }
  },
  handleDragLeave(e) {
    if (_allowDrop(e, this.props.index)) {
      e.preventDefault();
      this.setState({dragOver: false});
    }
  },
  handleDrop(e) {
    if (_allowDrop(e, this.props.index)) {
      e.preventDefault();
      this.setState({dragOver: false});
      this.props.dispatch(actions.RequestDropTopsite(
        e.dataTransfer.getData("text/topsite-url"),
        e.dataTransfer.getData("text/topsite-title"),
        this.props.index));
      this.props.dispatch(actions.NotifyEvent({
        event: "DROP_TOPSITE",
        page: "NEW_TAB",
        source: "TOP_SITES",
        action_position: this.props.index
      }));
    }
  },
  render() {
    return (
      <div
        className={classNames("tile-outer placeholder", {dragover: this.state.dragOver})}
        onDragOver={this.handleDragOver}
        onDragEnter={this.handleDragEnter}
        onDragLeave={this.handleDragLeave}
        onDrop={this.handleDrop}>
        <a className="tile">
          <PlaceholderSiteIcon />
        </a>
      </div>
    );
  }
});

const TopSites = React.createClass({
  getDefaultProps() {
    return {
      length: TOP_SITES_DEFAULT_LENGTH,
      // This is for event reporting
      page: "NEW_TAB",
      allowEdit: true,
      prefs: {}
    };
  },
  onClickFactory(index, site) {
    return () => {
      let payload = {
        event: "CLICK",
        page: this.props.page,
        source: "TOP_SITES",
        action_position: index,
        metadata_source: site.metadata_source
      };
      this.props.dispatch(actions.NotifyEvent(payload));
    };
  },
  render() {
    let sites = this.props.sites.slice(0, this.props.length);
    while (this.props.length > sites.length) {
      // Append null sites if necessary so we get placeholders for all slots.
      sites.push(null);
    }
    return (
      <CollapsibleSection className="top-sites" titleId="header_top_sites" prefName="collapseTopSites" prefs={this.props.prefs}>
        <div className="tiles-wrapper">
          {sites.map((site, i) => {
            // If the site is an empty slot (due to pinned sites and not not enough history)
            // or this is a placeholder, we want the widget to render empty
            if (!site || this.props.placeholder) {
              return (
                <PlaceholderTopSitesItem key={i} index={i} dispatch={this.props.dispatch} />
              );
            }

            return (<TopSitesItem
              index={i}
              key={site.guid || site.cache_key || i}
              page={this.props.page}
              onClick={this.onClickFactory(i, site)}
              showNewStyle={this.props.showNewStyle}
              dispatch={this.props.dispatch}
              intl={this.props.intl}
              {...site} />
            );
          })}
        </div>
        {!this.props.placeholder && this.props.allowEdit &&
          <EditTopSitesIntl {...this.props} />
        }
      </CollapsibleSection>
    );
  }
});

TopSites.propTypes = {
  length: React.PropTypes.number,
  page: React.PropTypes.string.isRequired,
  sites: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      url: React.PropTypes.string.isRequired,
      title: React.PropTypes.string,
      provider_name: React.PropTypes.string
    })
  ).isRequired,

  /**
   * Only display a placeholder version (ie just outlines/shapes), for use
   * before sufficient data is available to display.
   */
  placeholder: React.PropTypes.bool,

  showNewStyle: React.PropTypes.bool,
  allowEdit: React.PropTypes.bool,
  prefs: React.PropTypes.object
};

const EditTopSites = React.createClass({
  getDefaultProps() { return {dispatch: () => {}}; },
  getInitialState() {
    return {
      showEditModal: false,
      showAddForm: false,
      showEditForm: false,
      editIndex: -1 // Index of top site being edited
    };
  },
  toggleEdit() {
    const showingEdit = this.state.showEditModal;
    this.setState({showEditModal: !showingEdit});
    const event = showingEdit ? "CLOSE_EDIT_TOPSITES" : "OPEN_EDIT_TOPSITES";
    this.props.dispatch(actions.NotifyEvent({
      source: "TOP_SITES",
      event
    }));
  },
  toggleShowMorePref() {
    const prefIsOn = this.props.length === TOP_SITES_SHOWMORE_LENGTH;
    this.props.dispatch(actions.NotifyPrefChange("showMoreTopSites", !prefIsOn));
  },
  handleAddButtonClick() {
    this.setState({showAddForm: true});
    this.props.dispatch(actions.NotifyEvent({
      source: "TOP_SITES",
      event: "OPEN_ADD_TOPSITE_FORM"
    }));
  },
  handleAddFormClose() {
    this.setState({showAddForm: false});
  },
  handleEdit(index) {
    this.setState({showEditForm: true, editIndex: index});
    this.props.dispatch(actions.NotifyEvent({
      source: "TOP_SITES",
      event: "OPEN_EDIT_TOPSITE_FORM"
    }));
  },
  handleEditFormClose() {
    this.setState({showEditForm: false, editIndex: -1});
  },
  render() {
    let sites = this.props.sites.slice(0, this.props.length);
    while (this.props.length > sites.length) {
      // Append null sites if necessary so we get placeholders for all slots.
      sites.push(null);
    }
    return (
      <div className="edit-topsites-wrapper">
        <div className="edit-topsites-button">
          <button
            ref="editButton"
            title={this.props.intl.formatMessage({id: "edit_topsites_button_label"})}
            onClick={this.toggleEdit}>
            <FormattedMessage id="edit_topsites_button_text" />
          </button>
        </div>
        {this.state.showEditModal && !this.state.showAddForm && !this.state.showEditForm &&
          <div className="edit-topsites">
            <div className="modal-overlay" />
            <div className="modal" ref="modal">
              <section className="edit-topsites-inner-wrapper">
                <h3 className="section-title"><FormattedMessage id="header_top_sites" /></h3>
                <div className="tiles-wrapper">
                  {sites.map((site, i) => {
                    // If the site is an empty slot (due to pinned sites and not not enough history),
                    // we want the widget to render empty
                    if (!site) {
                      return (
                        <PlaceholderTopSitesItem key={i} index={i} dispatch={this.props.dispatch} />
                      );
                    }

                    return (<TopSitesItem
                      index={i}
                      key={site.guid || site.cache_key || i}
                      page={this.props.page}
                      onClick={(index, ev) => ev.preventDefault()}
                      showNewStyle={this.props.showNewStyle}
                      editMode={true}
                      onEdit={this.handleEdit}
                      dispatch={this.props.dispatch}
                      intl={this.props.intl}
                      {...site} />
                    );
                  })}
                </div>
              </section>
              <section className="actions">
                <button ref="addButton" onClick={this.handleAddButtonClick}>
                  <FormattedMessage id="edit_topsites_add_button" />
                </button>
                {this.props.length === TOP_SITES_DEFAULT_LENGTH &&
                  <button ref="showMoreButton" className="icon icon-topsites" onClick={this.toggleShowMorePref}>
                    <FormattedMessage id="edit_topsites_showmore_button" />
                  </button>
                }
                {this.props.length === TOP_SITES_SHOWMORE_LENGTH &&
                  <button ref="showLessButton" className="icon icon-topsites" onClick={this.toggleShowMorePref}>
                    <FormattedMessage id="edit_topsites_showless_button" />
                  </button>
                }
                <button ref="doneButton" className="done" onClick={this.toggleEdit}>
                  <FormattedMessage id="edit_topsites_done_button" />
                </button>
              </section>
            </div>
          </div>
        }
        {this.state.showEditModal && this.state.showAddForm &&
          <div className="edit-topsites">
            <div className="modal-overlay" />
            <div className="modal" ref="modal">
              <TopSiteForm onClose={this.handleAddFormClose} dispatch={this.props.dispatch} intl={this.props.intl} />
            </div>
          </div>
        }
        {this.state.showEditModal && this.state.showEditForm &&
          <div className="edit-topsites">
            <div className="modal-overlay" />
            <div className="modal" ref="modal">
              <TopSiteForm
                title={this.props.sites[this.state.editIndex].pinTitle || prettyUrl(this.props.sites[this.state.editIndex])}
                url={this.props.sites[this.state.editIndex].url}
                slotIndex={this.state.editIndex}
                editMode={true}
                onClose={this.handleEditFormClose}
                dispatch={this.props.dispatch}
                intl={this.props.intl} />
            </div>
          </div>
        }
      </div>
    );
  }
});

EditTopSites.propTypes = {
  length: React.PropTypes.number.isRequired,
  page: React.PropTypes.string.isRequired,
  sites: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      url: React.PropTypes.string.isRequired,
      title: React.PropTypes.string,
      provider_name: React.PropTypes.string
    })
  ).isRequired,

  showNewStyle: React.PropTypes.bool,

  dispatch: React.PropTypes.func
};

const EditTopSitesIntl = injectIntl(EditTopSites);

const TopSiteForm = React.createClass({
  getDefaultProps() {
    return {
      title: "",
      url: "",
      slotIndex: 0,
      editMode: false, // by default we are in "Add New Top Site" mode
      dispatch: () => {},
      onClose: () => {},
      prefs: {}
    };
  },
  getInitialState() {
    return {
      title: this.props.title || "",
      url: this.props.url || "",
      validationError: false
    };
  },
  handleTitleChange(event) {
    this.resetValidation();
    this.setState({"title": event.target.value});
  },
  handleUrlChange(event) {
    this.resetValidation();
    this.setState({"url": event.target.value});
  },
  handleCancel() {
    this.props.onClose();
  },
  handleAdd() {
    if (this.validateForm()) {
      let url = this.cleanUrl();
      this.props.dispatch(actions.RequestAddTopsite(url, this.state.title));
      this.props.dispatch(actions.NotifyEvent({
        source: "TOP_SITES",
        event: "ADD_TOPSITE"
      }));
      this.props.onClose();
    }
  },
  handleSave() {
    if (this.validateForm()) {
      let url = this.cleanUrl();
      this.props.dispatch(actions.RequestEditTopsite(url, this.state.title, this.props.slotIndex));
      this.props.dispatch(actions.NotifyEvent({
        source: "TOP_SITES",
        event: "EDIT_TOPSITE",
        action_position: this.props.slotIndex
      }));
      this.props.onClose();
    }
  },
  cleanUrl() {
    let url = this.state.url;
    // If we are missing a protocol, prepend http://
    if (!url.startsWith("http")) {
      url = `http://${url}`;
    }
    return url;
  },
  resetValidation() {
    if (this.state.validationError) {
      this.setState({validationError: false});
    }
  },
  validateUrl() {
    const pattern = new RegExp("^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
      "(\\#[\\/-a-z\\d_]*)?$", "i"); // fragment locater
    return pattern.test(this.state.url);
  },
  validateForm() {
    this.resetValidation();
    // Only the URL is required and must be valid.
    if (!this.state.url || !this.validateUrl()) {
      this.setState({validationError: "url"});
      this.refs["input-url"].focus();
      return false;
    }
    return true;
  },
  render() {
    return (
      <div className="topsite-form">
        <section className="edit-topsites-inner-wrapper">
          <div className="form-wrapper">
            <h3 className="section-title">
              <FormattedMessage id={this.props.editMode ? "topsites_form_edit_header" : "topsites_form_add_header"} />
            </h3>
            <div className="field title">
              <input
                type="text"
                ref="input-title"
                value={this.state.title}
                onChange={this.handleTitleChange}
                placeholder={this.props.intl.formatMessage({id: "topsites_form_title_placeholder"})} />
            </div>
            <div className={classNames("field url", {"invalid": this.state.validationError === "url"})}>
              <input
                type="text"
                ref="input-url"
                value={this.state.url}
                onChange={this.handleUrlChange}
                placeholder={this.props.intl.formatMessage({id: "topsites_form_url_placeholder"})} />
              {this.state.validationError === "url" &&
                <aside className="error-tooltip">
                  <FormattedMessage id="topsites_form_url_validation" />
                </aside>
              }
            </div>
          </div>
        </section>
        <section className="actions">
          <button ref="cancelButton" className="cancel" onClick={this.handleCancel}>
            <FormattedMessage id="topsites_form_cancel_button" />
          </button>
          {this.props.editMode &&
            <button ref="saveButton" className="save" onClick={this.handleSave}>
              <FormattedMessage id="topsites_form_save_button" />
            </button>
          }
          {!this.props.editMode &&
            <button ref="addButton" className="add" onClick={this.handleAdd}>
              <FormattedMessage id="topsites_form_add_button" />
            </button>
          }
        </section>
      </div>
    );
  }
});

TopSiteForm.propTypes = {
  title: React.PropTypes.string,
  url: React.PropTypes.string,
  slotIndex: React.PropTypes.number,
  editMode: React.PropTypes.bool,
  onClose: React.PropTypes.func,
  dispatch: React.PropTypes.func
};

module.exports = connect(justDispatch)(injectIntl(TopSites));
module.exports.TopSites = TopSites;
module.exports.TopSitesItem = TopSitesItem;
module.exports.PlaceholderTopSitesItem = PlaceholderTopSitesItem;
module.exports.EditTopSites = EditTopSites;
module.exports.TopSiteForm = TopSiteForm;

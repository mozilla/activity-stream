const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage, injectIntl} = require("react-intl");
const LinkMenu = require("content-src/components/LinkMenu/LinkMenu");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {perfService: perfSvc} = require("common/PerfService.jsm");
const {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH} = require("common/Reducers.jsm");
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
    this._timestampHandled = false;
  }

  componentDidMount() {
    this._maybeSendPaintedEvent();
  }

  componentDidUpdate() {
    this._maybeSendPaintedEvent();
  }

  /**
   * Call the given callback after the upcoming frame paints.
   *
   * @note Both setTimeout and requestAnimationFrame are throttled when the page
   * is hidden, so this callback may get called up to a second or so after the
   * requestAnimationFrame "paint" for hidden tabs.
   *
   * Newtabs hidden while loading will presumably be fairly rare (other than
   * preloaded tabs, which we will be filtering out on the server side), so such
   * cases should get lost in the noise.
   *
   * If we decide that it's important to find out when something that's hidden
   * has "painted", however, another option is to post a message to this window.
   * That should happen even faster than setTimeout, and, at least as of this
   * writing, it's not throttled in hidden windows in Firefox.
   *
   * @param {Function} callback
   *
   * @returns void
   */
  _afterFramePaint(callback) {
    requestAnimationFrame(() => setTimeout(callback, 0));
  }

  _maybeSendPaintedEvent() {
    // We don't want this to ever happen, but sometimes it does.  And when it
    // does (typically on the first newtab at startup time calling
    // componentDidMount), the paint(s) we care about will be later (eg
    // in a subsequent componentDidUpdate).
    if (!this.props.TopSites.initialized) {
      // XXX should send bad event
      return;
    }

    // If we've already handled a timestamp, don't do it again
    if (this._timestampHandled) {
      return;
    }

    // And if we haven't, we're doing so now, so remember that. Even if
    // something goes wrong in the callback, we can't try again, as we'd be
    // sending back the wrong data, and we have to do it here, so that other
    // calls to this method while waiting for the next frame won't also try to
    // handle handle it.
    this._timestampHandled = true;

    this._afterFramePaint(this._sendPaintedEvent);
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
      // to set this._timestampHandled to avoid going through this again.
    }
  }

  render() {
    return (<TopSites {...this.props} />);
  }
}

const TopSites = props => (<section className="top-sites">
  <h3 className="section-title"><span className={`icon icon-small-spacer icon-topsites`} /><FormattedMessage id="header_top_sites" /></h3>
  <ul className="top-sites-list">
    {props.TopSites.rows.slice(0, props.TopSitesCount).map((link, index) => link && <TopSite
      key={link.guid || link.url}
      dispatch={props.dispatch}
      link={link}
      index={index}
      intl={props.intl} />)}
  </ul>
  <TopSitesEditIntl {...props} />
</section>);

class TopSitesEdit extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showEditModal: false,
      showAddForm: false,
      showEditForm: false,
      editIndex: -1 // Index of top site being edited
    };
    this.onEditButtonClick = this.onEditButtonClick.bind(this);
    this.onShowMoreLessClick = this.onShowMoreLessClick.bind(this);
    this.onModalOverlayClick = this.onModalOverlayClick.bind(this);
    this.onAddButtonClick = this.onAddButtonClick.bind(this);
    this.onFormClose = this.onFormClose.bind(this);
    this.onEdit = this.onEdit.bind(this);
  }
  onEditButtonClick() {
    this.setState({showEditModal: !this.state.showEditModal});
    const event = this.state.showEditModal ? "TOP_SITES_EDIT_OPEN" : "TOP_SITES_EDIT_CLOSE";
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event
    }));
  }
  onModalOverlayClick() {
    this.setState({showEditModal: false, showAddForm: false, showEditForm: false});
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: "TOP_SITES_EDIT_CLOSE"
    }));
  }
  onShowMoreLessClick() {
    const prefIsSetToDefault = this.props.TopSitesCount === TOP_SITES_DEFAULT_LENGTH;
    this.props.dispatch(ac.SendToMain({
      type: at.SET_PREF,
      data: {name: "topSitesCount", value: prefIsSetToDefault ? TOP_SITES_SHOWMORE_LENGTH : TOP_SITES_DEFAULT_LENGTH}
    }));
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: prefIsSetToDefault ? "TOP_SITES_EDIT_SHOW_MORE" : "TOP_SITES_EDIT_SHOW_LESS"
    }));
  }
  onAddButtonClick() {
    this.setState({showAddForm: true});
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: "TOP_SITES_ADD_FORM_OPEN"
    }));
  }
  onFormClose() {
    this.setState({showAddForm: false, showEditForm: false});
  }
  onEdit(index) {
    this.setState({showEditForm: true, editIndex: index});
    this.props.dispatch(ac.UserEvent({
      source: TOP_SITES_SOURCE,
      event: "TOP_SITES_EDIT_FORM_OPEN"
    }));
  }
  render() {
    return (<div className="edit-topsites-wrapper">
      <div className="edit-topsites-button">
        <button
          className="edit"
          title={this.props.intl.formatMessage({id: "edit_topsites_button_label"})}
          onClick={this.onEditButtonClick}>
          <FormattedMessage id="edit_topsites_button_text" />
        </button>
      </div>
      {this.state.showEditModal && !this.state.showAddForm && !this.state.showEditForm &&
        <div className="edit-topsites">
          <div className="modal-overlay" onClick={this.onModalOverlayClick} />
          <div className="modal">
            <section className="edit-topsites-inner-wrapper">
              <h3 className="section-title"><span className={`icon icon-small-spacer icon-topsites`} /><FormattedMessage id="header_top_sites" /></h3>
              <ul className="top-sites-list">
                {this.props.TopSites.rows.slice(0, this.props.TopSitesCount).map((link, index) => link && <TopSite
                  key={link.guid || link.url}
                  dispatch={this.props.dispatch}
                  link={link}
                  index={index}
                  intl={this.props.intl}
                  onEdit={this.onEdit}
                  editMode={true} />)}
              </ul>
            </section>
            <section className="actions">
              <button className="add" onClick={this.onAddButtonClick}>
                <FormattedMessage id="edit_topsites_add_button" />
              </button>
              <button className={`icon icon-topsites show-${this.props.TopSitesCount === TOP_SITES_DEFAULT_LENGTH ? "more" : "less"}`} onClick={this.onShowMoreLessClick}>
                <FormattedMessage id={`edit_topsites_show${this.props.TopSitesCount === TOP_SITES_DEFAULT_LENGTH ? "more" : "less"}_button`} />
              </button>
              <button className="done" onClick={this.onEditButtonClick}>
                <FormattedMessage id="edit_topsites_done_button" />
              </button>
            </section>
          </div>
        </div>
      }
      {this.state.showEditModal && this.state.showAddForm &&
        <div className="edit-topsites">
          <div className="modal-overlay" onClick={this.onModalOverlayClick} />
          <div className="modal">
            <TopSiteForm onClose={this.onFormClose} dispatch={this.props.dispatch} intl={this.props.intl} />
          </div>
        </div>
      }
      {this.state.showEditModal && this.state.showEditForm &&
        <div className="edit-topsites">
          <div className="modal-overlay" onClick={this.onModalOverlayClick} />
          <div className="modal">
            <TopSiteForm
              label={this.props.TopSites.rows[this.state.editIndex].label || this.props.TopSites.rows[this.state.editIndex].hostname}
              url={this.props.TopSites.rows[this.state.editIndex].url}
              index={this.state.editIndex}
              editMode={true}
              onClose={this.onFormClose}
              dispatch={this.props.dispatch}
              intl={this.props.intl} />
          </div>
        </div>
      }
    </div>);
  }
}

const TopSitesEditIntl = injectIntl(TopSitesEdit);

class TopSiteForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      label: props.label || "",
      url: props.url || "",
      validationError: false
    };
    this.onLabelChange = this.onLabelChange.bind(this);
    this.onUrlChange = this.onUrlChange.bind(this);
    this.onCancelButtonClick = this.onCancelButtonClick.bind(this);
    this.onAddButtonClick = this.onAddButtonClick.bind(this);
    this.onSaveButtonClick = this.onSaveButtonClick.bind(this);
    this.onUrlInputMount = this.onUrlInputMount.bind(this);
  }
  onLabelChange(event) {
    this.resetValidation();
    this.setState({"label": event.target.value});
  }
  onUrlChange(event) {
    this.resetValidation();
    this.setState({"url": event.target.value});
  }
  onCancelButtonClick(ev) {
    ev.preventDefault();
    this.props.onClose();
  }
  onAddButtonClick(ev) {
    ev.preventDefault();
    if (this.validateForm()) {
      let site = {url: this.cleanUrl()};
      if (this.state.label !== "") {
        site.label = this.state.label;
      }
      this.props.dispatch(ac.SendToMain({
        type: at.TOP_SITES_ADD,
        data: {site}
      }));
      this.props.dispatch(ac.UserEvent({
        source: TOP_SITES_SOURCE,
        event: "TOP_SITES_ADD"
      }));
      this.props.onClose();
    }
  }
  onSaveButtonClick(ev) {
    ev.preventDefault();
    if (this.validateForm()) {
      let site = {url: this.cleanUrl()};
      if (this.state.label !== "") {
        site.label = this.state.label;
      }
      this.props.dispatch(ac.SendToMain({
        type: at.TOP_SITES_PIN,
        data: {site, index: this.props.index}
      }));
      this.props.dispatch(ac.UserEvent({
        source: TOP_SITES_SOURCE,
        event: "TOP_SITES_EDIT",
        action_position: this.props.index
      }));
      this.props.onClose();
    }
  }
  cleanUrl() {
    let url = this.state.url;
    // If we are missing a protocol, prepend http://
    if (!url.startsWith("http:") && !url.startsWith("https:")) {
      url = `http://${url}`;
    }
    return url;
  }
  resetValidation() {
    if (this.state.validationError) {
      this.setState({validationError: false});
    }
  }
  validateUrl() {
    try {
      return !!new URL(this.cleanUrl());
    } catch (e) {
      return false;
    }
  }
  validateForm() {
    this.resetValidation();
    // Only the URL is required and must be valid.
    if (!this.state.url || !this.validateUrl()) {
      this.setState({validationError: true});
      this.inputUrl.focus();
      return false;
    }
    return true;
  }
  onUrlInputMount(input) {
    this.inputUrl = input;
  }
  render() {
    return (
      <form className="topsite-form">
        <section className="edit-topsites-inner-wrapper">
          <div className="form-wrapper">
            <h3 className="section-title">
              <FormattedMessage id={this.props.editMode ? "topsites_form_edit_header" : "topsites_form_add_header"} />
            </h3>
            <div className="field title">
              <input
                type="text"
                value={this.state.label}
                onChange={this.onLabelChange}
                placeholder={this.props.intl.formatMessage({id: "topsites_form_title_placeholder"})} />
            </div>
            <div className={`field url${this.state.validationError ? " invalid" : ""}`}>
              <input
                type="text"
                ref={this.onUrlInputMount}
                value={this.state.url}
                onChange={this.onUrlChange}
                placeholder={this.props.intl.formatMessage({id: "topsites_form_url_placeholder"})} />
              {this.state.validationError &&
                <aside className="error-tooltip">
                  <FormattedMessage id="topsites_form_url_validation" />
                </aside>
              }
            </div>
          </div>
        </section>
        <section className="actions">
          <button className="cancel" type="button" onClick={this.onCancelButtonClick}>
            <FormattedMessage id="topsites_form_cancel_button" />
          </button>
          {this.props.editMode &&
            <button className="done save" type="submit" onClick={this.onSaveButtonClick}>
              <FormattedMessage id="topsites_form_save_button" />
            </button>
          }
          {!this.props.editMode &&
            <button className="done add" type="submit" onClick={this.onAddButtonClick}>
              <FormattedMessage id="topsites_form_add_button" />
            </button>
          }
        </section>
      </form>
    );
  }
}

TopSiteForm.defaultProps = {
  label: "",
  url: "",
  index: 0,
  editMode: false // by default we are in "Add New Top Site" mode
};

module.exports = connect(state => ({TopSites: state.TopSites, TopSitesCount: state.Prefs.values.topSitesCount}))(TopSitesPerfTimer);
module.exports._unconnected = TopSitesPerfTimer;
module.exports.TopSite = TopSite;
module.exports.TopSites = TopSites;
module.exports.TopSitesEdit = TopSitesEdit;
module.exports.TopSiteForm = TopSiteForm;

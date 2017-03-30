const React = require("react");
const {connect} = require("react-redux");
const {justDispatch} = require("common/selectors/selectors");
const {actions} = require("common/action-manager");
const classNames = require("classnames");
const LinkMenu = require("components/LinkMenu/LinkMenu");
const LinkMenuButton = require("components/LinkMenuButton/LinkMenuButton");
const {PlaceholderSiteIcon, SiteIcon} = require("components/SiteIcon/SiteIcon");
const {prettyUrl} = require("lib/utils");
const {injectIntl, FormattedMessage} = require("react-intl");
const {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH} = require("common/constants");
const {FIRST_RUN_TYPE} = require("lib/first-run-data");

const FULL_WIDTH = 96;
const TIPPY_TOP_WIDTH = 80;

const TopSitesItem = React.createClass({
  getInitialState() {
    return {
      showContextMenu: false,
      activeTile: null
    };
  },
  getDefaultProps() {
    return {
      onClick() {},
      editMode: false
    };
  },
  _isTippyTop(favicon_url) {
    // If it starts with favicons/images or resource:// then it's a tippy top icon.
    // FIXME: long term we want the metadata parser to pass along where the image came from.
    return favicon_url && (favicon_url.startsWith("favicons/images") || favicon_url.startsWith("resource://"));
  },
  _faviconSize(site, topSitesExperimentIsOn, screenshot) {
    let faviconSize = 32;
    if (topSitesExperimentIsOn && !screenshot) {
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
  handleDismiss() {
    this.props.dispatch(actions.NotifyBlockURL(this.props.url));
  },
  handleEdit() {
    // TODO: See issue #1987
    alert("Editing Top Sites is coming soon! And yes, the icon is missing :)"); // eslint-disable-line no-alert
  },
  handlePin() {
    // TODO: See issue #2274
    alert("Pinning Top Sites is coming soon! And yes, the icon is missing :)"); // eslint-disable-line no-alert
  },
  render() {
    const site = this.props;
    const index = site.index;
    const isActive = this.state.showContextMenu && this.state.activeTile === index;

    const topSitesExperimentIsOn = this.props.showNewStyle;
    const screenshot = topSitesExperimentIsOn && site.screenshot;
    const faviconSize = this._faviconSize(site, topSitesExperimentIsOn, screenshot);
    const showBackground = faviconSize < FULL_WIDTH;

    // The top-corner class puts the site icon in the top corner, overlayed over the screenshot.
    const siteIconClasses = classNames("tile-img-container", {
      "top-corner": screenshot,
      "full-width": !screenshot && faviconSize === FULL_WIDTH
    });

    const label = prettyUrl(site);

    return (<div className="tile-outer" key={site.guid || site.cache_key || index}>
      <a onClick={ev => this.props.onClick(index, ev)} className={classNames("tile", {active: isActive})} href={site.url} ref="topSiteLink">
        {screenshot && <div className="inner-border" />}
        {screenshot && <div ref="screenshot" className="screenshot" style={{backgroundImage: `url(${screenshot})`}} />}
        <SiteIcon
          ref="icon"
          className={siteIconClasses}
          site={site} faviconSize={faviconSize}
          showTitle={!screenshot}
          showBackground={showBackground}
          border={!topSitesExperimentIsOn || !!screenshot || this._isTippyTop(site.favicon_url)} />

        {screenshot && <div ref="title" className="site-title">{label}</div>}
      </a>
      {!this.props.editMode &&
        <div>
          <LinkMenuButton onClick={() => this.setState({showContextMenu: true, activeTile: index})} />
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
        <div className="edit-menu">
          <button
            ref="pinButton"
            className="icon icon-pin"
            title={this.props.intl.formatMessage({id: "edit_topsites_pin_button"})}
            onClick={this.handlePin} />
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
  showNewStyle: React.PropTypes.bool,
  editMode: React.PropTypes.bool
};

const PlaceholderTopSitesItem = React.createClass({
  render() {
    return (
      <div className="tile-outer placeholder">
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
      allowEdit: true
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
    const sites = this.props.sites.slice(0, this.props.length);
    return (<section className="top-sites">
      <h3 className="section-title"><FormattedMessage id="header_top_sites" /></h3>
      <div className="tiles-wrapper">
        {sites.map((site, i) => {
          // if this is a placeholder, we want all the widgets to render empty
          if (this.props.placeholder) {
            return (
              <PlaceholderTopSitesItem key={site.guid || site.cache_key || i} />
            );
          }

          return (<TopSitesItem
            index={i}
            key={site.guid || site.cache_key || i}
            page={this.props.page}
            onClick={this.onClickFactory(i, site)}
            showNewStyle={this.props.showNewStyle}
            dispatch={this.props.dispatch}
            {...site} />
          );
        })}
      </div>
      {!this.props.placeholder && this.props.allowEdit &&
        <EditTopSitesIntl {...this.props} />
      }
    </section>);
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
  allowEdit: React.PropTypes.bool
};

const EditTopSites = React.createClass({
  getDefaultProps() { return {dispatch: () => {}}; },
  getInitialState() { return {showEdit: false}; },
  toggleEdit() {
    const showingEdit = this.state.showEdit;
    this.setState({showEdit: !showingEdit});
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
  render() {
    const sites = this.props.sites.slice(0, this.props.length);
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
        {this.state.showEdit &&
          <div className="edit-topsites">
            <div className="modal-overlay" />
            <div className="modal" ref="modal">
              <section className="edit-topsites-inner-wrapper">
                <h3 className="section-title"><FormattedMessage id="header_top_sites" /></h3>
                <div className="tiles-wrapper">
                  {sites.map((site, i) => (<TopSitesItem
                      index={i}
                      key={site.guid || site.cache_key || i}
                      page={this.props.page}
                      onClick={(index, ev) => ev.preventDefault()}
                      showNewStyle={this.props.showNewStyle}
                      editMode={true}
                      dispatch={this.props.dispatch}
                      intl={this.props.intl}
                      {...site} />
                    )
                  )}
                </div>
              </section>
              <section className="actions">
                {this.props.length === TOP_SITES_DEFAULT_LENGTH &&
                  <button ref="showMoreButton" onClick={this.toggleShowMorePref}>
                    <FormattedMessage id="edit_topsites_showmore_button" />
                  </button>
                }
                {this.props.length === TOP_SITES_SHOWMORE_LENGTH &&
                  <button ref="showLessButton" onClick={this.toggleShowMorePref}>
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

module.exports = connect(justDispatch)(TopSites);
module.exports.TopSites = TopSites;
module.exports.TopSitesItem = TopSitesItem;
module.exports.PlaceholderTopSitesItem = PlaceholderTopSitesItem;
module.exports.EditTopSites = EditTopSites;

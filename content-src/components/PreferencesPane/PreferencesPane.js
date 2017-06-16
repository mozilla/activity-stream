const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");
const {justDispatch} = require("common/selectors/selectors");
const {injectIntl, FormattedMessage} = require("react-intl");
const classNames = require("classnames");

const PreferencesPane = React.createClass({
  getDefaultProps() { return {dispatch: () => {}}; },
  getInitialState() { return {showPane: false}; },
  componentDidMount() {
    document.addEventListener("click", this.handleClickOutside);
  },
  componentWillUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  handleClickOutside(event) {
    // if we are showing the sidebar and there is a click outside, close it.
    if (this.state.showPane && !this.refs.wrapper.contains(event.target)) {
      this.togglePane();
    }
  },
  handleChange(event) {
    const target = event.target;
    this.props.dispatch(actions.NotifyPrefChange(target.name, target.checked));
  },
  togglePane() {
    const showingPane = this.state.showPane;
    this.setState({showPane: !showingPane});
    const event = showingPane ? "CLOSE_NEWTAB_PREFS" : "OPEN_NEWTAB_PREFS";
    this.props.dispatch(actions.NotifyEvent({
      source: "NEW_TAB",
      event
    }));
  },
  render() {
    const props = this.props;
    const {showSearch, showTopSites, showPocket, showHighlights, showBookmarks, showVisitAgain, showMoreTopSites} = props.Prefs.prefs;

    return (
      <div className="prefs-pane-wrapper" ref="wrapper">
        <div className="prefs-pane-button">
          <button
            ref="prefs-button"
            className={classNames("icon", {"icon-settings": !this.state.showPane, "icon-dismiss": this.state.showPane})}
            title={this.props.intl.formatMessage({id: this.state.showPane ? "settings_pane_done_button" : "settings_pane_button_label"})}
            onClick={this.togglePane} />
        </div>
        <div className="prefs-pane">
          <div className={classNames("sidebar", {hidden: !this.state.showPane})} ref="sidebar">
            <div className="sidebar-inner-wrapper">
              <div className="prefs-modal-inner-wrapper">
                <h1><FormattedMessage id="settings_pane_header" /></h1>
                <p><FormattedMessage id="settings_pane_body" /></p>
                <section>
                  <input ref="showSearchCheckbox" type="checkbox" id="showSearch" name="showSearch" checked={showSearch} onChange={this.handleChange} />
                  <label htmlFor="showSearch">
                    <FormattedMessage id="settings_pane_search_header" />
                  </label>
                  <p><FormattedMessage id="settings_pane_search_body" /></p>
                </section>
                <section className={showTopSites ? "" : "disabled"}>
                  <input ref="showTopSitesCheckbox" type="checkbox" id="showTopSites" name="showTopSites" checked={showTopSites} onChange={this.handleChange} />
                  <label htmlFor="showTopSites">
                    <FormattedMessage id="settings_pane_topsites_header" />
                  </label>
                  <p><FormattedMessage id="settings_pane_topsites_body" /></p>
                  <div className="options">
                    <input ref="showMoreTopSites" type="checkbox" id="showMoreTopSites" name="showMoreTopSites" checked={showMoreTopSites} onChange={this.handleChange} disabled={!showTopSites} />
                    <label htmlFor="showMoreTopSites" className="icon icon-topsites">
                      <FormattedMessage id="settings_pane_topsites_options_showmore" />
                    </label>
                  </div>
                </section>
                <section>
                  <input ref="showPocketCheckbox" type="checkbox" id="showPocket" name="showPocket" checked={showPocket} onChange={this.handleChange} />
                  <label htmlFor="showPocket">
                    <FormattedMessage id="settings_pane_pocketstories_header" />
                  </label>
                  <p><FormattedMessage id="settings_pane_pocketstories_body" /></p>
                </section>
                <section>
                  <input ref="showHighlightsCheckbox" type="checkbox" id="showHighlights" name="showHighlights" checked={showHighlights} onChange={this.handleChange} />
                  <label htmlFor="showHighlights">
                    <FormattedMessage id="settings_pane_highlights_header" />
                  </label>
                  <p><FormattedMessage id="settings_pane_highlights_body" /></p>
                </section>
                <section>
                  <input ref="showBookmarksCheckbox" type="checkbox" id="showBookmarks" name="showBookmarks" checked={showBookmarks} onChange={this.handleChange} />
                  <label htmlFor="showBookmarks">
                    <FormattedMessage id="settings_pane_bookmarks_header" />
                  </label>
                  <p><FormattedMessage id="settings_pane_bookmarks_body" /></p>
                </section>
                <section>
                  <input ref="showVisitAgainCheckbox" type="checkbox" id="showVisitAgain" name="showVisitAgain" checked={showVisitAgain} onChange={this.handleChange} />
                  <label htmlFor="showVisitAgain">
                    <FormattedMessage id="settings_pane_visit_again_header" />
                  </label>
                  <p><FormattedMessage id="settings_pane_visit_again_body" /></p>
                </section>
              </div>
              <section className="actions">
                <button ref="done-button" className="done" onClick={this.togglePane}>
                  <FormattedMessage id="settings_pane_done_button" />
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>);
  }
});

PreferencesPane.propTypes = {Prefs: React.PropTypes.object.isRequired};

module.exports = connect(justDispatch)(injectIntl(PreferencesPane));
module.exports.PreferencesPane = PreferencesPane;

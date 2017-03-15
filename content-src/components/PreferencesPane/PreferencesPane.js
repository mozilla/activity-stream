const React = require("react");
const {connect} = require("react-redux");
const {actions} = require("common/action-manager");
const {justDispatch} = require("common/selectors/selectors");
const {injectIntl, FormattedMessage} = require("react-intl");

const PreferencesPane = React.createClass({
  getDefaultProps() {
    return {};
  },
  getInitialState() {return {showPane: false};},
  handleChange(event) {
    const target = event.target;
    this.props.dispatch(actions.NotifyPrefChange(target.name, target.checked));
  },
  togglePane() {
    this.setState({showPane: !this.state.showPane});
  },
  render() {
    const {showSearch, showTopSites, showHighlights} = this.props.Prefs.prefs;

    return (
      <div className="prefs-pane-wrapper">
        <div className="prefs-pane-button">
          <button
            ref="prefs-button"
            className="icon icon-settings"
            title={this.props.intl.formatMessage({id: "settings_pane_button_label"})}
            onClick={this.togglePane} />
        </div>
        {this.state.showPane &&
          <div className="prefs-pane">
            <div className="modal-overlay" />
            <div className="modal" ref="modal">
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
                <section>
                  <input ref="showTopSitesCheckbox" type="checkbox" id="showTopSites" name="showTopSites" checked={showTopSites} onChange={this.handleChange} />
                  <label htmlFor="showTopSites">
                    <FormattedMessage id="settings_pane_topsites_header" />
                  </label>
                  <p><FormattedMessage id="settings_pane_topsites_body" /></p>
                </section>
                <section>
                  <input ref="showHighlightsCheckbox" type="checkbox" id="showHighlights" name="showHighlights" checked={showHighlights} onChange={this.handleChange} />
                  <label htmlFor="showHighlights">
                    <FormattedMessage id="settings_pane_highlights_header" />
                  </label>
                  <p><FormattedMessage id="settings_pane_highlights_body" /></p>
                </section>
              </div>
              <section className="actions">
                <button ref="done-button" className="done" onClick={this.togglePane}>
                  <FormattedMessage id="settings_pane_done_button" />
                </button>
              </section>
            </div>
          </div>
        }
      </div>);
  }
});

PreferencesPane.propTypes = {Prefs: React.PropTypes.object.isRequired};

module.exports = connect(justDispatch)(injectIntl(PreferencesPane));
module.exports.PreferencesPane = PreferencesPane;

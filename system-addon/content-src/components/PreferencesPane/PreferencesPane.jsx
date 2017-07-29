const React = require("react");
const {connect} = require("react-redux");
const {injectIntl, FormattedMessage} = require("react-intl");
const {actionCreators: ac} = require("common/Actions.jsm");

const PreferencesInput = props => (
  <section>
    <input type="checkbox" id={props.prefName} name={props.prefName} checked={props.value} onChange={props.onChange} className={props.className} />
    <label htmlFor={props.prefName}>
      <FormattedMessage id={props.titleStringId} values={props.titleStringValues} />
    </label>
    {props.descStringId && <p className="prefs-input-description"><FormattedMessage id={props.descStringId} /></p>}
  </section>
);

class PreferencesPane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {visible: false};
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.togglePane = this.togglePane.bind(this);

    // TODO This is temporary until sections register their PreferenceInput component automatically
    try {
      this.topStoriesOptions = JSON.parse(props.Prefs.values["feeds.section.topstories.options"]);
    } catch (e) {
      console.error("Problem parsing feeds.section.topstories.options", e); // eslint-disable-line no-console
    }
  }
  componentDidMount() {
    document.addEventListener("click", this.handleClickOutside);
  }
  componentWillUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  }
  handleClickOutside(event) {
    // if we are showing the sidebar and there is a click outside, close it.
    if (this.state.visible && !this.refs.wrapper.contains(event.target)) {
      this.togglePane();
    }
  }
  handleChange(event) {
    const target = event.target;
    this.props.dispatch(ac.SetPref(target.name, target.checked));
  }
  togglePane() {
    this.setState({visible: !this.state.visible});
    const event = this.state.visible ? "CLOSE_NEWTAB_PREFS" : "OPEN_NEWTAB_PREFS";
    this.props.dispatch(ac.UserEvent({event}));
  }
  render() {
    const props = this.props;
    const prefs = props.Prefs.values;
    const isVisible = this.state.visible;

    // Show prefs for top stories only if we have some top story option and
    // either it should be shown by default or it was already turned on
    const showTopStoriesPref = this.topStoriesOptions &&
      (this.topStoriesOptions.shownByDefault || prefs["feeds.section.topstories"]);

    return (
      <div className="prefs-pane-wrapper" ref="wrapper">
        <div className="prefs-pane-button">
          <button
            className={`prefs-button icon ${isVisible ? "icon-dismiss" : "icon-settings"}`}
            title={props.intl.formatMessage({id: isVisible ? "settings_pane_done_button" : "settings_pane_button_label"})}
            onClick={this.togglePane} />
        </div>
        <div className="prefs-pane">
          <div className={`sidebar ${isVisible ? "" : "hidden"}`}>
            <div className="prefs-modal-inner-wrapper">
              <h1><FormattedMessage id="settings_pane_header" /></h1>
              <p><FormattedMessage id="settings_pane_body" /></p>

              <PreferencesInput className="showSearch" prefName="showSearch" value={prefs.showSearch} onChange={this.handleChange}
                titleStringId="settings_pane_search_header" descStringId="settings_pane_search_body" />

              <PreferencesInput className="showTopSites" prefName="showTopSites" value={prefs.showTopSites} onChange={this.handleChange}
                titleStringId="settings_pane_topsites_header" descStringId="settings_pane_topsites_body" />

              {showTopStoriesPref &&
                <PreferencesInput className="showTopStories" prefName="feeds.section.topstories"
                  value={prefs["feeds.section.topstories"]} onChange={this.handleChange}
                  titleStringId="header_recommended_by" titleStringValues={{provider: this.topStoriesOptions.provider_name}}
                  descStringId={this.topStoriesOptions.provider_description} />}
            </div>
            <section className="actions">
              <button className="done" onClick={this.togglePane}>
                <FormattedMessage id="settings_pane_done_button" />
              </button>
            </section>
          </div>
        </div>
      </div>);
  }
}

module.exports = connect(state => ({Prefs: state.Prefs}))(injectIntl(PreferencesPane));
module.exports.PreferencesPane = PreferencesPane;
module.exports.PreferencesInput = PreferencesInput;

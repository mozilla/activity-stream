const React = require("react");
const {connect} = require("react-redux");
const {injectIntl, FormattedMessage} = require("react-intl");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");

const getFormattedMessage = message =>
  (typeof message === "string" ? <span>{message}</span> : <FormattedMessage {...message} />);

const PreferencesInput = props => (
  <section>
    <input type="checkbox" id={props.prefName} name={props.prefName} checked={props.value} onChange={props.onChange} className={props.className} />
    <label htmlFor={props.prefName}>
      {getFormattedMessage(props.titleString)}
    </label>
    {props.descString && <p className="prefs-input-description">
      {getFormattedMessage(props.descString)}
    </p>}
  </section>
);

class PreferencesPane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {visible: false};
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handlePrefChange = this.handlePrefChange.bind(this);
    this.handleSectionChange = this.handleSectionChange.bind(this);
    this.togglePane = this.togglePane.bind(this);
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
  handlePrefChange(event) {
    const target = event.target;
    this.props.dispatch(ac.SetPref(target.name, target.checked));
  }
  handleSectionChange(event) {
    const target = event.target;
    const id = target.name;
    const type = target.checked ? at.SECTION_ENABLE : at.SECTION_DISABLE;
    this.props.dispatch(ac.SendToMain({type, data: id}));
  }
  togglePane() {
    this.setState({visible: !this.state.visible});
    const event = this.state.visible ? "CLOSE_NEWTAB_PREFS" : "OPEN_NEWTAB_PREFS";
    this.props.dispatch(ac.UserEvent({event}));
  }
  render() {
    const props = this.props;
    const prefs = props.Prefs.values;
    const sections = props.Sections;
    const isVisible = this.state.visible;
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

              <PreferencesInput className="showSearch" prefName="showSearch" value={prefs.showSearch} onChange={this.handlePrefChange}
                titleString={{id: "settings_pane_search_header"}} descString={{id: "settings_pane_search_body"}} />

              <PreferencesInput className="showTopSites" prefName="showTopSites" value={prefs.showTopSites} onChange={this.handlePrefChange}
                titleString={{id: "settings_pane_topsites_header"}} descString={{id: "settings_pane_topsites_body"}} />

              {sections
                .filter(section => !section.shouldHidePref)
                .map(({id, title, enabled, pref}) =>
                  <PreferencesInput key={id} className="showSection" prefName={(pref && pref.feed) || id}
                    value={enabled} onChange={(pref && pref.feed) ? this.handlePrefChange : this.handleSectionChange}
                    titleString={(pref && pref.titleString) || title} descString={pref && pref.descString} />)}

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

module.exports = connect(state => ({Prefs: state.Prefs, Sections: state.Sections}))(injectIntl(PreferencesPane));
module.exports.PreferencesPane = PreferencesPane;
module.exports.PreferencesInput = PreferencesInput;

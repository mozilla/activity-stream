import {actionCreators as ac, actionTypes as at} from "common/Actions.jsm";
import {FormattedMessage, injectIntl} from "react-intl";
import {TOP_SITES_DEFAULT_LENGTH, TOP_SITES_SHOWMORE_LENGTH} from "common/Reducers.jsm";
import {connect} from "react-redux";
import React from "react";

const getFormattedMessage = message =>
  (typeof message === "string" ? <span>{message}</span> : <FormattedMessage {...message} />);

export const PreferencesInput = props => (
  <section>
    <input type="checkbox" id={props.prefName} name={props.prefName} checked={props.value} disabled={props.disabled} onChange={props.onChange} className={props.className} />
    <label htmlFor={props.prefName} className={props.labelClassName}>
      {getFormattedMessage(props.titleString)}
    </label>
    {props.descString && <p className="prefs-input-description">
      {getFormattedMessage(props.descString)}
    </p>}
    {React.Children.map(props.children,
      child => <div className={`options${child.props.disabled ? " disabled" : ""}`}>{child}</div>)}
  </section>
);

export class _PreferencesPane extends React.PureComponent {
  constructor(props) {
    super(props);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handlePrefChange = this.handlePrefChange.bind(this);
    this.handleSectionChange = this.handleSectionChange.bind(this);
    this.togglePane = this.togglePane.bind(this);
    this.onWrapperMount = this.onWrapperMount.bind(this);
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.PreferencesPane.visible !== this.props.PreferencesPane.visible) {
      // While the sidebar is open, listen for all document clicks.
      if (this.isSidebarOpen()) {
        document.addEventListener("click", this.handleClickOutside);
      } else {
        document.removeEventListener("click", this.handleClickOutside);
      }
    }
  }
  isSidebarOpen() {
    return this.props.PreferencesPane.visible;
  }
  handleClickOutside(event) {
    // if we are showing the sidebar and there is a click outside, close it.
    if (this.isSidebarOpen() && !this.wrapper.contains(event.target)) {
      this.togglePane();
    }
  }
  handlePrefChange(event) {
    const target = event.target;
    const {name, checked} = target;
    let value = checked;
    if (name === "topSitesCount") {
      value = checked ? TOP_SITES_SHOWMORE_LENGTH : TOP_SITES_DEFAULT_LENGTH;
    }
    this.props.dispatch(ac.SetPref(name, value));
  }
  handleSectionChange(event) {
    const target = event.target;
    const id = target.name;
    const type = target.checked ? at.SECTION_ENABLE : at.SECTION_DISABLE;
    this.props.dispatch(ac.SendToMain({type, data: id}));
  }
  togglePane() {
    if (this.isSidebarOpen()) {
      this.props.dispatch({type: at.SETTINGS_CLOSE});
      this.props.dispatch(ac.UserEvent({event: "CLOSE_NEWTAB_PREFS"}));
    } else {
      this.props.dispatch({type: at.SETTINGS_OPEN});
      this.props.dispatch(ac.UserEvent({event: "OPEN_NEWTAB_PREFS"}));
    }
  }
  onWrapperMount(wrapper) {
    this.wrapper = wrapper;
  }
  render() {
    const props = this.props;
    const prefs = props.Prefs.values;
    const sections = props.Sections;
    const isVisible = this.isSidebarOpen();
    return (
      <div className="prefs-pane-wrapper" ref={this.onWrapperMount}>
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
              <p><FormattedMessage id="settings_pane_body2" /></p>

              <PreferencesInput
                className="showSearch"
                prefName="showSearch"
                value={prefs.showSearch}
                onChange={this.handlePrefChange}
                titleString={{id: "settings_pane_search_header"}}
                descString={{id: "settings_pane_search_body"}} />

              <hr />

              <PreferencesInput
                className="showTopSites"
                prefName="showTopSites"
                value={prefs.showTopSites}
                onChange={this.handlePrefChange}
                titleString={{id: "settings_pane_topsites_header"}}
                descString={{id: "settings_pane_topsites_body"}}>

                <PreferencesInput
                  className="showMoreTopSites"
                  prefName="topSitesCount"
                  disabled={!prefs.showTopSites}
                  value={prefs.topSitesCount !== TOP_SITES_DEFAULT_LENGTH}
                  onChange={this.handlePrefChange}
                  titleString={{id: "settings_pane_topsites_options_showmore"}}
                  labelClassName="icon icon-topsites" />
              </PreferencesInput>

              {sections
                .filter(section => !section.shouldHidePref)
                .map(({id, title, enabled, pref}) =>
                  (<PreferencesInput
                    key={id}
                    className="showSection"
                    prefName={(pref && pref.feed) || id}
                    value={enabled}
                    onChange={(pref && pref.feed) ? this.handlePrefChange : this.handleSectionChange}
                    titleString={(pref && pref.titleString) || title}
                    descString={pref && pref.descString}>

                    {pref.nestedPrefs && pref.nestedPrefs.map(nestedPref =>
                      (<PreferencesInput
                        key={nestedPref.name}
                        prefName={nestedPref.name}
                        disabled={!enabled}
                        value={prefs[nestedPref.name]}
                        onChange={this.handlePrefChange}
                        titleString={nestedPref.titleString}
                        labelClassName={`icon ${nestedPref.icon}`} />)
                    )}
                   </PreferencesInput>)
                )}
              {!prefs.disableSnippets && <hr />}

              {!prefs.disableSnippets && <PreferencesInput className="showSnippets" prefName="feeds.snippets"
                value={prefs["feeds.snippets"]} onChange={this.handlePrefChange}
                titleString={{id: "settings_pane_snippets_header"}}
                descString={{id: "settings_pane_snippets_body"}} />}

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

export const PreferencesPane = connect(state => ({
  Prefs: state.Prefs,
  PreferencesPane: state.PreferencesPane,
  Sections: state.Sections
}))(injectIntl(_PreferencesPane));

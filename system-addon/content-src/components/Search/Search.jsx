/* globals ContentSearchUIController */
"use strict";
const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage, injectIntl} = require("react-intl");
const {actionCreators: ac} = require("common/Actions.jsm");

class Search extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.onInputMount = this.onInputMount.bind(this);
  }

  handleEvent(event) {
    // Also track search events with our own telemetry
    if (event.detail.type === "Search") {
      this.props.dispatch(ac.UserEvent({event: "SEARCH"}));
    }
  }
  onClick(event) {
    this.controller.search(event);
  }
  onInputMount(input) {
    if (input) {
      // ContentSearchUIController component:
      // https://dxr.mozilla.org/mozilla-central/rev/7d2e89fb92331d7e4296391213c1e63db628e046/browser/base/content/contentSearchUI.js#16
      // "activitystream" parameter is meant for FHR (Firefox Health Report) and is the key under which data is stored
      // in the telemetry tab.
      // "newtab" indicates the context of the search (where the search is triggered from in the UI).
      this.controller = new ContentSearchUIController(input, input.parentNode, "activitystream", "newtab");
      addEventListener("ContentSearchClient", this);
    } else {
      this.controller = null;
      removeEventListener("ContentSearchClient", this);
    }
  }

  /*
   * Do not change the ID on the input field, as legacy newtab code
   * specifically looks for the id 'newtab-search-text' on input fields
   * in order to execute searches in various tests
   */
  render() {
    return (<div className="search-wrapper">
      <label htmlFor="newtab-search-text" className="search-label">
        <span className="sr-only"><FormattedMessage id="search_web_placeholder" /></span>
      </label>
      <input
        id="newtab-search-text"
        maxLength="256"
        placeholder={this.props.intl.formatMessage({id: "search_web_placeholder"})}
        ref={this.onInputMount}
        title={this.props.intl.formatMessage({id: "search_web_placeholder"})}
        type="search" />
        <button
          className="search-button"
          onClick={this.onClick}
          title={this.props.intl.formatMessage({id: "search_button"})}>
          <span className="sr-only"><FormattedMessage id="search_button" /></span>
        </button>
    </div>);
  }
}

module.exports = connect()(injectIntl(Search));
module.exports._unconnected = Search;

/* globals ContentSearchUIController */
"use strict";
const React = require("react");
const {connect} = require("react-redux");
const {FormattedMessage, injectIntl} = require("react-intl");
const {actionCreators: ac, actionTypes: at} = require("common/Actions.jsm");
const {IS_NEWTAB} = require("content-src/lib/constants");

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
    window.gContentSearchController.search(event);
  }
  componentWillUnmount() {
    delete window.gContentSearchController;
  }
  onInputMount(input) {
    if (input) {
      // The "healthReportKey" and needs to be "newtab" or "abouthome" so that
      // BrowserUsageTelemetry.jsm knows to handle events with this name, and
      // can add the appropriate telemetry probes for search. Without the correct
      // name, certain tests like browser_UsageTelemetry_content.js will fail
      // (See github ticket #2348 for more details)
      const healthReportKey = IS_NEWTAB ? "newtab" : "abouthome";

      // The "searchSource" needs to be "newtab" or "homepage" and is sent with
      // the search data and acts as context for the search request (See
      // nsISearchEngine.getSubmission). It is necessary so that search engine
      // plugins can correctly atribute referrals. (See github ticket #3321 for
      // more details)
      const searchSource = IS_NEWTAB ? "newtab" : "homepage";

      // gContentSearchController needs to exist as a global so that tests for
      // the existing about:home can find it; and so it allows these tests to pass.
      // In the future, when activity stream is default about:home, this can be renamed
      window.gContentSearchController = new ContentSearchUIController(input, input.parentNode,
        healthReportKey, searchSource);
      addEventListener("ContentSearchClient", this);

      // Focus the search box if we are on about:home
      if (!IS_NEWTAB) {
        input.focus();
        // Tell the addon side that search box is focused in case the browser
        // needs to be focused too.
        this.props.dispatch(ac.SendToMain({type: at.SEARCH_BOX_FOCUSED}));
      }
    } else {
      window.gContentSearchController = null;
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
          id="searchSubmit"
          className="search-button"
          onClick={this.onClick}
          title={this.props.intl.formatMessage({id: "search_button"})}>
          <span className="sr-only"><FormattedMessage id="search_button" /></span>
        </button>
    </div>);
  }
}

// initialized is passed to props so that Search will rerender when it receives strings
module.exports = connect(state => ({locale: state.App.locale}))(injectIntl(Search));
module.exports._unconnected = Search;
